import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CategoryHomeResponse, LatestRssFeedItemDto, StandardApiResponse } from '../models/category-home.models';
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
  private latestRssUrl = `${environment.apiBaseUrl}/rss-feed/items/latest`;

  getCategoryHomeData(division: number, limit: number = 20): Observable<CategoryHomeResponse> {
    if (division === CategoryEnum.News) {
      return this.newsService.getNewsHome(limit);
    }

    const params = new HttpParams()
      .set('Division', division.toString())
      .set('Limit', limit.toString());

    return this.http.get<CategoryHomeResponse>(this.apiUrl, { params });
  }

  getLatestRssItems(category: number, limit: number = 3): Observable<StandardApiResponse<LatestRssFeedItemDto[]>> {
    const params = new HttpParams()
      .set('Category', category.toString())
      .set('Limit', limit.toString());

    return this.http.get<StandardApiResponse<LatestRssFeedItemDto[]>>(this.latestRssUrl, { params });
  }
}
