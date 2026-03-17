import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostsService } from '../../../../../posts/services/posts';
import { Router } from '@angular/router';
import { ToastService } from '../../../../../../../../shared/services/toast.service';

@Component({
    selector: 'app-agent-requests',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './agent-requests.component.html',
    styleUrls: ['./agent-requests.component.scss']
})
export class AgentRequestsComponent implements OnInit {

    private postsService = inject(PostsService);
    private router = inject(Router);
    private toastService = inject(ToastService);

    requests: any[] = [];
    filteredRequests: any[] = [];
    isLoading = false;
    searchQuery = '';
    updatingStatus: { [key: number]: boolean } = {};
    expandedRequestId: number | null = null;

    statusOptions = [
        { id: 0, name: 'Pending', class: 'status-new', icon: 'bi-dot' },
        { id: 1, name: 'Contacted', class: 'status-replied', icon: 'bi-check' },
        { id: 2, name: 'In Progress', class: 'status-progress', icon: 'bi-hourglass' },
        { id: 3, name: 'Completed', class: 'status-completed', icon: 'bi-check-all' },
        { id: 4, name: 'Cancelled', class: 'status-cancelled', icon: 'bi-x-circle' }
    ];

    // Pagination
    currentPage = 1;
    pageSize = 20;

    ngOnInit() {
        this.loadRequests();
    }

    loadRequests() {
        this.isLoading = true;
        this.postsService.getHousingAgentRequests(this.currentPage, this.pageSize).subscribe({
            next: (res: any) => {
                this.isLoading = false;
                if (res.isSuccess && res.data) {
                    // Flatten standard array response if inside "data" or directly
                    const data = (Array.isArray(res.data) ? res.data : (res.data as any).items) || res.data;
                    this.requests = Array.isArray(data) ? data : [];
                    this.applyFilter();
                }
            },
            error: () => {
                this.isLoading = false;
            }
        });
    }

    onSearchChange() {
        this.applyFilter();
    }

    applyFilter() {
        if (!this.searchQuery.trim()) {
            this.filteredRequests = [...this.requests];
            return;
        }
        const query = this.searchQuery.toLowerCase();
        this.filteredRequests = this.requests.filter(req =>
            (req.name && req.name.toLowerCase().includes(query)) ||
            (req.email && req.email.toLowerCase().includes(query)) ||
            (req.housingInfo?.title && req.housingInfo.title.toLowerCase().includes(query))
        );
    }

    getHouseholdType(type: number): string {
        const types = ['Individual', 'Couple', 'Single Family', 'Multi Family'];
        return types[type] || 'Unknown';
    }

    getContactType(type: number): string {
        const types = ['Email', 'Phone', 'Text'];
        return types[type] || 'Email';
    }

    getStatusClass(statusId: number): string {
        const option = this.statusOptions.find(o => o.id === statusId);
        return option ? option.class : 'status-new';
    }

    getNeighborhood(req: any): string {
        if (!req.housingInfo) return 'N/A';
        return req.housingInfo.neighborhood || req.housingInfo.borough || 'New York';
    }

    toggleExpand(requestId: number) {
        this.expandedRequestId = this.expandedRequestId === requestId ? null : requestId;
    }

    getContactTypeLabel(type: number): string {
        const labels = ['Email', 'Phone', 'Text'];
        return labels[type] || 'Email';
    }

    getHouseholdLabel(type: number): string {
        const labels = ['Individual', 'Couple', 'Single Family', 'Multi Family'];
        return labels[type] || 'Individual';
    }

    formatCurrency(value: number): string {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
    }

    viewPost(postId: number) {
        if (postId) {
            this.router.navigate(['/public/housing/details', postId]);
        }
    }

    copyToClipboard(text: string, label: string) {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            this.toastService.success(`${label} copied to clipboard!`);
        }, () => {
            this.toastService.error(`Failed to copy ${label}`);
        });
    }

    onStatusChange(request: any, newStatus: string | number) {
        const statusId = Number(newStatus);
        this.updatingStatus[request.id] = true;

        this.postsService.updateHousingRequestStatus(request.id, statusId).subscribe({
            next: (res: any) => {
                this.updatingStatus[request.id] = false;
                if (res.isSuccess) {
                    this.toastService.success('Status updated successfully');
                    request.status = statusId;
                } else {
                    this.toastService.error(res.error?.message || 'Failed to update status');
                }
            },
            error: () => {
                this.updatingStatus[request.id] = false;
                this.toastService.error('An error occurred while updating status');
            }
        });
    }
}
