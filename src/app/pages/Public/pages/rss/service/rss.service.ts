import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CategoryEnum } from '../../../Widgets/feeds/models/categories';

export interface ConnectRssRequest {
    Url: string;
    Category: number;
    Name: string;
    Description: string;
    ImageUrl?: string;
    Image?: File | null;
    Language?: string;
    SourceWebsite?: string;
    SourceCredibility?: string;
    DivisionTag?: string;
    AgreementAccepted?: boolean;
    LogoFileName?: string;
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

        if (Number(data?.Category) === CategoryEnum.News) {
            formData.delete('Category');
            return this.http.post(this.newsApiUrl, formData);
        }

        return this.http.post(this.apiUrl, formData);
    }

    private buildConnectRssFormData(data: ConnectRssRequest): FormData {
        const formData = new FormData();
        formData.append('Url', data.Url);
        formData.append('Category', String(Number(data.Category) || 0));
        formData.append('Name', data.Name);
        formData.append('Description', data.Description || '');
        formData.append('ImageUrl', data.ImageUrl || '');
        formData.append('Language', data.Language || '');
        formData.append('SourceWebsite', data.SourceWebsite || '');
        formData.append('SourceCredibility', data.SourceCredibility || '');
        formData.append('DivisionTag', data.DivisionTag || '');
        formData.append('AgreementAccepted', String(!!data.AgreementAccepted));
        formData.append('LogoFileName', data.LogoFileName || '');

        if (data.Image) {
            formData.append('Image', data.Image, data.Image.name);
        }

        return formData;
    }
}
