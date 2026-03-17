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
    tags: string[];      // مصفوفة نصوص
    attachments: File[]; // مصفوفة ملفات
  }): Observable<ApiResponse<any>> {
    
    const formData = new FormData();

    // إضافة البيانات الأساسية
    formData.append('CommunityId', data.communityId.toString());
    formData.append('Title', data.title || '');
    formData.append('Content', data.content || '');

    // ✅ إضافة التاجات (تكرار المفتاح 'Tags' لكل قيمة)
    // Backend expects: Tags -> array<string>
    if (data.tags && data.tags.length > 0) {
      data.tags.forEach(tag => {
        formData.append('Tags', tag);
      });
    }

    // ✅ إضافة الصور
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach(file => {
        formData.append('Attachments', file);
      });
    }

    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/communities/create-post`, formData);
  }
}