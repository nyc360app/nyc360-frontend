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
  canListNewsLocationsInSpace: boolean;
  canListNewsOrganizationsInSpace: boolean;
  canListNewsOrganizationInSpace: boolean;
  grantedBadges: Array<{ id: number | string; code: string; name: string }>;
  trustState: string | null;
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

export interface NewsPollOption {
  id: number;
  text: string;
  votes?: number;
  votePercent?: number;
}

export interface NewsPollSummary {
  pollId: number;
  slug: string;
  title: string;
  question: string;
  description?: string | null;
  status: string;
  allowMultipleAnswers: boolean;
  showResultsBeforeVoting: boolean;
  isFeatured: boolean;
  coverImageUrl?: string | null;
  optionCount: number;
  totalVotes: number;
  createdAt: string;
  closesAt?: string | null;
  hasVoted: boolean;
}

export interface NewsPollDetails extends NewsPollSummary {
  description?: string | null;
  creatorUserId?: number | null;
  locationId?: number | null;
  tags?: any[];
  selectedOptionIds: number[];
  canEdit: boolean;
  canVote: boolean;
  options: NewsPollOption[];
}

export interface NewsPollResults {
  pollId: number;
  status: string;
  totalVotes: number;
  showResultsBeforeVoting: boolean;
  options: NewsPollOption[];
}

export interface NewsFeaturedFeedItems<T> {
  items: T[];
  nextCursor?: string | null;
  hasMore?: boolean;
}

export interface NewsFeaturedFeedResponse<T> {
  isSuccess: boolean;
  data: NewsFeaturedFeedItems<T> | null;
  error: any;
}

export const EMPTY_NEWS_ACCESS: NewsAccess = {
  canSubmitContent: false,
  canModerateContent: false,
  canPublishContent: false,
  canConnectRss: false,
  canReviewRssRequests: false,
  canListNewsLocationsInSpace: false,
  canListNewsOrganizationsInSpace: false,
  canListNewsOrganizationInSpace: false,
  grantedBadges: [],
  trustState: null,
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

  getFeaturedNewsFeed(pageSize: number = 10, cursor?: string | null, page?: number): Observable<NewsFeaturedFeedResponse<any>> {
    let params = new HttpParams().set('pageSize', pageSize.toString());
    if (cursor) {
      params = params.set('cursor', cursor);
    } else if (page) {
      params = params.set('page', page.toString());
    }

    return this.http.get<any>(`${this.newsBaseUrl}/featured`, { params }).pipe(
      map((response) => ({
        isSuccess: response?.isSuccess ?? response?.IsSuccess ?? true,
        data: response?.data ?? response?.Data ?? null,
        error: response?.error ?? response?.Error ?? null
      }))
    );
  }

  createNewsPoll(formData: FormData): Observable<any> {
    return this.http.post(`${this.newsBaseUrl}/polls/create`, formData);
  }

  getMyNewsPolls(page: number = 1, pageSize: number = 20): Observable<NewsPaginatedResponse<NewsPollSummary>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<any>(`${this.newsBaseUrl}/polls/mine`, { params }).pipe(
      map((response) => this.normalizePaginatedResponse(response))
    );
  }

  getPublishedNewsPolls(page: number = 1, pageSize: number = 6): Observable<NewsPaginatedResponse<NewsPollSummary>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<any>(`${this.newsBaseUrl}/polls/published`, { params }).pipe(
      map((response) => this.normalizePaginatedResponse(response))
    );
  }

  getNewsPollById(pollId: number): Observable<{ isSuccess: boolean; data: NewsPollDetails | null; error: any }> {
    return this.http.get<any>(`${this.newsBaseUrl}/polls/${pollId}`).pipe(
      map((response) => ({
        isSuccess: response?.isSuccess ?? response?.IsSuccess ?? true,
        data: response?.data ?? response?.Data ?? null,
        error: response?.error ?? response?.Error ?? null
      }))
    );
  }

  voteOnNewsPoll(pollId: number, optionIds: number[]): Observable<any> {
    return this.http.post(`${this.newsBaseUrl}/polls/${pollId}/vote`, { optionIds });
  }

  getNewsPollResults(pollId: number): Observable<{ isSuccess: boolean; data: NewsPollResults | null; error: any }> {
    return this.http.get<any>(`${this.newsBaseUrl}/polls/${pollId}/results`).pipe(
      map((response) => ({
        isSuccess: response?.isSuccess ?? response?.IsSuccess ?? true,
        data: response?.data ?? response?.Data ?? null,
        error: response?.error ?? response?.Error ?? null
      }))
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
      canListNewsLocationsInSpace: !!(payload?.canListNewsLocationsInSpace ?? payload?.CanListNewsLocationsInSpace),
      canListNewsOrganizationsInSpace: !!(payload?.canListNewsOrganizationsInSpace ?? payload?.CanListNewsOrganizationsInSpace),
      canListNewsOrganizationInSpace: !!(
        payload?.canListNewsOrganizationsInSpace
        ?? payload?.CanListNewsOrganizationsInSpace
        ?? payload?.canListNewsOrganizationInSpace
        ?? payload?.CanListNewsOrganizationInSpace
      ),
      grantedBadges: Array.isArray(payload?.grantedBadges ?? payload?.GrantedBadges)
        ? (payload?.grantedBadges ?? payload?.GrantedBadges).map((badge: any) => ({
          id: badge?.id ?? badge?.Id ?? '',
          code: String(badge?.code ?? badge?.Code ?? '').trim(),
          name: String(badge?.name ?? badge?.Name ?? '').trim()
        })).filter((badge: any) => badge.code || badge.name)
        : [],
      trustState: payload?.trustState ?? payload?.TrustState ?? null,
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
