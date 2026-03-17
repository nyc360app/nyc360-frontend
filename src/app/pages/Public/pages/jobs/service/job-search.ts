import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { JobSearchFilters, JobSearchResponse, LocationSearchResult } from '../models/job-search';

@Injectable({ providedIn: 'root' })
export class JobSearchService {
  private http = inject(HttpClient);
  private jobsUrl = `${environment.apiBaseUrl}/professions/offers`;
  private locationsUrl = `${environment.apiBaseUrl}/locations/search`;

  searchJobs(filters: JobSearchFilters): Observable<JobSearchResponse> {
    let params = new HttpParams();
    
    if (filters.Search) params = params.set('Search', filters.Search);
    if (filters.LocationId) params = params.set('LocationId', filters.LocationId.toString());
    if (filters.Arrangement !== undefined && filters.Arrangement !== null) params = params.set('Arrangement', filters.Arrangement.toString());
    if (filters.Type !== undefined && filters.Type !== null) params = params.set('Type', filters.Type.toString());
    if (filters.Level !== undefined && filters.Level !== null) params = params.set('Level', filters.Level.toString());
    if (filters.MinSalary) params = params.set('MinSalary', filters.MinSalary.toString());
    
    params = params.set('IsActive', filters.IsActive.toString());
    params = params.set('Page', filters.Page.toString());
    params = params.set('PageSize', filters.PageSize.toString());

    return this.http.get<JobSearchResponse>(this.jobsUrl, { params });
  }

  searchLocations(query: string): Observable<{ isSuccess: boolean, data: LocationSearchResult[] }> {
    return this.http.get<{ isSuccess: boolean, data: LocationSearchResult[] }>(
      `${this.locationsUrl}?Query=${query}&Limit=10`
    );
  }
}