import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse, CommunityMyRequest, MyCommunitiesParams, MyCommunity } from '../models/mycommuinties';

@Injectable({
  providedIn: 'root'
})
export class MyCommunitiesService {
  
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/communities`; 

  // GET: My Communities
  getMyCommunities(params: MyCommunitiesParams): Observable<ApiResponse<MyCommunity[]>> {
    let httpParams = new HttpParams();

    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.type != null) httpParams = httpParams.set('type', params.type.toString());
    if (params.locationId != null) httpParams = httpParams.set('locationId', params.locationId.toString());
    const page = params.page ?? params.Page;
    const pageSize = params.pageSize ?? params.PageSize;
    if (page != null) httpParams = httpParams.set('page', page.toString());
    if (pageSize != null) httpParams = httpParams.set('pageSize', pageSize.toString());

    return this.http.get<ApiResponse<MyCommunity[]>>(`${this.apiUrl}/my-communities`, { params: httpParams });
  }

  getMyRequests(): Observable<ApiResponse<CommunityMyRequest[]>> {
    return this.http.get<ApiResponse<CommunityMyRequest[]>>(`${this.apiUrl}/my-requests`);
  }

  leaveCommunity(id: number): Observable<ApiResponse<any>> {
    const body = { communityId: id };
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/leave`, body);
  }
}
