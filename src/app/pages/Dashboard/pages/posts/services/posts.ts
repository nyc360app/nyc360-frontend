import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse, Post, InteractionType, Comment } from '../models/posts';

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  private http = inject(HttpClient);

  // Base URLs based on your structure
  private baseUrl = `${environment.apiBaseUrl}/posts-dashboard`;
  private baseUrl2 = `${environment.apiBaseUrl}/posts`;

  // =================================================================
  // READ OPERATIONS
  // =================================================================

  getAllPosts(category?: number, page: number = 1, pageSize: number = 10): Observable<ApiResponse<Post[]>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (category !== undefined && category !== null) {
      params = params.set('category', category.toString());
    }

    return this.http.get<ApiResponse<Post[]>>(`${this.baseUrl}/list`, { params });
  }

  getPostById(id: number): Observable<ApiResponse<Post>> {
    return this.http.get<ApiResponse<Post>>(`${this.baseUrl}/${id}`);
  }

  // =================================================================
  // WRITE OPERATIONS
  // =================================================================

  // =================================================================
  // REPORTING (New Feature)
  // =================================================================
  // Matches the endpoint: POST /api/posts/{postId}/report
  reportPost(postId: number, reason: number, details: string): Observable<ApiResponse<any>> {
    const body = { Reason: reason, Details: details };
    return this.http.post<ApiResponse<any>>(`${this.baseUrl2}/${postId}/report`, body);
  }

  // =================================================================
  // LOOKUPS (Locations & Tags)
  // =================================================================
  searchLocations(query: string, limit: number = 20): Observable<ApiResponse<any[]>> {
    const params = new HttpParams().set('Query', query).set('Limit', limit.toString());
    return this.http.get<ApiResponse<any[]>>(`${environment.apiBaseUrl}/locations/search`, { params });
  }

  searchTags(searchTerm: string, page: number = 1, pageSize: number = 20): Observable<ApiResponse<any[]>> {
    const params = new HttpParams()
      .set('SearchTerm', searchTerm)
      .set('Page', page.toString())
      .set('PageSize', pageSize.toString());
    return this.http.get<ApiResponse<any[]>>(`${environment.apiBaseUrl}/tags/list`, { params });
  }

  // Override create/update to support new fields
  createPost(data: any, files?: File[]): Observable<any> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('content', data.content);
    formData.append('category', data.category);

    // New Fields
    if (data.type !== null && data.type !== undefined) formData.append('Type', data.type.toString());
    if (data.locationId) formData.append('LocationId', data.locationId.toString());

    // Handle Tags (Array of integers)
    if (data.tags && Array.isArray(data.tags)) {
      data.tags.forEach((tag: number) => {
        formData.append('Tags', tag.toString());
      });
    }

    if (files && files.length > 0) {
      files.forEach((file) => formData.append('attachments', file));
    }
    return this.http.post(`${this.baseUrl}/create`, formData);
  }

  updatePost(id: number, data: any, files?: File[]): Observable<any> {
    const formData = new FormData();
    formData.append('postId', id.toString());
    formData.append('title', data.title);
    formData.append('content', data.content);
    formData.append('category', data.category);

    // New Fields
    if (data.type !== null && data.type !== undefined) formData.append('Type', data.type.toString());
    if (data.locationId) formData.append('LocationId', data.locationId.toString());

    // Handle Tags (Array of integers)
    if (data.tags && Array.isArray(data.tags)) {
      data.tags.forEach((tag: number) => {
        formData.append('Tags', tag.toString());
      });
    }

    if (files && files.length > 0) {
      files.forEach((file) => formData.append('addedAttachments', file));
    }
    return this.http.put(`${this.baseUrl}/edit`, formData);
  }
  deletePost(id: number): Observable<ApiResponse<any>> {
    return this.http.request<ApiResponse<any>>('delete', `${this.baseUrl}/delete`, {
      body: { postId: id }
    });
  }

  // =================================================================
  // INTERACTIONS (Likes & Comments)
  // =================================================================

  interact(postId: number, type: InteractionType): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.baseUrl2}/${postId}/interact`, { type });
  }

  addComment(postId: number, content: string, parentCommentId?: number): Observable<ApiResponse<Comment>> {
    const body = { postId, content, parentCommentId: parentCommentId || 0 };
    return this.http.post<ApiResponse<Comment>>(`${this.baseUrl2}/comment`, body);
  }

}