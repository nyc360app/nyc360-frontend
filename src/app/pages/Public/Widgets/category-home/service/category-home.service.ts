import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CategoryHomeResponse } from '../models/category-home.models';
import { environment } from '../../../../../environments/environment';
import { CategoryEnum } from '../../feeds/models/categories';
import { NewsService } from '../../../../../shared/services/news.service';

@Injectable({
  providedIn: 'root'
})
export class CategoryHomeService {
  private http = inject(HttpClient);
  private newsService = inject(NewsService);
  private apiUrl = `${environment.apiBaseUrl}/feeds/common/home`;

  getCategoryHomeData(division: number, limit: number = 20): Observable<CategoryHomeResponse> {
    if (division === CategoryEnum.News) {
      return this.newsService.getNewsHome(limit);
    }

    const params = new HttpParams()
      .set('Division', division.toString())
      .set('Limit', limit.toString());

    return this.http.get<CategoryHomeResponse>(this.apiUrl, { params });
  }
}
