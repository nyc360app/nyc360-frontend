import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommunityDetailsDto, CommunityType, CommunityMemberDto } from '../../models/community-dashboard.model';
import { CommunityDashboardService } from '../../service/community-dashboard.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { environment } from '../../../../../../environments/environment';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

@Component({
    selector: 'app-community-moderation',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './community-moderation.html',
    styleUrls: ['./community-moderation.scss']
})
export class CommunityModerationComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private communitiesService = inject(CommunityDashboardService);
    private cdr = inject(ChangeDetectorRef);
    private toastService = inject(ToastService);

    communityId!: number;
    community?: CommunityDetailsDto;
    leaders: CommunityMemberDto[] = [];
    isLoading = true;
    isLoadingLeaders = false;

    // User Search
    userSearchQuery = '';
    searchResults: CommunityMemberDto[] = [];
    isSearchingUsers = false;
    showSearchModal = false;
    private searchSubject = new Subject<string>();

    ngOnInit() {
        this.communityId = Number(this.route.snapshot.paramMap.get('id'));
        if (this.communityId) {
            this.loadDetails();
            this.loadLeaders();
        }

        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(query => {
                if (!query || query.length < 2) {
                    this.searchResults = [];
                    return [];
                }
                this.isSearchingUsers = true;
                return this.communitiesService.searchCommunityMembers(this.communityId, query);
            })
        ).subscribe({
            next: (res: any) => {
                if (res.isSuccess) {
                    this.searchResults = res.data || [];
                }
                this.isSearchingUsers = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.isSearchingUsers = false;
                this.cdr.detectChanges();
            }
        });
    }

    onUserSearch(event: any) {
        this.searchSubject.next(event.target.value);
    }

    loadDetails() {
        this.isLoading = true;
        this.community = undefined;
        this.cdr.detectChanges();

        this.communitiesService.getCommunityDetails(this.communityId).subscribe({
            next: (res: any) => {
                console.log('Community Details Response:', res);
                // Checking for both isSuccess and succeeded just in case the wrapper varies
                if (res.isSuccess || res.succeeded) {
                    this.community = res.data;
                } else {
                    this.toastService.error(res.message || 'Failed to load community details');
                }
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('API Error:', err);
                this.toastService.error('Network error while loading community details');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    loadLeaders() {
        this.isLoadingLeaders = true;
        this.communitiesService.getCommunityLeaders(this.communityId).subscribe({
            next: (res) => {
                if (res.isSuccess && res.data) {
                    this.leaders = res.data.data || [];
                }
                this.isLoadingLeaders = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.isLoadingLeaders = false;
                this.cdr.detectChanges();
            }
        });
    }

    assignLeader(userId: number) {
        this.communitiesService.assignLeader(this.communityId, userId).subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    this.toastService.success('Leader assigned successfully');
                    this.showSearchModal = false;
                    this.userSearchQuery = '';
                    this.searchResults = [];
                    this.loadLeaders();
                    this.loadDetails();
                } else {
                    this.toastService.error(res.error?.message || 'Failed to assign leader');
                }
            },
            error: (err) => {
                this.toastService.error('Error assigning leader');
            }
        });
    }

    removeLeader(userId: number) {
        if (confirm('Are you sure you want to remove this leader?')) {
            this.communitiesService.removeLeader(this.communityId, userId).subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.toastService.success('Leader removed successfully');
                        this.loadLeaders();
                        this.loadDetails();
                    } else {
                        this.toastService.error(res.error?.message || 'Failed to remove leader');
                    }
                },
                error: (err) => {
                    this.toastService.error('Error removing leader');
                }
            });
        }
    }

    getCommunityTypeName(type?: CommunityType): string {
        if (type === undefined || type === null) return 'N/A';
        // Handle split of PascalCase name (e.g. "HousingHelp" -> "Housing Help")
        const name = CommunityType[type];
        return name?.replace(/([A-Z])/g, ' $1').trim() || 'N/A';
    }

    getAvatarUrl(url?: string): string {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `${environment.apiBaseUrl2}/avatars/${url}`;
    }
}
