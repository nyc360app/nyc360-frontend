import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../../../environments/environment';
import { ToastService } from '../../../../../../shared/services/toast.service';
import {
  TagVerificationItem,
  ResolveTagVerification
} from '../../../tags/models/tag-verification.model';
import { TagVerificationService } from '../../../tags/service/tag-verification.service';

@Component({
  selector: 'app-identity-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './identity-reviews.html',
  styleUrls: [
    '../../../tags/pages/tag-verifications/tag-verifications.scss',
    './identity-reviews.scss'
  ]
})
export class IdentityReviewsComponent implements OnInit {
  private verificationService = inject(TagVerificationService);
  private toastService = inject(ToastService);
  protected readonly environment = environment;

  requests: TagVerificationItem[] = [];
  isLoading = false;
  hasInitialized = false;
  currentPage = 1;
  pageSize = 20;
  totalPages = 0;

  searchTerm = '';
  selectedRequest: TagVerificationItem | null = null;
  adminComment = '';
  isProcessingAction = false;

  private readonly identityTagIds = new Set([1, 2, 3]);

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(page: number = 1): void {
    this.currentPage = page;
    this.isLoading = true;

    this.verificationService.getPendingRequests(this.currentPage, this.pageSize).subscribe({
      next: (res: any) => {
        if (!(res?.isSuccess || res?.IsSuccess)) {
          this.toastService.error(
            res?.error?.message
            || res?.Error?.Message
            || 'Failed to load identity verification requests.'
          );
          this.requests = [];
          this.totalPages = 0;
          this.isLoading = false;
          this.hasInitialized = true;
          return;
        }

        const data = res?.data || res?.Data || [];
        this.requests = (Array.isArray(data) ? data : []).filter((item) =>
          this.identityTagIds.has(Number(item?.tag?.id ?? item?.tag?.Id))
        );
        this.totalPages = res?.totalPages ?? res?.TotalPages ?? 0;
        this.isLoading = false;
        this.hasInitialized = true;
      },
      error: () => {
        this.toastService.error('Failed to load identity verification requests.');
        this.requests = [];
        this.totalPages = 0;
        this.isLoading = false;
        this.hasInitialized = true;
      }
    });
  }

  get filteredRequests(): TagVerificationItem[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.requests;
    }

    return this.requests.filter((request) =>
      String(request.requester?.username || '').toLowerCase().includes(term)
      || String(request.requester?.fullName || '').toLowerCase().includes(term)
      || String(request.tag?.name || '').toLowerCase().includes(term)
      || String(request.reason || '').toLowerCase().includes(term)
    );
  }

  get totalCount(): number {
    return this.filteredRequests.length;
  }

  openResolveModal(request: TagVerificationItem): void {
    this.selectedRequest = request;
    this.adminComment = '';
  }

  closeResolveModal(): void {
    if (this.isProcessingAction) return;
    this.selectedRequest = null;
    this.adminComment = '';
  }

  handleResolve(approved: boolean): void {
    if (!this.selectedRequest || this.isProcessingAction) return;

    const payload: ResolveTagVerification = {
      RequestId: this.selectedRequest.requestId,
      Approved: approved,
      AdminComment: this.adminComment
    };

    this.isProcessingAction = true;
    this.verificationService.resolveRequest(payload).subscribe({
      next: (res: any) => {
        this.isProcessingAction = false;
        if (res?.isSuccess || res?.IsSuccess) {
          this.toastService.success(approved ? 'Identity verification approved.' : 'Identity verification rejected.');
          this.closeResolveModal();
          this.loadRequests(this.currentPage);
          return;
        }

        this.toastService.error(
          res?.error?.message
          || res?.Error?.Message
          || 'Unable to process the identity verification.'
        );
      },
      error: () => {
        this.isProcessingAction = false;
        this.toastService.error('Network error while processing the identity verification.');
      }
    });
  }

  getDocUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${this.environment.apiBaseUrl3}/${path}`;
  }

  getRequesterImage(path: string): string {
    if (!path) return 'assets/images/default-avatar.png';
    if (path.startsWith('http')) return path;
    return `${this.environment.apiBaseUrl3}/${path}`;
  }
}
