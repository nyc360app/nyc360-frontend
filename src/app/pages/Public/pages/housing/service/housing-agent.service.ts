import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class HousingAgentService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiBaseUrl}/housing/agent`;

    getAgentDashboard(): Observable<any> {
        return this.http.get(`${this.apiUrl}/dashboard`);
    }

    getAgentListings(page: number, pageSize: number): Observable<any> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('pageSize', pageSize.toString());
        return this.http.get(`${this.apiUrl}/listings`, { params });
    }

    cancelHousingRequest(requestId: number | string): Observable<any> {
        return this.http.put(`${this.apiUrl}/request/${requestId}/cancel`, {});
    }
}
