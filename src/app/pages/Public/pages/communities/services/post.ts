import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse, PostDetailsData, PostComment, InteractionType } from '../models/post-details';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private http = inject(HttpClient);
  // تأكد من أن الرابط يطابق الباك اند لديك
  private baseUrl = environment.apiBaseUrl + '/posts';

  // جلب تفاصيل البوست
  getPostDetails(id: number): Observable<ApiResponse<PostDetailsData>> {
    return this.http.get<ApiResponse<PostDetailsData>>(`${this.baseUrl}/${id}`);
  }

  // إضافة تعليق
  addComment(postId: number, content: string, parentCommentId?: number): Observable<ApiResponse<PostComment>> {
    const body = { postId, content, parentCommentId: parentCommentId || 0 };
    return this.http.post<ApiResponse<PostComment>>(`${this.baseUrl}/comment`, body);
  }

  // التفاعل (لايك / ديسلايك)
  interact(postId: number, type: InteractionType): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.baseUrl}/${postId}/interact`, { type });
  }

  // مشاركة البوست (اختياري)
  sharePost(id: number, commentary: string = ''): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/${id}/share`, { Commentary: commentary });
  }
}