import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CategoryHomeResponse } from '../models/category-home.models';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoryHomeService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/feeds/common/home`;

  getCategoryHomeData(division: number, limit: number = 20): Observable<CategoryHomeResponse> {
    const params = new HttpParams()
      .set('Division', division.toString())
      .set('Limit', limit.toString());

    return this.http.get<CategoryHomeResponse>(this.apiUrl, { params });
  }
}