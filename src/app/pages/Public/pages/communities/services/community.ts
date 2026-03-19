import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse, CommunityHomeData, CommunitySuggestion } from '../models/community';
import {
  CommunityLeaderApplicationPayload,
  CommunityLeaderApplicationResponseData
} from '../models/community-leader-application';

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

  // 1. GET: Home Feed
  getCommunityHome(page: number = 1, pageSize: number = 20): Observable<ApiResponse<CommunityHomeData>> {
    const params = new HttpParams().set('Page', page).set('PageSize', pageSize);
    return this.http.get<ApiResponse<CommunityHomeData>>(`${this.baseUrl}/home`, { params });
  }

  // 2. POST: Join Community (✅ FIXED: Sends CommunityId in Body)
  joinCommunity(id: number): Observable<ApiResponse<any>> {
    // بناء الـ Body ليطابق صورة Swagger تماماً
    // Request Body: { "CommunityId": 123 }
    const body = { CommunityId: id }; 
    
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
      .set('Page', page)
      .set('PageSize', pageSize);

    if (search) params = params.set('Search', search);
    if (type) params = params.set('Type', type);
    if (locationId) params = params.set('LocationId', locationId);

    return this.http.get<ApiResponse<CommunitySuggestion[]>>(`${this.baseUrl}/discovery`, { params });
  }

  // 4. GET: Search Locations
  searchLocations(query: string, limit: number = 10): Observable<ApiResponse<LocationDto[]>> {
    const params = new HttpParams()
      .set('Query', query)
      .set('Limit', limit);
    return this.http.get<ApiResponse<LocationDto[]>>(`${this.locationsUrl}/search`, { params });
  }

  submitCommunityLeaderApplication(
    payload: CommunityLeaderApplicationPayload
  ): Observable<ApiResponse<CommunityLeaderApplicationResponseData | null>> {
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

    return this.http.post<ApiResponse<CommunityLeaderApplicationResponseData | null>>(
      `${this.leaderApplicationsUrl}/submit`,
      formData
    );
  }
}
