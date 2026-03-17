import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse, ProfessionFeedData } from '../models/profession-feed';

@Injectable({ providedIn: 'root' })
export class ProfessionFeedService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/professions/feed`;

  getFeed(): Observable<ApiResponse<ProfessionFeedData>> {
    return this.http.get<ApiResponse<ProfessionFeedData>>(this.apiUrl);
  }
}