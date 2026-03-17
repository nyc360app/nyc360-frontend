import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommunityDisbandRequestDto, DisbandRequestStatus } from '../../models/community-dashboard.model';
import { CommunityDashboardService } from '../../service/community-dashboard.service';
import { ToastService } from '../../../../../../shared/services/toast.service';

@Component({
    selector: 'app-disband-requests',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './disband-requests.html',
    styleUrls: ['./disband-requests.scss']
})
export class DisbandRequestsComponent implements OnInit {
    private communitiesService = inject(CommunityDashboardService);
    private cdr = inject(ChangeDetectorRef);
    private toastService = inject(ToastService);

    requests: CommunityDisbandRequestDto[] = [];

    // Filtering
    selectedStatus?: DisbandRequestStatus = DisbandRequestStatus.Pending;

    // Pagination
    currentPage = 1;
    pageSize = 10;
    totalPages = 0;
    totalCount = 0;
    isLoading = false;

    // Processing Modal / State
    isProcessing = false;
    selectedRequest?: CommunityDisbandRequestDto;
    adminNotes: string = '';

    requestStatuses = [
        { label: 'Pending Approval', value: DisbandRequestStatus.Pending },
        { label: 'Approved', value: DisbandRequestStatus.Approved },
        { label: 'Rejected', value: DisbandRequestStatus.Rejected },
        { label: 'All', value: undefined }
    ];

    ngOnInit() {
        this.loadData();
    }

    loadData(page: number = 1) {
        this.currentPage = page;
        this.isLoading = true;
        this.cdr.detectChanges();

        this.communitiesService.getDisbandRequests(
            this.currentPage,
            this.pageSize,
            this.selectedStatus
        ).subscribe({
            next: (res) => {
                if (res.isSuccess && res.data) {
                    this.requests = res.data.data || [];
                    this.totalPages = res.data.totalPages || 0;
                    this.totalCount = res.data.totalCount || 0;
                }
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.toastService.error('Failed to load disband requests');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    openProcessModal(request: CommunityDisbandRequestDto) {
        this.selectedRequest = request;
        this.adminNotes = '';
        // In a real app, you'd trigger a Bootstrap modal here
        // For now, we'll use a simple confirmation flow or a conditional UI element
    }

    processRequest(approved: boolean) {
        if (!this.selectedRequest) return;

        const action = approved ? 'approve' : 'reject';
        if (!confirm(`Are you sure you want to ${action} this disband request?`)) return;

        this.isProcessing = true;
        this.communitiesService.processDisbandRequest(this.selectedRequest.id, {
            approved,
            adminNotes: this.adminNotes
        }).subscribe({
            next: (res) => {
                if (res.isSuccess || res.succeeded) {
                    this.toastService.success(`Request ${action}ed successfully`);
                    this.selectedRequest = undefined;
                    this.loadData(this.currentPage);
                } else {
                    this.toastService.error(res.message || `Failed to ${action} request`);
                }
                this.isProcessing = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.toastService.error(`Error processing request`);
                this.isProcessing = false;
                this.cdr.detectChanges();
            }
        });
    }

    getStatusBadgeClass(status: DisbandRequestStatus): string {
        switch (status) {
            case DisbandRequestStatus.Pending: return 'bg-warning text-dark';
            case DisbandRequestStatus.Approved: return 'bg-success';
            case DisbandRequestStatus.Rejected: return 'bg-danger';
            default: return 'bg-secondary';
        }
    }

    getStatusName(status: DisbandRequestStatus): string {
        return DisbandRequestStatus[status];
    }
}
