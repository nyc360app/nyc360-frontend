import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CommunityDepartmentHeroComponent } from '../../../../Widgets/community-department-hero/community-department-hero.component';
import { MyCommunitiesService } from '../../services/mycommunities';
import { CommunityMyRequest, MyCommunity } from '../../models/mycommuinties';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { getCommunityErrorMessage, getCommunityRoleLabel } from '../../../../../../shared/utils/community-contract';

@Component({
  selector: 'app-community-inquiries',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CommunityDepartmentHeroComponent],
  templateUrl: './community-inquiries.html',
  styleUrls: ['./community-inquiries.scss']
})
export class CommunityInquiriesComponent implements OnInit {
  private readonly myCommunitiesService = inject(MyCommunitiesService);
  private readonly toastService = inject(ToastService);

  searchText = '';
  isLoading = true;
  requests: CommunityMyRequest[] = [];
  communities: MyCommunity[] = [];

  ngOnInit(): void {
    this.loadData();
  }

  get filteredRequests(): CommunityMyRequest[] {
    const query = this.searchText.trim().toLowerCase();
    if (!query) {
      return this.requests;
    }

    return this.requests.filter((item) =>
      String(item.communityName || '')
        .toLowerCase()
        .includes(query)
    );
  }

  get filteredCommunities(): MyCommunity[] {
    const query = this.searchText.trim().toLowerCase();
    if (!query) {
      return this.communities;
    }

    return this.communities.filter((item) =>
      String(item.name || '')
        .toLowerCase()
        .includes(query)
    );
  }

  loadData(): void {
    this.isLoading = true;

    forkJoin({
      requests: this.myCommunitiesService.getMyRequests(),
      communities: this.myCommunitiesService.getMyCommunities({ page: 1, pageSize: 6 })
    }).subscribe({
      next: ({ requests, communities }) => {
        this.requests = requests?.isSuccess ? (requests.data || []) : [];
        this.communities = communities?.isSuccess ? (communities.data || []) : [];
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.error(getCommunityErrorMessage(error, 'Unable to load your community inquiries.'));
      }
    });
  }

  getRequestStatusLabel(status: string | null | undefined): string {
    const normalized = String(status || 'pending').trim().toLowerCase();

    switch (normalized) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Pending';
    }
  }

  getStatusClass(status: string | null | undefined): string {
    const normalized = String(status || 'pending').trim().toLowerCase();

    switch (normalized) {
      case 'approved':
        return 'approved';
      case 'rejected':
        return 'rejected';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  getRequestRoleLabel(role: number | string | null | undefined): string {
    return getCommunityRoleLabel(role);
  }
}
