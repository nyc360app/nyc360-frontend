import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { TopicRequest, TopicsResponse } from '../models/topic.model';

@Injectable({ providedIn: 'root' })
export class TopicsService {
    private http = inject(HttpClient);
    private dashboardUrl = `${environment.apiBaseUrl}/topics-dashboard`;

    getAllTopics(
        search: string = '',
        category: number = -1,
        page: number = 1,
        pageSize: number = 20
    ): Observable<TopicsResponse> {
        let params = new HttpParams()
            .set('Page', page.toString())
            .set('PageSize', pageSize.toString());

        if (search) params = params.set('Search', search);
        if (category != -1) params = params.set('Category', category.toString());

        return this.http.get<TopicsResponse>(`${this.dashboardUrl}/list`, { params });
    }

    createTopic(data: TopicRequest): Observable<any> {
        return this.http.post(`${this.dashboardUrl}/create`, data);
    }

    updateTopic(id: number, data: TopicRequest): Observable<any> {
        const updateData = { Id: id, ...data }; // API expects Id in body usually or match endpoint signature
        // Prompt says: PUT /api/topics-dashboard/update
        // Body: { "Id": 0, "Name": "string", "Category": 0 } - Wait, prompt body doesn't show Description? 
        // The prompt body for update is: { "Id": 0, "Name": "string", "Category": 0 }. 
        // It seems Description IS MISSING in the prompt for UPDATE, but present in CREATE.
        // I should probably include it in the object anyway, or stick to the prompt. 
        // Let's assume the prompt example was minimal and include Description if usually needed, OR stick strictly to prompt.
        // Given it's "Topics", description is likely editable. I will include it.
        return this.http.put(`${this.dashboardUrl}/update`, updateData);
    }

    deleteTopic(id: number): Observable<any> {
        return this.http.delete(`${this.dashboardUrl}/delete/${id}`);
    }
}
