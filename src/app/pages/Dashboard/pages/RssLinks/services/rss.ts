import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CreateRssRequest, RssResponse, RssRequestResponse, RssRequestUpdate, RssSingleResponse } from '../models/rss';

@Injectable({
  providedIn: 'root'
})
export class RssService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/rss-dashboard`;

  // --- GET LIST ---
  getAllRssSources(): Observable<RssResponse> {
    return this.http.get<RssResponse>(`${this.baseUrl}/list`);
  }

  // --- TEST (Verify & Fetch Data) ---
  testRssSource(url: string): Observable<RssSingleResponse> {
    return this.http.get<RssSingleResponse>(`${this.baseUrl}/test?url=${encodeURIComponent(url)}`);
  }

  // --- CREATE (Multipart/Form-Data) ---
  createRssSource(data: CreateRssRequest): Observable<any> {
    const formData = new FormData();
    formData.append('Url', data.url);
    formData.append('Category', data.category.toString());
    formData.append('Name', data.name);
    if (data.description) formData.append('Description', data.description);
    if (data.imageUrl) formData.append('ImageUrl', data.imageUrl);
    if (data.image) formData.append('Image', data.image);

    return this.http.post(`${this.baseUrl}/create`, formData);
  }

  // --- UPDATE (Multipart/Form-Data) ---
  updateRssSource(id: number, data: any, file?: File): Observable<any> {
    const formData = new FormData();
    formData.append('Id', id.toString());
    formData.append('RssUrl', data.rssUrl);
    formData.append('Category', data.category.toString());
    formData.append('Name', data.name);
    if (data.description) formData.append('Description', data.description);
    formData.append('IsActive', data.isActive.toString());

    if (file) {
      formData.append('Image', file);
    }

    return this.http.put(`${this.baseUrl}/update`, formData);
  }

  // --- DELETE ---
  deleteRssSource(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }

  // --- GET REQUESTS (User suggested sources) ---
  getRssRequests(page: number = 1, size: number = 10, status?: number): Observable<RssRequestResponse> {
    let params = new HttpParams()
      .set('PageNumber', page.toString())
      .set('PageSize', size.toString());

    if (status !== undefined) {
      params = params.set('Status', status.toString());
    }

    return this.http.get<RssRequestResponse>(`${this.baseUrl}/requests`, { params });
  }

  // --- UPDATE REQUEST STATUS ---
  updateRssRequestStatus(data: RssRequestUpdate): Observable<any> {
    // Transform to PascalCase for Backend
    const payload = {
      Id: data.id,
      Status: data.status,
      AdminNote: data.adminNote
    };
    return this.http.put(`${this.baseUrl}/requests/update`, payload);
  }
}
