import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

// Interfaces based on Swagger
export interface CommunityRequestDto {
  userId: number;
  userName: string;
  userAvatar: string;
  requestedAt: string;
}

export interface RequestApiResponse<T> {
  isSuccess: boolean;
  data: T;
  error: any;
}

@Injectable({
  providedIn: 'root'
})
export class CommunityRequestsService {
  private http = inject(HttpClient);
  // Base URL pointing to communities controller
  private baseUrl = `${environment.apiBaseUrl}/communities`;

  // GET Requests
  getRequests(communityId: number): Observable<RequestApiResponse<CommunityRequestDto[]>> {
    return this.http.get<RequestApiResponse<CommunityRequestDto[]>>(`${this.baseUrl}/${communityId}/requests`);
  }

  // POST Approve
  approveRequest(communityId: number, targetUserId: number): Observable<RequestApiResponse<any>> {
    return this.http.post<RequestApiResponse<any>>(`${this.baseUrl}/${communityId}/requests/${targetUserId}/approve`, {});
  }

  // POST Reject
  rejectRequest(communityId: number, targetUserId: number): Observable<RequestApiResponse<any>> {
    return this.http.post<RequestApiResponse<any>>(`${this.baseUrl}/${communityId}/requests/${targetUserId}/reject`, {});
  }
}