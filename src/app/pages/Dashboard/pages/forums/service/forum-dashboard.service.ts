import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
    ForumListResponse,
    StandardResponse,
    UpdateModeratorsRequest,
    UpdateForumRequest,
    CreateForumRequest,
    CreateForumResponse
} from '../models/forum-dashboard.model';

@Injectable({ providedIn: 'root' })
export class ForumDashboardService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiBaseUrl}/forums-dashboard`;

    getForums(): Observable<ForumListResponse> {
        return this.http.get<ForumListResponse>(this.baseUrl);
    }

    createForum(request: CreateForumRequest): Observable<CreateForumResponse> {
        const formData = new FormData();
        formData.append('Title', request.title);
        formData.append('Slug', request.slug);
        formData.append('Description', request.description);

        if (request.iconFile) {
            formData.append('IconFile', request.iconFile);
        }

        return this.http.post<CreateForumResponse>(`${this.baseUrl}/create`, formData);
    }


    deleteForum(id: number): Observable<StandardResponse<any>> {
        return this.http.delete<StandardResponse<any>>(`${this.baseUrl}/${id}`);
    }

    updateForum(request: UpdateForumRequest): Observable<StandardResponse<any>> {
        const formData = new FormData();
        formData.append('Id', request.id.toString());
        formData.append('Title', request.title);
        formData.append('Slug', request.slug);
        formData.append('Description', request.description);
        formData.append('IsActive', request.isActive.toString());

        if (request.iconFile) {
            formData.append('IconFile', request.iconFile);
        }

        return this.http.put<StandardResponse<any>>(`${this.baseUrl}/update`, formData);
    }

    updateModerators(request: UpdateModeratorsRequest): Observable<StandardResponse<any>> {
        return this.http.put<StandardResponse<any>>(`${this.baseUrl}/moderators`, request);
    }
}
