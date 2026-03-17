import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
    CommunityListResponse,
    CommunitySingleResponse,
    DisbandRequestListResponse,
    LeaderListResponse,
    ProcessDisbandRequestRequest,
    CommunityType,
    DisbandRequestStatus,
    PagedResponse,
    CommunityMemberDto
} from '../models/community-dashboard.model';

@Injectable({ providedIn: 'root' })
export class CommunityDashboardService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiBaseUrl}/communities-dashboard`;

    getCommunities(
        page: number = 1,
        pageSize: number = 10,
        searchTerm: string = '',
        type?: CommunityType,
        locationId?: number,
        hasDisbandRequest?: boolean
    ): Observable<CommunityListResponse> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('pageSize', pageSize.toString());

        if (searchTerm) params = params.set('searchTerm', searchTerm);
        if (type !== undefined) params = params.set('type', type.toString());
        if (locationId) params = params.set('locationId', locationId.toString());
        if (hasDisbandRequest !== undefined)
            params = params.set('hasDisbandRequest', hasDisbandRequest.toString());

        return this.http.get<CommunityListResponse>(`${this.baseUrl}/list`, { params });
    }

    getCommunityDetails(id: number): Observable<CommunitySingleResponse> {
        return this.http.get<CommunitySingleResponse>(`${this.baseUrl}/${id}`);
    }

    getDisbandRequests(
        page: number = 1,
        pageSize: number = 10,
        status?: DisbandRequestStatus
    ): Observable<DisbandRequestListResponse> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('pageSize', pageSize.toString());

        if (status !== undefined) params = params.set('status', status.toString());

        return this.http.get<DisbandRequestListResponse>(`${this.baseUrl}/disband-requests/list`, {
            params
        });
    }

    processDisbandRequest(
        requestId: number,
        request: ProcessDisbandRequestRequest
    ): Observable<any> {
        return this.http.post<any>(
            `${this.baseUrl}/disband-requests/${requestId}/process`,
            request
        );
    }

    assignLeader(communityId: number, userId: number): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/${communityId}/assign-leader`, { userId });
    }

    removeLeader(communityId: number, userId: number): Observable<any> {
        return this.http.delete<any>(`${this.baseUrl}/${communityId}/leaders/${userId}`);
    }

    getCommunityLeaders(communityId: number): Observable<LeaderListResponse> {
        return this.http.get<LeaderListResponse>(`${this.baseUrl}/${communityId}/leaders`);
    }

    searchCommunityMembers(communityId: number, query: string, page: number = 1, pageSize: number = 20): Observable<PagedResponse<CommunityMemberDto>> {
        let params = new HttpParams()
            .set('Page', page.toString())
            .set('PageSize', pageSize.toString());

        if (query) {
            params = params.set('SearchTerm', query);
        }

        return this.http.get<PagedResponse<CommunityMemberDto>>(`${environment.apiBaseUrl}/communities/${communityId}/members/search`, { params });
    }
}
