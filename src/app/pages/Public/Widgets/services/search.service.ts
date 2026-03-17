import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface SearchResult {
    isSuccess: boolean;
    data: {
        posts: any[];
        users: any[];
        communities: any[];
        tags: any[];
    };
    error: any;
}

@Injectable({
    providedIn: 'root'
})
export class SearchService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiBaseUrl + '/common/global-search';

    search(term: string, division?: number, limit: number = 10): Observable<SearchResult> {
        let params = new HttpParams()
            .set('Term', term)
            .set('Limit', limit.toString());

        if (division !== undefined) {
            params = params.set('Division', division.toString());
        }

        return this.http.get<SearchResult>(this.apiUrl, { params });
    }
}
