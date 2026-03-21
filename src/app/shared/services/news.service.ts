import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CategoryHomeResponse } from '../../pages/Public/Widgets/category-home/models/category-home.models';

export interface NewsAccess {
  canSubmitContent: boolean;
  canModerateContent: boolean;
  canPublishContent: boolean;
  canConnectRss: boolean;
  canReviewRssRequests: boolean;
  canListNewsOrganizationInSpace: boolean;
  grantedKeys: string[];
}

export interface NewsPaginatedResponse<T> {
  isSuccess: boolean;
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  error: any;
}

export const EMPTY_NEWS_ACCESS: NewsAccess = {
  canSubmitContent: false,
  canModerateContent: false,
  canPublishContent: false,
  canConnectRss: false,
  canReviewRssRequests: false,
  canListNewsOrganizationInSpace: false,
  grantedKeys: []
};

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private readonly http = inject(HttpClient);
  private readonly newsBaseUrl = `${environment.apiBaseUrl}/news`;
  private readonly newsDashboardBaseUrl = `${environment.apiBaseUrl}/news-dashboard`;

  private accessRequest$: Observable<NewsAccess> | null = null;

  getNewsHome(limit: number = 20): Observable<CategoryHomeResponse> {
    const params = new HttpParams().set('Limit', limit.toString());

    return this.http.get<any>(`${this.newsBaseUrl}/home`, { params }).pipe(
      map((response) => this.normalizeHomeResponse(response))
    );
  }

  getNewsAccess(forceRefresh: boolean = false): Observable<NewsAccess> {
    if (!forceRefresh && this.accessRequest$) {
      return this.accessRequest$;
    }

    this.accessRequest$ = this.http.get<any>(`${this.newsBaseUrl}/me/access`).pipe(
      map((response) => this.normalizeAccessResponse(response)),
      catchError(() => of(EMPTY_NEWS_ACCESS)),
      shareReplay(1)
    );

    return this.accessRequest$;
  }

  refreshNewsAccess(): Observable<NewsAccess> {
    this.accessRequest$ = null;
    return this.getNewsAccess(true);
  }

  getPendingSubmissions(page: number = 1, pageSize: number = 20, search: string = ''): Observable<NewsPaginatedResponse<any>> {
    let params = new HttpParams()
      .set('Page', page.toString())
      .set('PageSize', pageSize.toString());

    if (search.trim()) {
      params = params.set('Search', search.trim());
    }

    return this.http.get<any>(`${this.newsDashboardBaseUrl}/submissions/pending`, { params }).pipe(
      map((response) => this.normalizePaginatedResponse(response))
    );
  }

  reviewSubmission(postId: number, approved: boolean, moderationNote: string = ''): Observable<any> {
    return this.http.put(`${this.newsDashboardBaseUrl}/submissions/review`, {
      PostId: postId,
      Approved: approved,
      ModerationNote: moderationNote
    });
  }

  getNewsRssRequests(pageNumber: number = 1, pageSize: number = 20, status: string = 'Pending'): Observable<NewsPaginatedResponse<any>> {
    let params = new HttpParams()
      .set('PageNumber', pageNumber.toString())
      .set('PageSize', pageSize.toString());

    if (status.trim()) {
      params = params.set('Status', status.trim());
    }

    return this.http.get<any>(`${this.newsDashboardBaseUrl}/rss/requests`, { params }).pipe(
      map((response) => this.normalizePaginatedResponse(response))
    );
  }

  reviewNewsRssRequest(id: number, status: string, adminNote: string = ''): Observable<any> {
    return this.http.put(`${this.newsDashboardBaseUrl}/rss/requests/review`, {
      Id: id,
      Status: status,
      AdminNote: adminNote
    });
  }

  getNewsRssSources(): Observable<any[]> {
    return this.http.get<any>(`${this.newsDashboardBaseUrl}/rss/sources`).pipe(
      map((response) => response?.data ?? response?.Data ?? [])
    );
  }

  createNewsRssSource(formData: FormData): Observable<any> {
    return this.http.post(`${this.newsDashboardBaseUrl}/rss/create`, formData);
  }

  updateNewsRssSource(formData: FormData): Observable<any> {
    return this.http.put(`${this.newsDashboardBaseUrl}/rss/update`, formData);
  }

  deleteNewsRssSource(sourceId: number): Observable<any> {
    return this.http.delete(`${this.newsDashboardBaseUrl}/rss/delete/${sourceId}`);
  }

  testNewsRssSource(url: string): Observable<any> {
    const params = new HttpParams().set('Url', url);
    return this.http.get(`${this.newsDashboardBaseUrl}/rss/test`, { params });
  }

  private normalizeHomeResponse(response: any): CategoryHomeResponse {
    const payload = response?.data ?? response?.Data ?? {};

    return {
      isSuccess: response?.isSuccess ?? response?.IsSuccess ?? true,
      data: {
        featured: payload?.featured ?? payload?.Featured ?? [],
        latest: payload?.latest ?? payload?.Latest ?? [],
        trending: payload?.trending ?? payload?.Trending ?? [],
        tags: payload?.tags ?? payload?.Tags ?? []
      },
      error: response?.error ?? response?.Error ?? null
    };
  }

  private normalizeAccessResponse(response: any): NewsAccess {
    const isSuccess = response?.isSuccess ?? response?.IsSuccess;
    if (isSuccess === false) {
      return EMPTY_NEWS_ACCESS;
    }

    const payload = response?.data ?? response?.Data ?? response ?? {};

    return {
      canSubmitContent: !!(payload?.canSubmitContent ?? payload?.CanSubmitContent),
      canModerateContent: !!(payload?.canModerateContent ?? payload?.CanModerateContent),
      canPublishContent: !!(payload?.canPublishContent ?? payload?.CanPublishContent),
      canConnectRss: !!(payload?.canConnectRss ?? payload?.CanConnectRss),
      canReviewRssRequests: !!(payload?.canReviewRssRequests ?? payload?.CanReviewRssRequests),
      canListNewsOrganizationInSpace: !!(payload?.canListNewsOrganizationInSpace ?? payload?.CanListNewsOrganizationInSpace),
      grantedKeys: Array.isArray(payload?.grantedKeys ?? payload?.GrantedKeys)
        ? [...(payload.grantedKeys ?? payload.GrantedKeys)]
        : []
    };
  }

  private normalizePaginatedResponse(response: any): NewsPaginatedResponse<any> {
    return {
      isSuccess: response?.isSuccess ?? response?.IsSuccess ?? true,
      data: response?.data ?? response?.Data ?? [],
      page: response?.page ?? response?.Page ?? 1,
      pageSize: response?.pageSize ?? response?.PageSize ?? 20,
      totalCount: response?.totalCount ?? response?.TotalCount ?? 0,
      totalPages: response?.totalPages ?? response?.TotalPages ?? 0,
      error: response?.error ?? response?.Error ?? null
    };
  }
}
