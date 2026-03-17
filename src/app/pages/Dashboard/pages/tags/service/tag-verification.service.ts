import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { TagVerificationResponse, ResolveTagVerification } from '../models/tag-verification.model';

@Injectable({ providedIn: 'root' })
export class TagVerificationService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiBaseUrl}/verifications/tags`;

    getPendingRequests(page: number = 1, pageSize: number = 20): Observable<TagVerificationResponse> {
        const params = new HttpParams()
            .set('Page', page.toString())
            .set('PageSize', pageSize.toString());

        return this.http.get<TagVerificationResponse>(`${this.apiUrl}/pending`, { params });
    }

    resolveRequest(data: ResolveTagVerification): Observable<any> {
        return this.http.post(`${this.apiUrl}/resolve`, data);
    }
}
