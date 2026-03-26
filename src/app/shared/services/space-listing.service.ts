import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export type SpaceListingEntityType = 'location' | 'place' | 'business' | 'organization';
export type SpaceListingStatus = 'pending' | 'approved' | 'rejected' | 'under_review' | 'needs_changes';

export const SPACE_LISTING_ENTITY_ENUM: Record<SpaceListingEntityType, number> = {
  location: 1,
  place: 2,
  business: 3,
  organization: 4
};

export interface SpaceListingAddressInput {
  addressId: number | null;
  locationId: number | null;
  street?: string | null;
  buildingNumber?: string | null;
  zipCode: string;
}

export interface SpaceListingSubmitRequest {
  department: number;
  entityType: number;
  name: string;
  description: string;
  address: SpaceListingAddressInput;
  locationName?: string | null;
  borough?: string | null;
  neighborhood?: string | null;
  website?: string | null;
  phoneNumber?: string | null;
  publicEmail?: string | null;
  contactName?: string | null;
  submitterNote?: string | null;
  isClaimingOwnership: boolean;
  saveAsDraft?: boolean;
  categories?: number[];
  tags?: string[];
  socialLinks?: Array<{ platform: number; url: string }>;
  hours?: Array<{ dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean }>;
  businessIndustry?: number;
  businessSize?: number;
  businessServiceArea?: number;
  businessServices?: number;
  businessOwnershipType?: number;
  businessIsLicensedInNyc?: boolean;
  businessIsInsured?: boolean;
  organizationType?: number;
  organizationFundType?: number;
  organizationServices?: number[];
  organizationIsTaxExempt?: boolean;
  organizationIsNysRegistered?: boolean;
  images?: File[];
  documents?: File[];
  ownershipDocuments?: File[];
  proofDocuments?: File[];
}

export interface SpaceListingSubmitResult {
  requestId: number;
  status: SpaceListingStatus;
  department: string;
  entityType: SpaceListingEntityType;
  name: string;
  spaceItemId: string | null;
  submittedAt: string;
  reviewRequired: boolean;
}

export interface SpaceListingPendingRequest {
  id: number;
  name: string;
  department: number;
  entityType: number;
  status: number;
  ownershipStatus: number;
  spaceItemId: string | null;
  createdAt: string;
  updatedAt: string;
  description?: string | null;
  submitterNote?: string | null;
  requester?: { fullName?: string | null; username?: string | null } | null;
  submittedBy?: { fullName?: string | null; username?: string | null } | null;
  ownerName?: string | null;
  address?: {
    location?: { neighborhoodNet?: string | null; neighborhood?: string | null; borough?: string | null } | null;
    zipCode?: string | null;
    locationId?: number | null;
  } | null;
  website?: string | null;
  phoneNumber?: string | null;
  publicEmail?: string | null;
  isClaimingOwnership?: boolean | null;
}

export interface SpaceListingPendingQueueResponse {
  isSuccess: boolean;
  data: SpaceListingPendingRequest[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  error: {
    code?: string;
    message?: string;
  } | null;
}

export interface SpaceListingReviewRequest {
  listingId: number;
  decision: number;
  moderationNote?: string;
}

export interface SpaceListingAssignRequest {
  listingId: number;
  assigneeUserId: number;
}

export interface ApiEnvelope<T> {
  isSuccess: boolean;
  data: T;
  error: {
    code?: string;
    message?: string;
  } | null;
}

@Injectable({
  providedIn: 'root'
})
export class SpaceListingService {
  private readonly http = inject(HttpClient);
  private readonly submitUrl = `${environment.apiBaseUrl}/space/listings/submit`;
  private readonly listingsUrl = `${environment.apiBaseUrl}/space/listings`;
  private readonly dashboardUrl = `${environment.apiBaseUrl}/space-dashboard/listings`;

