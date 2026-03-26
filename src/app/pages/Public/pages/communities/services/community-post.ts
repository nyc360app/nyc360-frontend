import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

// تعريف شكل الاستجابة
export interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
  error: { code: string; message: string } | null;
}

@Injectable({
  providedIn: 'root',
})
export class CommunityPostService {
  
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}`;

  /**
   * Create Post API
   * Endpoint: POST /api/communities/create-post
   * Body: Multipart/Form-Data
   */
  createPost(data: {
    communityId: number;
    title: string;
    content: string;
    tags: string[];
    attachments: File[];
  }): Observable<ApiResponse<any>> {
    const formData = new FormData();

    formData.append('communityId', String(data.communityId));
    formData.append('title', data.title || '');
    formData.append('content', data.content || '');

    if (data.tags && data.tags.length > 0) {
      data.tags.forEach(tag => {
        formData.append('tags', tag);
      });
    }

    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }

    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/communities/create-post`, formData);
  }
}
