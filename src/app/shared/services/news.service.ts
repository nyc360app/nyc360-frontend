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
}
