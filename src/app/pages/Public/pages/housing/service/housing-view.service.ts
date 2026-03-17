import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class HousingViewService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiBaseUrl}/housing`;

    getHousingHome(): Observable<any> {
        return this.http.get(`${this.apiUrl}/home`);
    }

    getHousingFeed(params: any): Observable<any> {
        let httpParams = new HttpParams();
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                httpParams = httpParams.append(key, params[key]);
            }
        });
        return this.http.get(`${this.apiUrl}/feed`, { params: httpParams });
    }

    getHousingDetails(id: number | string): Observable<any> {
        return this.http.get(`${this.apiUrl}/${id}`);
    }
}
