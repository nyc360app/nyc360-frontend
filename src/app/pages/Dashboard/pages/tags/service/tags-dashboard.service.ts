import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { TagRequest, TagsResponse } from '../models/tags.model';

@Injectable({ providedIn: 'root' })
export class TagsService {
  private http = inject(HttpClient);
  private dashboardUrl = `${environment.apiBaseUrl}/tags-dashboard`;
  private listUrl = `${environment.apiBaseUrl}/tags/list`;


  createTag(data: TagRequest): Observable<any> {
    return this.http.post(`${this.dashboardUrl}/create`, data);
  }

  getAllTags(
    searchTerm: string = '',
    type?: number,
    division?: number,
    page: number = 1,
    pageSize: number = 20
  ): Observable<TagsResponse> {
    let params = new HttpParams()
      .set('Page', page.toString())
      .set('PageSize', pageSize.toString());

    if (searchTerm) params = params.set('SearchTerm', searchTerm);
    if (type && type !== -1) params = params.set('Type', type.toString());
    if (division !== undefined && division !== -1) params = params.set('Division', division.toString());

    return this.http.get<TagsResponse>(this.listUrl, { params });
  }

  deleteTag(id: number): Observable<any> {
    return this.http.delete(`${this.dashboardUrl}/delete/${id}`);
  }
  updateTag(id: string, data: TagRequest): Observable<any> {
    return this.http.put(`${this.dashboardUrl}/update/${id}`, data);
  }

  getTagById(id: string): Observable<any> {
    return this.http.get(`${this.dashboardUrl}/${id}`);
  }

  searchTags(searchTerm: string): Observable<TagsResponse> {
    let params = new HttpParams().set('SearchTerm', searchTerm).set('PageSize', '10');
    return this.http.get<TagsResponse>(this.listUrl, { params });
  }
}