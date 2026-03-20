import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CategoryEnum } from '../../../Widgets/feeds/models/categories';

@Injectable({
    providedIn: 'root'
})
export class RssService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiBaseUrl}/rss/connect`;
    private newsApiUrl = `${environment.apiBaseUrl}/news/rss/connect`;

    connectRss(data: { Url: string; Category: number; Name: string; Description: string; ImageUrl: string }): Observable<any> {
        if (Number(data?.Category) === CategoryEnum.News) {
            return this.http.post(this.newsApiUrl, {
                Url: data.Url,
                Name: data.Name,
                Description: data.Description || '',
                ImageUrl: data.ImageUrl || ''
            });
        }

        return this.http.post(this.apiUrl, data);
    }
}
