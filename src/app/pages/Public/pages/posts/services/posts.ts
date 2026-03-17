import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  ApiResponse, Post, FeedData, InteractionType, PostComment
} from '../models/posts';

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  private http = inject(HttpClient);

  private baseUrl = `${environment.apiBaseUrl}/posts`;
  private feedUrl = `${environment.apiBaseUrl}/feeds/all/home`;
  private communitiesUrl = `${environment.apiBaseUrl}/communities`;

  // =================================================================
  // 1. PUBLIC METHODS
  // =================================================================

  getPostsFeed(): Observable<ApiResponse<FeedData>> {
    return this.http.get<ApiResponse<FeedData>>(this.feedUrl);
  }

  getPostsByTag(tag: string, page: number = 1, pageSize: number = 20): Observable<ApiResponse<Post[]>> {
    let params = new HttpParams().set('Page', page).set('PageSize', pageSize);
    return this.http.get<ApiResponse<Post[]>>(`${this.baseUrl}/tags/${encodeURIComponent(tag)}`, { params });
  }

  joinCommunity(id: number): Observable<ApiResponse<any>> {
    const body = { CommunityId: id };
    return this.http.post<ApiResponse<any>>(`${this.communitiesUrl}/join`, body);
  }

  savePost(id: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/${id}/save`, {});
  }

  // ✅ Share Post according to Swagger
  sharePost(id: number, commentary: string = ''): Observable<ApiResponse<any>> {
    const body = { Commentary: commentary };
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/${id}/share`, body);
  }

  // ✅ NEW: Report Post according to Swagger
  // Endpoint: POST /api/posts/{PostId}/report
  reportPost(id: number, reason: number, details: string): Observable<ApiResponse<any>> {
    const body = { Reason: reason, Details: details };
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/${id}/report`, body);
  }

  // =================================================================
  // 2. EXISTING METHODS
  // =================================================================

  getAllPosts(category?: number, search?: string, page: number = 1, pageSize: number = 10): Observable<ApiResponse<Post[]>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (category !== undefined && category !== null && category !== -1) params = params.set('category', category.toString());
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<Post[]>>(`${this.baseUrl}/list`, { params });
  }

  getPostById(id: number): Observable<ApiResponse<Post>> {
    return this.http.get<ApiResponse<Post>>(`${this.baseUrl}/${id}`);
  }

  createPost(data: any, files?: File[]): Observable<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('Title', data.title);
    formData.append('Content', data.content);
    if (data.category !== null) formData.append('Category', data.category.toString());
    if (data.type !== null) formData.append('Type', data.type.toString());
    if (data.locationId !== null) formData.append('LocationId', data.locationId.toString());

    // Handle Tags (Array of integers)
    if (data.tags && Array.isArray(data.tags)) {
      data.tags.forEach((tag: number) => {
        formData.append('Tags', tag.toString());
      });
    }

    // Handle Attachments
    if (files && files.length > 0) {
      files.forEach(file => formData.append('Attachments', file));
    }

    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/create`, formData);
  }

  updatePost(id: number, data: any, files?: File[], removedAttachmentIds: number[] = []): Observable<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('PostId', id.toString());
    formData.append('Title', data.title);
    formData.append('Content', data.content);
    if (data.category !== null && data.category !== undefined) formData.append('Category', data.category.toString());

    // Handle Tags
    if (data.tags && Array.isArray(data.tags)) {
      data.tags.forEach((tag: number) => {
        formData.append('TagIds', tag.toString());
      });
    }

    // New Attachments
    if (files && files.length > 0) {
      files.forEach(file => formData.append('AddedAttachments', file));
    }

    // Removed Attachments
    if (removedAttachmentIds && removedAttachmentIds.length > 0) {
      removedAttachmentIds.forEach(attId => {
        formData.append('RemovedAttachments', attId.toString());
      });
    }

    return this.http.put<ApiResponse<any>>(`${this.baseUrl}/edit`, formData);
  }

  deletePost(id: number): Observable<ApiResponse<any>> {
    return this.http.request<ApiResponse<any>>('delete', `${this.baseUrl}/delete`, { body: { postId: id } });
  }

  interact(postId: number, type: InteractionType): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.baseUrl}/${postId}/interact`, { type });
  }

  addComment(postId: number, content: string, parentCommentId?: number): Observable<ApiResponse<PostComment>> {
    const body = { postId, content, parentCommentId: parentCommentId || 0 };
    return this.http.post<ApiResponse<PostComment>>(`${this.baseUrl}/comment`, body);
  }
  searchLocations(query: string, limit: number = 20): Observable<ApiResponse<any[]>> {
    const params = new HttpParams().set('Query', query).set('Limit', limit.toString());
    return this.http.get<ApiResponse<any[]>>(`${environment.apiBaseUrl}/locations/search`, { params });
  }

  // Tags endpoint based on User's request
  searchTags(searchTerm: string, page: number = 1, pageSize: number = 20): Observable<ApiResponse<any[]>> {
    const params = new HttpParams()
      .set('SearchTerm', searchTerm)
      .set('Page', page.toString())
      .set('PageSize', pageSize.toString());
    return this.http.get<ApiResponse<any[]>>(`${environment.apiBaseUrl}/tags/list`, { params });
  }

  // ✅ Housing Methods
  getHousingAgentRequests(page: number = 1, pageSize: number = 20): Observable<ApiResponse<any>> {
    const params = new HttpParams().set('Page', page).set('PageSize', pageSize);
    return this.http.get<ApiResponse<any>>(`${environment.apiBaseUrl}/housing/agent/requests`, { params });
  }

  // ✅ Housing Application Submission
  submitHousingApplication(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiBaseUrl}/housing/agent/request`, data);
  }

  // ✅ My Housing Requests
  getMyHousingRequests(page: number = 1, pageSize: number = 20): Observable<ApiResponse<any>> {
    const params = new HttpParams().set('Page', page).set('PageSize', pageSize);
    return this.http.get<ApiResponse<any>>(`${environment.apiBaseUrl}/housing/requests/my-requests`, { params });
  }

  updateHousingRequestStatus(requestId: number | string, status: number): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${environment.apiBaseUrl}/housing/agent/request/${requestId}/status`, { Status: status });
  }

  // ✅ Get My Posts by Category (My Inquiries/List)
  getMyPostsByCategory(category: number, page: number = 1, pageSize: number = 20): Observable<ApiResponse<Post[]>> {
    const params = new HttpParams()
      .set('Page', page.toString())
      .set('PageSize', pageSize.toString());
    return this.http.get<ApiResponse<Post[]>>(`${this.baseUrl}/me/category/${category}`, { params });
  }

  // ✅ Get My Category Analysis
  getMyCategoryAnalysis(category: number, page: number = 1, pageSize: number = 20): Observable<ApiResponse<any>> {
    const params = new HttpParams()
      .set('Page', page.toString())
      .set('PageSize', pageSize.toString());
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/me/category/${category}/analysis`, { params });
  }

  // ✅ Get Saved Posts (Inquiries)
  getSavedPosts(category?: number, page: number = 1, pageSize: number = 20): Observable<ApiResponse<Post[]>> {
    let params = new HttpParams()
      .set('Page', page.toString())
      .set('PageSize', pageSize.toString());
    if (category !== undefined && category !== null && category !== -1) {
      params = params.set('Category', category.toString());
    }
    return this.http.get<ApiResponse<Post[]>>(`${this.baseUrl}/saved`, { params });
  }
}