import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse, LocationSearchResult } from '../models/createcommunty';

@Injectable({
  providedIn: 'root',
})
export class CreateCommunityService {

  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}`; // Base API URL

  /**
   * ✅ New: Search Locations API
   * GET /api/locations/search?Query=...&Limit=...
   */
  searchLocations(query: string, limit: number = 20): Observable<ApiResponse<LocationSearchResult[]>> {
    const params = new HttpParams()
      .set('Query', query)
      .set('Limit', limit);

    return this.http.get<ApiResponse<LocationSearchResult[]>>(`${this.baseUrl}/locations/search`, { params });
  }

  /**
   * Search Tags API
   * GET /api/tags/list?SearchTerm=...
   */
  searchTags(query: string, page: number = 1, pageSize: number = 20): Observable<ApiResponse<import('../models/createcommunty').Tag[]>> {
    const params = new HttpParams()
      .set('SearchTerm', query)
      .set('Page', page)
      .set('PageSize', pageSize);

    return this.http.get<ApiResponse<import('../models/createcommunty').Tag[]>>(`${this.baseUrl}/tags/list`, { params });
  }

  /**
   * Create Community (Updated)
   * Sends 'LocationId' as integer instead of Location object
   */
  createCommunity(data: any, avatar?: File, cover?: File): Observable<ApiResponse<string>> {
    const formData = new FormData();

    formData.append('Name', data.name);
    formData.append('Description', data.description);
    formData.append('Slug', data.slug || '');
    formData.append('Type', data.type.toString());
    formData.append('IsPrivate', data.isPrivate ? 'true' : 'false');

    if (data.locationId) {
      formData.append('LocationId', data.locationId.toString());
    }

    if (avatar) formData.append('AvatarImage', avatar);
    if (cover) formData.append('CoverImage', cover);

    console.log('Submitting community create request:', {
      name: data.name,
      type: data.type,
      locationId: data.locationId
    });

    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/communities/create`, formData);
  }
}