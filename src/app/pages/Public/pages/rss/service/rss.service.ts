import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CategoryEnum } from '../../../Widgets/feeds/models/categories';

export interface ConnectRssRequest {
    url: string;
    category: number;
    name: string;
    description: string;
    imageUrl?: string;
    language?: string;
    sourceWebsite?: string;
    sourceCredibility?: string;
    agreementAccepted: boolean;
    divisionTag?: string;
    logoImage?: File | null;
}

@Injectable({
    providedIn: 'root'
})
export class RssService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiBaseUrl}/rss/connect`;
    private newsApiUrl = `${environment.apiBaseUrl}/news/rss/connect`;

    connectRss(data: ConnectRssRequest): Observable<any> {
        const formData = this.buildConnectRssFormData(data);

        if (Number(data?.category) === CategoryEnum.News) {
            return this.http.post(this.newsApiUrl, formData);
        }

        return this.http.post(this.apiUrl, formData);
    }

    private buildConnectRssFormData(data: ConnectRssRequest): FormData {
        const formData = new FormData();
        formData.append('url', data.url);
        formData.append('category', String(Number(data.category) || 0));
        formData.append('name', data.name);
        formData.append('description', data.description || '');
        formData.append('imageUrl', data.imageUrl || '');
        formData.append('language', data.language || '');
        formData.append('sourceWebsite', data.sourceWebsite || '');
        formData.append('sourceCredibility', data.sourceCredibility || '');
        formData.append('agreementAccepted', String(!!data.agreementAccepted));
        formData.append('divisionTag', data.divisionTag || '');

        if (data.logoImage) {
            formData.append('logoImage', data.logoImage, data.logoImage.name);
        }

        return formData;
    }
}
