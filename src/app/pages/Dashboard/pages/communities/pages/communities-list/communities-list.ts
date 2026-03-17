import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommunityDashboardDto, CommunityType } from '../../models/community-dashboard.model';
import { CommunityDashboardService } from '../../service/community-dashboard.service';
import { ToastService } from '../../../../../../shared/services/toast.service';

@Component({
    selector: 'app-communities-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './communities-list.html',
    styleUrls: ['./communities-list.scss']
})
export class CommunitiesListComponent implements OnInit {
    private communitiesService = inject(CommunityDashboardService);
    private cdr = inject(ChangeDetectorRef);
    private toastService = inject(ToastService);
    public Math = Math;

    communities: CommunityDashboardDto[] = [];

    // Filtering & Search
    searchTerm = '';
    selectedType?: CommunityType;
    hasDisbandRequest?: boolean;

    // Pagination Metadata
    currentPage = 1;
    pageSize = 10;
    totalPages = 0;
    totalCount = 0;
    isLoading = false;

    // Stats
    stats = [
        { title: 'Total Communities', value: 0, icon: 'bi-people-fill', color: 'gold' },
        { title: 'Disband Requests', value: 0, icon: 'bi-exclamation-triangle-fill', color: 'red' },
        { title: 'Private Groups', value: 0, icon: 'bi-lock-fill', color: 'blue' }
    ];

    communityTypes = [
        { label: 'All Types', value: undefined },
        { label: 'District', value: CommunityType.District },
        { label: 'Neighborhood', value: CommunityType.Neighborhood },
        { label: 'Local Service', value: CommunityType.LocalService },
        { label: 'Housing Help', value: CommunityType.HousingHelp },
        { label: 'Public Resources', value: CommunityType.PublicResources },
        { label: 'Civic Notices', value: CommunityType.CivicNotices },
        { label: 'Safety Alerts', value: CommunityType.SafetyAlerts },
        { label: 'Community Boards', value: CommunityType.CommunityBoards },
        { label: 'Youth Resources', value: CommunityType.YouthResources },
        { label: 'Senior Resources', value: CommunityType.SeniorResources },
        { label: 'Family Support', value: CommunityType.FamilySupport },
        { label: 'Accessibility', value: CommunityType.Accessibility }
    ];

    ngOnInit() {
        this.loadData();
    }

    loadData(page: number = 1) {
        this.currentPage = page;
        this.isLoading = true;
        this.cdr.detectChanges();

        this.communitiesService
            .getCommunities(
                this.currentPage,
                this.pageSize,
                this.searchTerm,
                this.selectedType,
                undefined,
                this.hasDisbandRequest
            )
            .subscribe({
                next: (res) => {
                    if (res.isSuccess && res.data) {
                        this.communities = res.data.data || [];
                        this.totalPages = res.data.totalPages || 0;
                        this.totalCount = res.data.totalCount || 0;

                        // Update Stats
                        this.stats[0].value = this.totalCount;
                        this.stats[1].value = this.communities.filter(c => c.hasPendingDisbandRequest).length; // This is only for the current page though, but better than nothing
                        this.stats[2].value = this.communities.filter(c => c.isPrivate).length;
                    }
                    this.isLoading = false;
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('Network Error:', err);
                    this.toastService.error('Failed to load communities data');
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            });
    }

    onSearch() {
        this.loadData(1);
    }

    onTypeChange() {
        this.loadData(1);
    }

    onDisbandFilterChange() {
        this.loadData(1);
    }

    getCommunityTypeName(type?: CommunityType): string {
        if (type === undefined || type === null) return 'N/A';
        // Handle camelCase conversion from original PascalCase string from enum
        const name = CommunityType[type];
        return name?.replace(/([A-Z])/g, ' $1').trim() || 'N/A';
    }

    getTypeBadgeClass(type?: CommunityType): string {
        switch (type) {
            case CommunityType.District:
            case CommunityType.Neighborhood:
                return 'bg-primary';
            case CommunityType.LocalService:
            case CommunityType.PublicResources:
                return 'bg-info';
            case CommunityType.HousingHelp:
            case CommunityType.FamilySupport:
                return 'bg-success';
            case CommunityType.CivicNotices:
            case CommunityType.CommunityBoards:
                return 'bg-secondary';
            case CommunityType.SafetyAlerts:
                return 'bg-danger';
            case CommunityType.YouthResources:
            case CommunityType.SeniorResources:
            case CommunityType.Accessibility:
                return 'bg-warning text-dark';
            default: return 'bg-light text-dark';
        }
    }
}
