import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ApiResponse,
  CommunityProfileData,
  CommunityMember,
  PagedCommunityMembersResponse
} from '../models/community-profile';
import { environment } from '../../../../../environments/environment';
import { CommunityRequestDto, RequestApiResponse } from '../models/community-requests';

@Injectable({
  providedIn: 'root'
})
export class CommunityProfileService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/communities`;

  getCommunityBySlug(
    slug: string,
    page: number = 1,
    pageSize: number = 20
  ): Observable<ApiResponse<CommunityProfileData>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    return this.http.get<ApiResponse<CommunityProfileData>>(`${this.apiUrl}/${slug}`, { params });
  }

  getCommunityMembers(
    communityId: number,
    page: number = 1,
    pageSize: number = 20
  ): Observable<PagedCommunityMembersResponse> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    return this.http.get<PagedCommunityMembersResponse>(`${this.apiUrl}/${communityId}/members`, { params });
  }

  joinCommunity(communityId: number): Observable<ApiResponse<any>> {
    const body = { communityId };
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/join`, body);
  }

  leaveCommunity(communityId: number): Observable<ApiResponse<any>> {
    const body = { communityId };
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/leave`, body);
  }

  removeMember(communityId: number, memberId: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${communityId}/members/${memberId}`);
  }

  updateMemberRole(communityId: number, targetUserId: number, newRole: number): Observable<ApiResponse<any>> {
    const body = { communityId, targetUserId, newRole };
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${communityId}/members/${targetUserId}/role`, body);
  }

  transferOwnership(communityId: number, newOwnerId: number): Observable<ApiResponse<string>> {
    const body = { communityId, newOwnerId };
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/${communityId}/transfer-ownership`, body);
  }

  disbandCommunity(communityId: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${communityId}/disband`);
  }

  updateCommunity(communityId: number, formData: FormData): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${communityId}/update`, formData);
  }

  getRequests(communityId: number): Observable<RequestApiResponse<CommunityRequestDto[]>> {
    return this.http.get<RequestApiResponse<CommunityRequestDto[]>>(`${this.apiUrl}/${communityId}/requests`);
  }

  approveRequest(communityId: number, targetUserId: number): Observable<RequestApiResponse<any>> {
    return this.http.post<RequestApiResponse<any>>(`${this.apiUrl}/${communityId}/requests/${targetUserId}/approve`, {});
  }

  rejectRequest(communityId: number, targetUserId: number): Observable<RequestApiResponse<any>> {
    return this.http.post<RequestApiResponse<any>>(`${this.apiUrl}/${communityId}/requests/${targetUserId}/reject`, {});
  }

  searchCommunityMembers(
    communityId: number,
    searchTerm: string,
    page: number = 1,
    pageSize: number = 20
  ): Observable<PagedCommunityMembersResponse> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    if (searchTerm.trim()) {
      params = params.set('searchTerm', searchTerm.trim());
    }

    return this.http.get<PagedCommunityMembersResponse>(`${this.apiUrl}/${communityId}/members/search`, { params });
  }
}