  submitListing(payload: SpaceListingSubmitRequest): Observable<ApiEnvelope<SpaceListingSubmitResult>> {
    const form = new FormData();

    form.append('department', String(payload.department));
    form.append('entityType', String(payload.entityType));
    form.append('name', payload.name);
    form.append('description', payload.description);
    form.append('address.zipCode', payload.address.zipCode);

    if (payload.address.addressId != null) form.append('address.addressId', String(payload.address.addressId));
    if (payload.address.locationId != null) form.append('address.locationId', String(payload.address.locationId));
    if (payload.address.street) form.append('address.street', payload.address.street);
    if (payload.address.buildingNumber) form.append('address.buildingNumber', payload.address.buildingNumber);
    if (payload.address.locationId != null) form.append('locationId', String(payload.address.locationId));
    if (payload.address.street) form.append('street', payload.address.street);
    if (payload.address.buildingNumber) form.append('buildingNumber', payload.address.buildingNumber);
    if (payload.address.zipCode) form.append('zipCode', payload.address.zipCode);

    if (payload.locationName) form.append('locationName', payload.locationName);
    if (payload.borough) form.append('borough', payload.borough);
    if (payload.neighborhood) form.append('neighborhood', payload.neighborhood);

    if (payload.website) form.append('website', payload.website);
    if (payload.phoneNumber) form.append('phoneNumber', payload.phoneNumber);
    if (payload.publicEmail) form.append('publicEmail', payload.publicEmail);
    if (payload.contactName) form.append('contactName', payload.contactName);
    if (payload.submitterNote) form.append('submitterNote', payload.submitterNote);

    form.append('isClaimingOwnership', String(!!payload.isClaimingOwnership));
    if (payload.saveAsDraft != null) form.append('saveAsDraft', String(payload.saveAsDraft));

    if (payload.categories?.length) {
      payload.categories.forEach((cat) => form.append('categories', String(cat)));
    }

    if (payload.tags?.length) {
      payload.tags.forEach((tag) => form.append('tags', tag));
    }

    if (payload.socialLinks?.length) {
      payload.socialLinks.forEach((link, index) => {
        form.append(`socialLinks[${index}].platform`, String(link.platform));
        form.append(`socialLinks[${index}].url`, link.url);
      });
    }

    if (payload.hours?.length) {
      payload.hours.forEach((hour, index) => {
        form.append(`hours[${index}].dayOfWeek`, String(hour.dayOfWeek));
        form.append(`hours[${index}].openTime`, hour.openTime);
        form.append(`hours[${index}].closeTime`, hour.closeTime);
        form.append(`hours[${index}].isClosed`, String(!!hour.isClosed));
      });
    }

    if (payload.businessIndustry != null) form.append('businessIndustry', String(payload.businessIndustry));
    if (payload.businessSize != null) form.append('businessSize', String(payload.businessSize));
    if (payload.businessServiceArea != null) form.append('businessServiceArea', String(payload.businessServiceArea));
    if (payload.businessServices != null) form.append('businessServices', String(payload.businessServices));
    if (payload.businessOwnershipType != null) form.append('businessOwnershipType', String(payload.businessOwnershipType));
    if (payload.businessIsLicensedInNyc != null) form.append('businessIsLicensedInNyc', String(!!payload.businessIsLicensedInNyc));
    if (payload.businessIsInsured != null) form.append('businessIsInsured', String(!!payload.businessIsInsured));

    if (payload.organizationType != null) form.append('organizationType', String(payload.organizationType));
    if (payload.organizationFundType != null) form.append('organizationFundType', String(payload.organizationFundType));
    if (payload.organizationServices?.length) {
      payload.organizationServices.forEach((service) => form.append('organizationServices', String(service)));
    }
    if (payload.organizationIsTaxExempt != null) form.append('organizationIsTaxExempt', String(!!payload.organizationIsTaxExempt));
    if (payload.organizationIsNysRegistered != null) form.append('organizationIsNysRegistered', String(!!payload.organizationIsNysRegistered));

    payload.images?.forEach((file) => form.append('images', file));
    payload.documents?.forEach((file) => form.append('documents', file));
    payload.ownershipDocuments?.forEach((file) => form.append('ownershipDocuments', file));
    payload.proofDocuments?.forEach((file) => form.append('proofDocuments', file));

    return this.http.post<ApiEnvelope<SpaceListingSubmitResult>>(this.submitUrl, form);
  }

  getMyListings(): Observable<ApiEnvelope<any[]>> {
    return this.http.get<any>(`${this.listingsUrl}/mine`).pipe(
      map((response) => ({
        isSuccess: response?.isSuccess ?? response?.IsSuccess ?? true,
        data: response?.data ?? response?.Data ?? [],
        error: response?.error ?? response?.Error ?? null
      }))
    );
  }

  getUserListingDetails(listingId: number): Observable<ApiEnvelope<any>> {
    return this.http.get<any>(`${this.listingsUrl}/${listingId}`).pipe(
      map((response) => ({
        isSuccess: response?.isSuccess ?? response?.IsSuccess ?? true,
        data: response?.data ?? response?.Data ?? null,
        error: response?.error ?? response?.Error ?? null
      }))
    );
  }

