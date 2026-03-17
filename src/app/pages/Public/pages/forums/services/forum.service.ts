import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Forum, ApiResponse, ForumDetailsData, QuestionDetailsData } from '../models/forum';

@Injectable({
    providedIn: 'root'
})
export class ForumService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiBaseUrl}/forums`;

    getForums(): Observable<ApiResponse<Forum[]>> {
        return this.http.get<ApiResponse<Forum[]>>(this.baseUrl);
    }

    getForumQuestions(slug: string, page: number = 1, pageSize: number = 10): Observable<ApiResponse<ForumDetailsData>> {
        return this.http.get<ApiResponse<ForumDetailsData>>(`${this.baseUrl}/${slug}`, {
            params: {
                Page: page.toString(),
                PageSize: pageSize.toString()
            }
        });
    }

    createQuestion(payload: { ForumId: number; Title: string; Content: string }): Observable<ApiResponse<number>> {
        return this.http.post<ApiResponse<number>>(`${this.baseUrl}/questions/create`, payload);
    }

    getQuestionDetails(questionId: number): Observable<ApiResponse<QuestionDetailsData>> {
        return this.http.get<ApiResponse<QuestionDetailsData>>(`${this.baseUrl}/questions/${questionId}`);
    }

    createAnswer(payload: { QuestionId: number; Content: string }): Observable<ApiResponse<number>> {
        return this.http.post<ApiResponse<number>>(`${this.baseUrl}/answers/create`, payload);
    }
}

