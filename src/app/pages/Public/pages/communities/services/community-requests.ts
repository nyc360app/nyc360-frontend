// src/app/pages/Public/pages/communities/services/community-requests.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CommunityRequestDto, RequestApiResponse } from '../models/community-requests';

@Injectable({
  providedIn: 'root'
})
export class CommunityRequestsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/communities`;

  getRequests(communityId: number): Observable<RequestApiResponse<CommunityRequestDto[]>> {
    return this.http.get<RequestApiResponse<CommunityRequestDto[]>>(`${this.baseUrl}/${communityId}/requests`);
  }

  approveRequest(communityId: number, targetUserId: number): Observable<RequestApiResponse<any>> {
    return this.http.post<RequestApiResponse<any>>(`${this.baseUrl}/${communityId}/requests/${targetUserId}/approve`, {});
  }

  rejectRequest(communityId: number, targetUserId: number): Observable<RequestApiResponse<any>> {
    return this.http.post<RequestApiResponse<any>>(`${this.baseUrl}/${communityId}/requests/${targetUserId}/reject`, {});
  }
}