  updateListing(listingId: number, payload: SpaceListingSubmitRequest): Observable<ApiEnvelope<any>> {
    const form = new FormData();

    form.append('department', String(payload.department));
    form.append('entityType', String(payload.entityType));
    form.append('name', payload.name);
    form.append('description', payload.description);
    form.append('address.zipCode', payload.address.zipCode);

    if (payload.address.addressId != null) form.append('address.addressId', String(payload.address.addressId));
    if (payload.address.locationId != null) form.append('address.locationId', String(payload.address.locationId));
    if (payload.address.street) form.append('address.street', payload.address.street);
    if (payload.address.buildingNumber) form.append('address.buildingNumber', payload.address.buildingNumber);
    if (payload.address.locationId != null) form.append('locationId', String(payload.address.locationId));
    if (payload.address.street) form.append('street', payload.address.street);
    if (payload.address.buildingNumber) form.append('buildingNumber', payload.address.buildingNumber);
    if (payload.address.zipCode) form.append('zipCode', payload.address.zipCode);
    if (payload.locationName) form.append('locationName', payload.locationName);
    if (payload.borough) form.append('borough', payload.borough);
    if (payload.neighborhood) form.append('neighborhood', payload.neighborhood);
    if (payload.website) form.append('website', payload.website);
    if (payload.phoneNumber) form.append('phoneNumber', payload.phoneNumber);
    if (payload.publicEmail) form.append('publicEmail', payload.publicEmail);
    if (payload.contactName) form.append('contactName', payload.contactName);
    if (payload.submitterNote) form.append('submitterNote', payload.submitterNote);
    form.append('isClaimingOwnership', String(!!payload.isClaimingOwnership));
    if (payload.saveAsDraft != null) form.append('saveAsDraft', String(payload.saveAsDraft));

    payload.images?.forEach((file) => form.append('images', file));
    payload.documents?.forEach((file) => form.append('documents', file));
    payload.ownershipDocuments?.forEach((file) => form.append('ownershipDocuments', file));
    payload.proofDocuments?.forEach((file) => form.append('proofDocuments', file));

    return this.http.put<any>(`${this.listingsUrl}/update/${listingId}`, form).pipe(
      map((response) => ({
        isSuccess: response?.isSuccess ?? response?.IsSuccess ?? true,
        data: response?.data ?? response?.Data ?? null,
        error: response?.error ?? response?.Error ?? null
      }))
    );
  }

  cancelListing(listingId: number): Observable<ApiEnvelope<any>> {
    return this.http.delete<any>(`${this.listingsUrl}/cancel/${listingId}`).pipe(
      map((response) => ({
        isSuccess: response?.isSuccess ?? response?.IsSuccess ?? true,
        data: response?.data ?? response?.Data ?? null,
        error: response?.error ?? response?.Error ?? null
      }))
    );
  }

  resubmitListing(listingId: number): Observable<ApiEnvelope<any>> {
    return this.http.post<any>(`${this.listingsUrl}/resubmit/${listingId}`, {}).pipe(
      map((response) => ({
        isSuccess: response?.isSuccess ?? response?.IsSuccess ?? true,
        data: response?.data ?? response?.Data ?? null,
        error: response?.error ?? response?.Error ?? null
      }))
    );
  }

  getPendingListings(page: number = 1, pageSize: number = 20, filters: {
    department?: string;
    entityType?: SpaceListingEntityType;
    search?: string;
  } = {}): Observable<SpaceListingPendingQueueResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (filters.department) {
      params = params.set('department', filters.department);
    }

    if (filters.entityType) {
      params = params.set('entityType', filters.entityType);
    }

    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }

    return this.http.get<SpaceListingPendingQueueResponse>(`${this.dashboardUrl}/pending`, { params });
  }

  reviewListing(payload: SpaceListingReviewRequest): Observable<ApiEnvelope<SpaceListingPendingRequest>> {
    return this.http.put<any>(`${this.dashboardUrl}/review`, payload).pipe(
      map((response) => ({
        isSuccess: response?.isSuccess ?? response?.IsSuccess ?? true,
        data: response?.data ?? response?.Data ?? null,
        error: response?.error ?? response?.Error ?? null
      }))
    );
  }

  getListingDetails(listingId: number): Observable<ApiEnvelope<any>> {
    return this.http.get<any>(`${this.dashboardUrl}/${listingId}`).pipe(
      map((response) => ({
        isSuccess: response?.isSuccess ?? response?.IsSuccess ?? true,
        data: response?.data ?? response?.Data ?? null,
        error: response?.error ?? response?.Error ?? null
      }))
    );
  }

  assignListing(payload: SpaceListingAssignRequest): Observable<ApiEnvelope<any>> {
    return this.http.put<any>(`${this.dashboardUrl}/assign`, payload).pipe(
      map((response) => ({
        isSuccess: response?.isSuccess ?? response?.IsSuccess ?? true,
        data: response?.data ?? response?.Data ?? null,
        error: response?.error ?? response?.Error ?? null
      }))
    );
  }

  publishListing(listingId: number): Observable<ApiEnvelope<any>> {
    return this.http.post<any>(`${this.dashboardUrl}/${listingId}/publish`, {}).pipe(
      map((response) => ({
        isSuccess: response?.isSuccess ?? response?.IsSuccess ?? true,
        data: response?.data ?? response?.Data ?? null,
        error: response?.error ?? response?.Error ?? null
      }))
    );
  }
}
