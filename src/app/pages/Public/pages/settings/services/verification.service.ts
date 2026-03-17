import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface VerificationRequest {
    TagId: number;
    Reason: string;
    DocumentType: number;
    File: File;
}

@Injectable({
    providedIn: 'root'
})
export class VerificationService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiBaseUrl}/verifications`;

    submitVerification(data: VerificationRequest): Observable<any> {
        const formData = new FormData();
        formData.append('TagId', data.TagId.toString());
        formData.append('Reason', data.Reason);
        formData.append('DocumentType', data.DocumentType.toString());
        formData.append('File', data.File);

        return this.http.post(`${this.baseUrl}/tag/submit`, formData);
    }

    searchTags(query: string): Observable<any> {
        const params = new HttpParams()
            .set('SearchTerm', query)
            .set('Page', '1')
            .set('PageSize', '10');
        return this.http.get(`${environment.apiBaseUrl}/tags/list`, { params });
    }

    submitIdentityVerification(data: Omit<VerificationRequest, 'TagId'>): Observable<any> {
        const formData = new FormData();
        formData.append('Reason', data.Reason);
        formData.append('DocumentType', data.DocumentType.toString());
        formData.append('File', data.File);

        return this.http.post(`${this.baseUrl}/identity/submit`, formData);
    }
}
