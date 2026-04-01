import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CategoryEnum, DEPARTMENT_PATHS } from '../../../../../Public/Widgets/feeds/models/categories';
import {
  SpaceListingEntityType,
  SpaceListingPendingRequest,
  SpaceListingService
} from '../../../../../../shared/services/space-listing.service';
import { ToastService } from '../../../../../../shared/services/toast.service';

@Component({
  selector: 'app-space-listing-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './space-listing-requests.html',
  styleUrls: ['./space-listing-requests.scss']
})
export class SpaceListingRequestsComponent implements OnInit {
  private readonly spaceListingService = inject(SpaceListingService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly departments = ['all', ...DEPARTMENT_PATHS];
  protected readonly entityTypes: Array<'all' | SpaceListingEntityType> = ['all', 'location', 'place', 'business', 'organization'];

  requests: any[] = [];
  isLoading = false;
  currentPage = 1;
  pageSize = 20;
  totalCount = 0;
  totalPages = 0;
  searchTerm = '';
  selectedDepartment = 'all';
  selectedEntityType: 'all' | SpaceListingEntityType = 'all';
  selectedRequest: any | null = null;
  moderationNote = '';
  isProcessingAction = false;
  hasInitialized = false;
  isLoadingDetails = false;
  detailsError: string | null = null;

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(page: number = 1): void {
    this.currentPage = page;
    this.isLoading = true;
    this.cdr.detectChanges();

    this.spaceListingService.getPendingListings(this.currentPage, this.pageSize, {
      department: this.selectedDepartment === 'all' ? undefined : this.selectedDepartment,
      entityType: this.selectedEntityType === 'all' ? undefined : this.selectedEntityType,
      search: this.searchTerm
    }).subscribe({
      next: (response) => {
        const payload: any = (response as any)?.body ?? response ?? {};
        const isSuccess = payload?.isSuccess ?? payload?.IsSuccess ?? true;

        if (!isSuccess) {
          this.toastService.error(payload?.error?.message || 'Failed to load Space listing requests.');
          this.requests = [];
          this.totalCount = 0;
          this.totalPages = 0;
          this.isLoading = false;
          this.hasInitialized = true;
          this.cdr.detectChanges();
          return;
        }

        const rawData: any = payload?.data ?? payload?.Data;
        let items: any[] = [];

        if (Array.isArray(rawData)) {
          items = rawData;
        } else if (rawData && typeof rawData === 'object') {
          if (Array.isArray(rawData.data)) {
            items = rawData.data;
          } else if (typeof rawData.length === 'number') {
            items = Array.from(rawData);
          } else {
            items = Object.values(rawData);
          }
        }

        this.requests = items;
        this.totalCount = payload?.totalCount || this.requests.length;
        this.totalPages = payload?.totalPages || (this.totalCount > this.pageSize ? Math.ceil(this.totalCount / this.pageSize) : 1);
        this.currentPage = Math.min(payload?.page || this.currentPage, this.totalPages || 1);
        this.isLoading = false;
        this.hasInitialized = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.toastService.error('Failed to load Space listing requests.');
        this.requests = [];
        this.totalCount = 0;
        this.totalPages = 0;
        this.isLoading = false;
        this.hasInitialized = true;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    this.loadRequests(1);
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedDepartment = 'all';
    this.selectedEntityType = 'all';
    this.loadRequests(1);
  }

  openResolveModal(request: any): void {
    this.selectedRequest = request;
    this.moderationNote = '';
    this.detailsError = null;
    this.isLoadingDetails = false;

    const listingId = this.getListingId(request);
    if (!listingId) {
      return;
    }

    this.isLoadingDetails = true;
    this.spaceListingService.getListingDetails(listingId).subscribe({
      next: (response) => {
        this.isLoadingDetails = false;
        if (response?.isSuccess && response?.data) {
          this.selectedRequest = { ...request, ...response.data };
        } else {
          this.detailsError = response?.error?.message || 'Unable to load listing details.';
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingDetails = false;
        this.detailsError = 'Unable to load listing details.';
        this.cdr.detectChanges();
      }
    });
  }

  closeResolveModal(): void {
    this.selectedRequest = null;
    this.moderationNote = '';
    this.detailsError = null;
    this.isLoadingDetails = false;
  }

  handleResolve(approved: boolean): void {
    const listingId = this.getListingId(this.selectedRequest);
    if (!listingId || this.isProcessingAction) {
      return;
    }

    this.isProcessingAction = true;
    const decision = approved ? 5 : 6;

    this.spaceListingService.reviewListing({
      listingId,
      decision,
      moderationNote: this.moderationNote.trim()
    }).subscribe({
      next: (response) => {
        this.isProcessingAction = false;

        if (response?.isSuccess) {
          if (approved) {
            this.toastService.success(
              this.isLocationRequest(this.selectedRequest)
                ? 'Location listing approved. No separate publish step is required.'
                : 'Listing request approved.'
            );
          } else {
            this.toastService.success('Listing request rejected.');
          }
          this.closeResolveModal();
          this.loadRequests(this.currentPage);
          return;
        }

        this.toastService.error(response?.error?.message || 'Unable to review this listing request.');
        this.cdr.detectChanges();
      },
      error: () => {
        this.isProcessingAction = false;
        this.toastService.error('Unable to review this listing request.');
        this.cdr.detectChanges();
      }
    });
  }

  trackByRequestId = (index: number, request: any): number | string => {
    return this.getListingId(request) || index;
  };

  getListingId(request: any): number | null {
    return request?.id
      ?? request?.Id
      ?? request?.listingId
      ?? request?.ListingId
      ?? request?.requestId
      ?? request?.RequestId
      ?? null;
  }

  getRequestName(request: any): string {
    return request?.name ?? request?.Name ?? 'Unnamed listing';
  }

  getRequestDepartment(request: any): string {
    const value = request?.department ?? request?.Department;
    if (typeof value === 'number') {
      return CategoryEnum[value] ?? 'general';
    }
    return value ?? 'general';
  }

  getRequestEntityType(request: any): string {
    const value = request?.entityType ?? request?.EntityType;
    if (typeof value === 'number') {
      switch (value) {
        case 1:
          return 'location';
        case 2:
          return 'place';
        case 3:
          return 'business';
        case 4:
          return 'organization';
        default:
          return 'listing';
      }
    }
    return value ?? 'listing';
  }

  isLocationRequest(request: any): boolean {
    return this.getRequestEntityType(request) === 'location';
  }

  getRequestDescription(request: any): string {
    return request?.description ?? request?.Description ?? 'No description provided.';
  }

  getRequestContactName(request: any): string | null {
    return request?.contactName ?? request?.ContactName ?? null;
  }

  getRequestStatus(request: any): string {
    const value = request?.status ?? request?.Status;
    if (typeof value === 'number') {
      switch (value) {
        case 1:
          return 'draft';
        case 2:
          return 'pending';
        case 3:
          return 'under_review';
        case 4:
          return 'needs_changes';
        case 5:
          return 'approved';
        case 6:
          return 'rejected';
        case 7:
          return 'published_to_space';
        case 8:
          return 'claimed';
        case 9:
          return 'cancelled';
        default:
          return 'pending';
      }
    }
    return value ?? 'pending';
  }

  getRequestSubmitter(request: any): string {
    return request?.requester?.fullName
      || request?.requester?.username
      || request?.submittedBy?.fullName
      || request?.submittedBy?.username
      || request?.ownerName
      || 'Authenticated User';
  }

  getRequestSubmitterNote(request: any): string | null {
    return request?.submitterNote ?? request?.SubmitterNote ?? null;
  }

  isOwnershipClaim(request: any): boolean {
    return !!(request?.isClaimingOwnership ?? request?.IsClaimingOwnership);
  }

  getRequestSubmittedAt(request: any): string | null {
    return request?.submittedAt
      ?? request?.SubmittedAt
      ?? request?.createdAt
      ?? request?.CreatedAt
      ?? null;
  }

  getRequestAddress(request: any): string {
    const address = request?.address ?? request?.Address ?? {};
    const location = address?.location ?? address?.Location ?? {};

    const title = location?.neighborhoodNet
      || location?.neighborhood
      || location?.borough
      || request?.locationName
      || request?.LocationName
      || request?.neighborhood
      || request?.Neighborhood
      || request?.borough
      || request?.Borough
      || null;

    const zipCode = address?.zipCode ?? address?.ZipCode ?? request?.zipCode ?? request?.ZipCode ?? null;
    const locationId = address?.locationId ?? address?.LocationId ?? request?.locationId ?? request?.LocationId ?? null;

    return [title, zipCode ? `ZIP ${zipCode}` : null, locationId ? `Location #${locationId}` : null]
      .filter(Boolean)
      .join(' • ');
  }

  getContactLinks(request: any): string[] {
    const website = request?.website ?? request?.Website ?? null;
    const phone = request?.phoneNumber ?? request?.PhoneNumber ?? null;
    const email = request?.publicEmail ?? request?.PublicEmail ?? null;

    return [website, phone, email].filter((value): value is string => !!String(value || '').trim());
  }

  getAttachmentCounts(request: any): Array<{ label: string; count: number }> {
    const sources: Array<{ label: string; value: any }> = [
      { label: 'Images', value: request?.images ?? request?.Images },
      { label: 'Documents', value: request?.documents ?? request?.Documents },
      { label: 'Ownership Docs', value: request?.ownershipDocuments ?? request?.OwnershipDocuments },
      { label: 'Proof Docs', value: request?.proofDocuments ?? request?.ProofDocuments },
      { label: 'Attachments', value: request?.attachments ?? request?.Attachments }
    ];

    return sources
      .map((entry) => ({
        label: entry.label,
        count: Array.isArray(entry.value) ? entry.value.length : 0
      }))
      .filter((entry) => entry.count > 0);
  }

  getTotalRangeStart(): number {
    if (!this.totalCount) {
      return 0;
    }

    return ((this.currentPage - 1) * this.pageSize) + 1;
  }

  getTotalRangeEnd(): number {
    if (!this.totalCount) {
      return 0;
    }

    return Math.min(this.currentPage * this.pageSize, this.totalCount);
  }

  asPendingRequest(request: any): SpaceListingPendingRequest {
    return request as SpaceListingPendingRequest;
  }

  
}
