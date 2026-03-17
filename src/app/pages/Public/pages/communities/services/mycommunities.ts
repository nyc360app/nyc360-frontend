import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse, MyCommunitiesParams, MyCommunity } from '../models/mycommuinties';

@Injectable({
  providedIn: 'root'
})
export class MyCommunitiesService {
  
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/communities`; 

  // GET: My Communities
  getMyCommunities(params: MyCommunitiesParams): Observable<ApiResponse<MyCommunity[]>> {
    let httpParams = new HttpParams();

    if (params.Search) httpParams = httpParams.set('Search', params.Search);
    if (params.Type) httpParams = httpParams.set('Type', params.Type.toString());
    if (params.Page) httpParams = httpParams.set('Page', params.Page.toString());
    if (params.PageSize) httpParams = httpParams.set('PageSize', params.PageSize.toString());

    return this.http.get<ApiResponse<MyCommunity[]>>(`${this.apiUrl}/my-communities`, { params: httpParams });
  }

  // POST: Leave Community (Optional, useful for "My Communities" page)
  leaveCommunity(id: number): Observable<ApiResponse<any>> {
    const body = { CommunityId: id };
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/leave`, body);
  }
}