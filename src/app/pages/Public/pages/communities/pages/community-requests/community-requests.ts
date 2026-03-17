// src/app/pages/Public/pages/communities/components/community-requests/community-requests.component.ts

import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommunityRequestsService } from '../../services/community-requests';
import { CommunityRequestDto } from '../../models/community-requests';
import { environment } from '../../../../../../environments/environment';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { GlobalLoaderService } from '../../../../../../shared/components/global-loader/global-loader.service';

@Component({
  selector: 'app-community-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './community-requests.html',
  styleUrls: ['./community-requests.scss']
})
export class CommunityRequestsComponent implements OnInit {
  @Input() communityId!: number;

  private service = inject(CommunityRequestsService);
  private toastService = inject(ToastService);
  private loaderService = inject(GlobalLoaderService);
  requests: CommunityRequestDto[] = [];
  isLoading = true;

  ngOnInit() {
    if (this.communityId) this.loadRequests();
  }

  loadRequests() {
    this.isLoading = true;
    this.loaderService.show();
    this.service.getRequests(this.communityId).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.loaderService.hide();
        if (res.isSuccess) this.requests = res.data || [];
      },
      error: () => {
        this.isLoading = false;
        this.loaderService.hide();
      }
    });
  }

  handleAction(req: CommunityRequestDto, action: 'approve' | 'reject') {
    const apiCall = action === 'approve'
      ? this.service.approveRequest(this.communityId, req.userId)
      : this.service.rejectRequest(this.communityId, req.userId);

    apiCall.subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.requests = this.requests.filter(r => r.userId !== req.userId);
          this.toastService.success(`Request ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
        } else {
          this.toastService.error(`Failed to ${action} request.`);
        }
      },
      error: () => this.toastService.error('An error occurred.')
    });
  }

  resolveAvatar(url: string): string {
    if (!url) return 'assets/images/default-avatar.png';
    return url.includes('http') ? url : `${environment.apiBaseUrl2}/avatars/${url}`;
  }
}