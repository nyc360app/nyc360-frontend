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
      .set('query', query)
      .set('limit', String(limit));

    return this.http.get<ApiResponse<LocationSearchResult[]>>(`${this.baseUrl}/locations/search`, { params });
  }

  /**
   * Search Tags API
   * GET /api/tags/list?SearchTerm=...
   */
  searchTags(query: string, page: number = 1, pageSize: number = 20): Observable<ApiResponse<import('../models/createcommunty').Tag[]>> {
    const params = new HttpParams()
      .set('searchTerm', query)
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    return this.http.get<ApiResponse<import('../models/createcommunty').Tag[]>>(`${this.baseUrl}/tags/list`, { params });
  }

  /**
   * Create Community (Updated)
   * Sends 'LocationId' as integer instead of Location object
   */
  createCommunity(data: any, avatar?: File, cover?: File): Observable<ApiResponse<string>> {
    const formData = new FormData();

    formData.append('name', data.name);
    formData.append('description', data.description);

    if (data.slug) {
      formData.append('slug', data.slug);
    }

    formData.append('type', String(data.type));
    formData.append('isPrivate', data.isPrivate ? 'true' : 'false');
    formData.append('borough', data.borough);
    formData.append('neighborhood', data.neighborhood);
    formData.append('zipCode', data.zipCode);

    if (data.categoryCode) {
      formData.append('categoryCode', data.categoryCode);
    }

    if (data.divisionTag) {
      formData.append('divisionTag', data.divisionTag);
    }

    if (data.locationId) {
      formData.append('locationId', String(data.locationId));
    }

    if (avatar) formData.append('avatarImage', avatar);
    if (cover) formData.append('coverImage', cover);

    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/communities/create`, formData);
  }
}
