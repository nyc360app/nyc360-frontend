import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, CommunityProfileData, CommunityMember } from '../models/community-profile';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CommunityProfileService {

  private http = inject(HttpClient);
  // تأكد إن المسار الأساسي مظبوط على /api/communities
  private apiUrl = `${environment.apiBaseUrl}/communities`;

  // 1. Get Community Profile by Slug
  getCommunityBySlug(slug: string): Observable<ApiResponse<CommunityProfileData>> {
    return this.http.get<ApiResponse<CommunityProfileData>>(`${this.apiUrl}/${slug}`);
  }

  // 2. Get Members
  getCommunityMembers(communityId: number): Observable<ApiResponse<CommunityMember[]>> {
    return this.http.get<ApiResponse<CommunityMember[]>>(`${this.apiUrl}/${communityId}/members`);
  }

  // 3. Join Community (✅ دي الدالة اللي كانت ناقصة)
  joinCommunity(communityId: number): Observable<ApiResponse<any>> {
    const body = { CommunityId: communityId };
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/join`, body);
  }

  // 4. Leave Community (✅ دي الدالة اللي كانت ناقصة)
  leaveCommunity(communityId: number): Observable<ApiResponse<any>> {
    const body = { CommunityId: communityId };
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/leave`, body);
  }

  // 5. Remove Member
  removeMember(communityId: number, memberId: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${communityId}/members/${memberId}`);
  }

  // 6. Update Member Role
  updateMemberRole(communityId: number, targetUserId: number, newRole: number): Observable<ApiResponse<any>> {
    const body = { NewRole: newRole };
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${communityId}/members/${targetUserId}/role`, body);
  }

  // 7. Transfer Ownership
  transferOwnership(communityId: number, newOwnerId: number): Observable<ApiResponse<string>> {
    const body = { NewOwnerId: newOwnerId };
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/${communityId}/transfer-ownership`, body);
  }

  // 8. Disband Community
  disbandCommunity(communityId: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${communityId}/disband`);
  }

  // 9. Update Community Info
  updateCommunity(communityId: number, formData: FormData): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${communityId}/update`, formData);
  }
}