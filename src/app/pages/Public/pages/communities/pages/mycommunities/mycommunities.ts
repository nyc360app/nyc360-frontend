import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { MyCommunitiesService } from '../../services/mycommunities';
import { MyCommunity } from '../../models/mycommuinties';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { GlobalLoaderService } from '../../../../../../shared/components/global-loader/global-loader.service';
import { CommunityDepartmentHeroComponent } from '../../../../Widgets/community-department-hero/community-department-hero.component';
import { getCommunityErrorMessage } from '../../../../../../shared/utils/community-contract';
import { resolveCommunityMediaUrl } from '../../../../../../shared/utils/community-media';

@Component({
  selector: 'app-mycommunities',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CommunityDepartmentHeroComponent],
  templateUrl: './mycommunities.html',
  styleUrls: ['./mycommunities.scss']
})
export class MycommunitiesComponent implements OnInit {

  private communityService = inject(MyCommunitiesService);
  private toastService = inject(ToastService);
  private loaderService = inject(GlobalLoaderService);

  // Data
  communities: MyCommunity[] = [];

  // State
  searchText: string = '';
  selectedType: number | null = null;
  isLoading = false;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 12;
  totalCount: number = 0;
  totalPages: number = 1;

  // Mapping types (same as discovery for consistency)
  communityTypes = [
    { id: 1, name: 'District' },
    { id: 2, name: 'Neighborhood' },
    { id: 3, name: 'Local Service' },
    { id: 4, name: 'Housing Help' },
    { id: 5, name: 'Public Resources' },
    { id: 6, name: 'Civic Notices' },
    { id: 7, name: 'Safety Alerts' },
    { id: 8, name: 'Community Boards' },
    { id: 9, name: 'Youth Resources' },
    { id: 10, name: 'Senior Resources' },
    { id: 11, name: 'Family Support' },
    { id: 12, name: 'Accessibility' }
  ];

  ngOnInit(): void {
    this.loadCommunities();
  }

  loadCommunities() {
    this.isLoading = true;
    this.loaderService.show();

    this.communityService.getMyCommunities({
      search: this.searchText,
      type: this.selectedType || undefined,
      page: this.currentPage,
      pageSize: this.pageSize
    }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.loaderService.hide();
        // Handle case sensitivity (data vs Data)
        if (res.isSuccess || res.IsSuccess) {
          this.communities = res.data || res.Data || [];
          this.totalCount = res.totalCount || res.TotalCount || 0;
          this.totalPages = res.totalPages || res.TotalPages || 1;
        } else {
          this.communities = [];
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.loaderService.hide();
        this.toastService.error(getCommunityErrorMessage(err, 'Unable to load your communities right now.'));
        this.communities = [];
      }
    });
  }

  // --- Actions ---

  onSearch() {
    this.currentPage = 1;
    this.loadCommunities();
  }

  onTypeChange() {
    this.currentPage = 1;
    this.loadCommunities();
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadCommunities();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getAvatar(url: string | null | undefined): string {
    return resolveCommunityMediaUrl(url, 'assets/images/default-group.png');
  }

  getTypeName(typeId: number): string {
    const type = this.communityTypes.find(t => t.id === typeId);
    return type ? type.name : 'Community';
  }

  // Optional: Leave Community Logic
  leaveCommunity(comm: MyCommunity, event: Event) {
    event.stopPropagation(); // Prevent card click
    if (!confirm('Are you sure you want to leave this community?')) return;

    comm.isLoadingJoin = true;
    this.communityService.leaveCommunity(comm.id).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.communities = this.communities.filter(c => c.id !== comm.id);
          this.toastService.success('You have left the community.');
        } else {
          this.toastService.error(getCommunityErrorMessage(res, 'Failed to leave the community.'));
        }
        comm.isLoadingJoin = false;
      },
      error: (error) => {
        comm.isLoadingJoin = false;
        this.toastService.error(getCommunityErrorMessage(error, 'An error occurred while leaving the community.'));
      }
    })
  }
}
