import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../../../environments/environment';
import { ToastService } from '../../../../../../shared/services/toast.service';
import {
  CommunityLeaderApplicationDetailsDto,
  CommunityLeaderApplicationStatus,
  CommunityLeaderApplicationSummaryDto
} from '../../models/community-dashboard.model';
import { CommunityDashboardService } from '../../service/community-dashboard.service';

@Component({
  selector: 'app-community-applications',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './community-applications.html',
  styleUrls: [
    '../../../tags/pages/tag-verifications/tag-verifications.scss',
    './community-applications.scss'
  ]
})
export class CommunityApplicationsComponent implements OnInit {
  private communityDashboardService = inject(CommunityDashboardService);
  private toastService = inject(ToastService);

  requests: CommunityLeaderApplicationSummaryDto[] = [];
  selectedRequest: CommunityLeaderApplicationSummaryDto | null = null;
  selectedRequestDetails: CommunityLeaderApplicationDetailsDto | null = null;

  isLoading = false;
  isLoadingDetails = false;
  isProcessingAction = false;
  hasInitialized = false;

  searchTerm = '';
  statusFilter: CommunityLeaderApplicationStatus = 'Pending';
  adminComment = '';

  currentPage = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;

  readonly statuses: CommunityLeaderApplicationStatus[] = ['Pending', 'Approved', 'Rejected'];

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(page: number = 1): void {
    this.currentPage = page;
    this.isLoading = true;

    this.communityDashboardService.getLeaderApplications(this.currentPage, this.pageSize, this.statusFilter).subscribe({
      next: (res: any) => {
        if (!(res?.isSuccess || res?.IsSuccess)) {
          this.toastService.error(
            res?.error?.message
            || res?.Error?.Message
            || 'Failed to load community leader applications.'
          );
          this.requests = [];
          this.totalCount = 0;
          this.totalPages = 0;
          this.isLoading = false;
          this.hasInitialized = true;
          return;
        }

        const inner = res?.data || res?.Data || {};
        this.requests = inner?.data || inner?.Data || [];
        this.totalCount = inner?.totalCount ?? inner?.TotalCount ?? 0;
        this.totalPages = inner?.totalPages ?? inner?.TotalPages ?? 0;
        this.isLoading = false;
        this.hasInitialized = true;
      },
      error: (error) => {
        this.toastService.error(
          error?.error?.message
          || error?.error?.error?.message
          || 'Failed to load community leader applications.'
        );
        this.requests = [];
        this.totalCount = 0;
        this.totalPages = 0;
        this.isLoading = false;
        this.hasInitialized = true;
      }
    });
  }

  onStatusChange(): void {
    this.loadRequests(1);
  }

  get filteredRequests(): CommunityLeaderApplicationSummaryDto[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.requests;
    }

    return this.requests.filter((request) =>
      String(request.applicantName || '').toLowerCase().includes(term)
      || String(request.applicantUsername || '').toLowerCase().includes(term)
      || String(request.email || '').toLowerCase().includes(term)
      || String(request.communityName || '').toLowerCase().includes(term)
      || String(request.location || '').toLowerCase().includes(term)
    );
  }

  openDetails(request: CommunityLeaderApplicationSummaryDto): void {
    this.selectedRequest = request;
    this.selectedRequestDetails = null;
    this.adminComment = '';
    this.isLoadingDetails = true;

    this.communityDashboardService.getLeaderApplicationDetails(request.applicationId).subscribe({
      next: (res: any) => {
        if (!(res?.isSuccess || res?.IsSuccess)) {
          this.toastService.error(
            res?.error?.message
            || res?.Error?.Message
            || 'Failed to load leader application details.'
          );
          this.closeDetails();
          return;
        }

        this.selectedRequestDetails = res?.data || res?.Data || null;
        this.adminComment = this.selectedRequestDetails?.adminNotes || '';
        this.isLoadingDetails = false;
      },
      error: (error) => {
        this.toastService.error(
          error?.error?.message
          || error?.error?.error?.message
          || 'Failed to load leader application details.'
        );
        this.closeDetails();
      }
    });
  }

  closeDetails(): void {
    if (this.isProcessingAction) return;

    this.selectedRequest = null;
    this.selectedRequestDetails = null;
    this.adminComment = '';
    this.isLoadingDetails = false;
  }

  handleResolve(approved: boolean): void {
    const request = this.selectedRequestDetails || this.selectedRequest;
    if (!request || this.isProcessingAction) {
      return;
    }

    this.isProcessingAction = true;
    this.communityDashboardService.reviewLeaderApplication(request.applicationId, {
      approved,
      adminNotes: this.adminComment.trim() || undefined
    }).subscribe({
      next: (res: any) => {
        this.isProcessingAction = false;
        if (res?.isSuccess || res?.IsSuccess) {
          this.toastService.success(
            approved
              ? 'Community leader application approved.'
              : 'Community leader application rejected.'
          );
          this.closeDetails();
          this.loadRequests(this.currentPage);
          return;
        }

        this.toastService.error(
          res?.error?.message
          || res?.Error?.Message
          || 'Unable to review the community leader application.'
        );
      },
      error: (error) => {
        this.isProcessingAction = false;
        this.toastService.error(
          error?.error?.message
          || error?.error?.error?.message
          || 'Unable to review the community leader application.'
        );
      }
    });
  }

  getVerificationFileUrl(path: string | null | undefined): string {
    if (!path) {
      return '';
    }

    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    const apiBase = String(environment.apiBaseUrl || '').replace(/\/+$/, '');
    const apiHostBase = apiBase.replace(/\/api$/i, '');
    const normalizedPath = String(path)
      .replace(/^\/+/, '')
      .replace(/^community-leader-applications\/+/i, '');

    return `${apiHostBase}/community-leader-applications/${normalizedPath}`;
  }
}
