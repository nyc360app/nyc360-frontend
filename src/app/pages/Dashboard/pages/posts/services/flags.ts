import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FlagsApiResponse, ReviewFlagRequest } from '../models/flags';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FlagsService {
  private http = inject(HttpClient);
  
  // Dashboard Endpoint Base
  private baseUrl = `${environment.apiBaseUrl}/flags-dashboard`;

  // 1. GET Pending Flags
  getPendingFlags(page: number = 1, pageSize: number = 10): Observable<FlagsApiResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<FlagsApiResponse>(`${this.baseUrl}/posts/pending`, { params });
  }

  // 2. POST Review Action
  reviewFlag(flagId: number, body: ReviewFlagRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/posts/${flagId}/review`, body);
  }
}