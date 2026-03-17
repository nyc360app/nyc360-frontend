import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RssService } from '../../services/rss';
import { RssRequest, RssRequestUpdate } from '../../models/rss';
import { CATEGORY_THEMES } from '../../../../../Public/Widgets/feeds/models/categories';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-rss-requests',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './rss-requests.html',
    styleUrls: ['./rss-requests.scss']
})
export class RssRequestsComponent implements OnInit {
    private rssService = inject(RssService);
    private cdr = inject(ChangeDetectorRef);

    requests: RssRequest[] = [];
    isLoading = true;
    errorMessage = '';

    // Pagination
    page = 1;
    pageSize = 10;
    totalCount = 0;
    totalPages = 0;
    statusFilter: number | undefined = undefined;

    // Modals / Action states
    showActionModal = false;
    showReplyModal = false;
    selectedRequest: RssRequest | null = null;
    adminNote = '';
    actionStatus = 1; // 1 = Approve, 2 = Reject (example)

    categories = CATEGORY_THEMES;

    ngOnInit() {
        this.loadRequests();
    }

    loadRequests() {
        this.isLoading = true;
        this.rssService.getRssRequests(this.page, this.pageSize, this.statusFilter).subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    this.requests = res.data;
                    this.totalCount = res.totalCount;
                    this.totalPages = res.totalPages;
                } else {
                    this.errorMessage = res.error?.message || 'Failed to load requests';
                }
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.errorMessage = 'Network error occurred';
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    getCategoryLabel(id: number): string {
        return (this.categories as any)[id]?.label || 'Unknown';
    }

    onPageChange(newPage: number) {
        this.page = newPage;
        this.loadRequests();
    }

    onFilterChange() {
        this.page = 1;
        this.loadRequests();
    }

    openActionModal(request: RssRequest, status: number) {
        this.selectedRequest = request;
        this.actionStatus = status;
        this.adminNote = '';
        this.showActionModal = true;
    }

    submitAction() {
        if (!this.selectedRequest) return;

        const updateData: RssRequestUpdate = {
            id: this.selectedRequest.id,
            status: this.actionStatus,
            adminNote: this.adminNote
        };

        this.rssService.updateRssRequestStatus(updateData).subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    this.showActionModal = false;
                    this.loadRequests();
                } else {
                    alert('Error: ' + (res.error?.message || 'Update failed'));
                }
            },
            error: () => alert('Network error')
        });
    }

    openReplyModal(request: RssRequest) {
        this.selectedRequest = request;
        this.adminNote = request.adminNote || '';
        this.showReplyModal = true;
    }

    submitReply() {
        if (!this.selectedRequest) return;

        const updateData: RssRequestUpdate = {
            id: this.selectedRequest.id,
            status: this.selectedRequest.status, // Keep current status
            adminNote: this.adminNote
        };

        this.rssService.updateRssRequestStatus(updateData).subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    this.showReplyModal = false;
                    this.loadRequests();
                } else {
                    alert('Error: ' + (res.error?.message || 'Update failed'));
                }
            },
            error: () => alert('Network error')
        });
    }


    getStatusLabel(status: number): string {
        switch (status) {
            case 0: return 'Pending';
            case 1: return 'Approved';
            case 2: return 'Rejected';
            default: return 'Unknown';
        }
    }

    getStatusClass(status: number): string {
        switch (status) {
            case 0: return 'status-pending';
            case 1: return 'status-approved';
            case 2: return 'status-rejected';
            default: return '';
        }
    }
}
