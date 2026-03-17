import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TagVerificationService } from '../../service/tag-verification.service';
import { TagVerificationItem } from '../../models/tag-verification.model';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { environment } from '../../../../../../environments/environment';

@Component({
    selector: 'app-tag-verifications',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './tag-verifications.html',
    styleUrls: ['./tag-verifications.scss']
})
export class TagVerificationsComponent implements OnInit {
    private verificationService = inject(TagVerificationService);
    private cdr = inject(ChangeDetectorRef);
    private toastService = inject(ToastService);
    protected readonly environment = environment;

    requests: TagVerificationItem[] = [];
    isLoading = false;
    currentPage = 1;
    pageSize = 20;
    totalCount = 0;
    totalPages = 0;
    hasInitialized = false;

    // Search & Filter
    searchTerm = '';

    // Decision Modal/State
    selectedRequest: TagVerificationItem | null = null;
    adminComment = '';
    isProcessingAction = false;

    ngOnInit() {
        this.loadRequests();
    }

    loadRequests(page: number = 1) {
        this.currentPage = page;
        this.isLoading = true;
        this.cdr.detectChanges();

        this.verificationService.getPendingRequests(this.currentPage, this.pageSize).subscribe({
            next: (res: any) => {
                if (res.isSuccess || res.IsSuccess) {
                    this.requests = res.data || res.Data || [];
                    this.totalCount = res.totalCount ?? res.TotalCount ?? 0;
                    this.totalPages = res.totalPages ?? res.TotalPages ?? 0;
                }
                this.isLoading = false;
                this.hasInitialized = true;
                this.cdr.detectChanges();
            },
            error: () => {
                this.toastService.error('Failed to load verification requests');
                this.isLoading = false;
                this.hasInitialized = true;
                this.cdr.detectChanges();
            }
        });
    }

    // Client-side filtering as an addition to API results
    get filteredRequests() {
        if (!this.searchTerm) return this.requests;
        const term = this.searchTerm.toLowerCase();
        return this.requests.filter(r =>
            r.requester?.username?.toLowerCase().includes(term) ||
            r.requester?.fullName?.toLowerCase().includes(term) ||
            r.tag?.name?.toLowerCase().includes(term)
        );
    }

    openResolveModal(request: TagVerificationItem) {
        this.selectedRequest = request;
        this.adminComment = '';
    }

    closeResolveModal() {
        this.selectedRequest = null;
    }

    handleResolve(approved: boolean) {
        if (!this.selectedRequest) return;

        const requestId = this.selectedRequest.requestId || (this.selectedRequest as any).RequestId;
        if (!requestId) {
            this.toastService.error('Invalid Request ID');
            return;
        }

        this.isProcessingAction = true;
        this.verificationService.resolveRequest({
            RequestId: requestId,
            Approved: approved,
            AdminComment: this.adminComment
        }).subscribe({
            next: (res: any) => {
                const isSuccess = res.isSuccess || res.IsSuccess;
                if (isSuccess) {
                    this.toastService.success(approved ? 'Request approved successfully' : 'Request rejected successfully');
                    this.closeResolveModal();
                    this.loadRequests(this.currentPage);
                } else {
                    const errorMsg = res.error?.message || res.Error?.Message || 'Action failed';
                    this.toastService.error(errorMsg);
                }
                this.isProcessingAction = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.toastService.error('Network error while processing request');
                this.isProcessingAction = false;
                this.cdr.detectChanges();
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
