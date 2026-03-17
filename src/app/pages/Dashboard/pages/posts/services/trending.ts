// src/app/pages/Dashboard/pages/trending/services/trending.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { TrendingResponse } from '../models/trending';

@Injectable({
  providedIn: 'root'
})
export class TrendingService {
  private http = inject(HttpClient);
  
  private baseUrl = `${environment.apiBaseUrl}/posts`;


  getTrendingPosts(page: number = 1, pageSize: number = 15): Observable<TrendingResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<TrendingResponse>(`${this.baseUrl}/trending`, { params });
  }
}