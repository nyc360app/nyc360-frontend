import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { ApiResponse, CommunityHomeData, CommunitySuggestion } from '../models/community';
import {
  CommunityLeaderApplicationPayload,
  CommunityLeaderApplicationResponseData
} from '../models/community-leader-application';
import {
  BadgeOption,
  buildCommunityD01BadgeOptions,
  isCommunityCreateTag,
  isCommunityLeaderTag,
  isCommunityOrganizationTag
} from '../../../../../shared/utils/community-badge-policy';

export interface LocationDto {
  id: number;
  borough: string;
  neighborhood: string;
  zipCode: number;
  code: string;
}

@Injectable({
  providedIn: 'root'
})
export class CommunityService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/communities`;
  private locationsUrl = `${environment.apiBaseUrl}/locations`;
  private leaderApplicationsUrl = `${environment.apiBaseUrl}/communities/leader-applications`;
  private createCommunityBadgeApplicationsUrl = `${environment.apiBaseUrl}/communities/create-community-badge`;
  private organizationListingBadgeApplicationsUrl = `${environment.apiBaseUrl}/communities/organization-listing-badge`;

  // 1. GET: Home Feed
  getCommunityHome(page: number = 1, pageSize: number = 20): Observable<ApiResponse<CommunityHomeData>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));
    return this.http.get<ApiResponse<CommunityHomeData>>(`${this.baseUrl}/home`, { params });
  }

  // 2. POST: Join Community (✅ FIXED: Sends CommunityId in Body)
  joinCommunity(id: number): Observable<ApiResponse<any>> {
    const body = { communityId: id };

    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/join`, body);
  }

  // 3. GET: Discovery
  discoverCommunities(
    page: number = 1, 
    pageSize: number = 12, 
    search: string = '', 
    type?: number,
    locationId?: number
  ): Observable<ApiResponse<CommunitySuggestion[]>> {
    
    let params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    if (search) params = params.set('search', search);
    if (type) params = params.set('type', String(type));
    if (locationId) params = params.set('locationId', String(locationId));

    return this.http.get<ApiResponse<CommunitySuggestion[]>>(`${this.baseUrl}/discovery`, { params });
  }

  // 4. GET: Search Locations
  searchLocations(query: string, limit: number = 10): Observable<ApiResponse<LocationDto[]>> {
    const params = new HttpParams()
      .set('query', query)
      .set('limit', String(limit));
    return this.http.get<ApiResponse<LocationDto[]>>(`${this.locationsUrl}/search`, { params });
  }

  getCommunityBadgeOptions(): Observable<BadgeOption[]> {
    return this.getCommunityHome(1, 1).pipe(
      map((response) => buildCommunityD01BadgeOptions(response?.data?.tags || []))
    );
  }

  submitCommunityLeaderApplication(
    payload: CommunityLeaderApplicationPayload
  ): Observable<ApiResponse<CommunityLeaderApplicationResponseData | null>> {
    return this.http.post<ApiResponse<CommunityLeaderApplicationResponseData | null>>(
      `${this.leaderApplicationsUrl}/submit`,
      this.buildCommunityApplicationFormData(payload)
    );
  }

  submitCreateCommunityBadgeApplication(
    payload: CommunityLeaderApplicationPayload
  ): Observable<ApiResponse<CommunityLeaderApplicationResponseData | null>> {
    return this.http.post<ApiResponse<CommunityLeaderApplicationResponseData | null>>(
      `${this.createCommunityBadgeApplicationsUrl}/submit`,
      this.buildCommunityApplicationFormData(payload)
    );
  }

  submitOrganizationListingBadgeApplication(
    payload: CommunityLeaderApplicationPayload
  ): Observable<ApiResponse<CommunityLeaderApplicationResponseData | null>> {
    return this.http.post<ApiResponse<CommunityLeaderApplicationResponseData | null>>(
      `${this.organizationListingBadgeApplicationsUrl}/submit`,
      this.buildCommunityApplicationFormData(payload)
    );
  }

  submitCommunityContributorApplication(
    payload: CommunityLeaderApplicationPayload
  ): Observable<any> {
    const selectedOccupation = {
      id: payload.occupationId ?? null,
      name: payload.occupationName ?? null
    };

    if (isCommunityLeaderTag(selectedOccupation)) {
      return this.submitCommunityLeaderApplication(payload);
    }

    if (isCommunityCreateTag(selectedOccupation)) {
      return this.submitCreateCommunityBadgeApplication(payload);
    }

    if (isCommunityOrganizationTag(selectedOccupation)) {
      return this.submitOrganizationListingBadgeApplication(payload);
    }

    return throwError(() => new Error('Unable to determine the community contributor role for this application.'));
  }

  private buildCommunityApplicationFormData(payload: CommunityLeaderApplicationPayload): FormData {
    const formData = new FormData();

    formData.append('fullName', payload.fullName);
    formData.append('email', payload.email);
    formData.append('phoneNumber', payload.phoneNumber);
    formData.append('communityName', payload.communityName);
    formData.append('location', payload.location);
    formData.append('motivation', payload.motivation);
    formData.append('experience', payload.experience);
    formData.append('ledBefore', String(payload.ledBefore));
    formData.append('weeklyAvailability', payload.weeklyAvailability);
    formData.append('agreedToGuidelines', String(payload.agreedToGuidelines));
    formData.append('verificationFile', payload.verificationFile);

    if (payload.profileLink) {
      formData.append('profileLink', payload.profileLink);
    }

    return formData;
  }
}
