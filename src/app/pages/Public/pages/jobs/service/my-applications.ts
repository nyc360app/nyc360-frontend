import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { MyApplicationsResponse } from '../models/my-applications';

@Injectable({ providedIn: 'root' })
export class MyApplicationsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/professions/applications`;

  // جلب الطلبات مع Pagination
  getMyApplications(page: number = 1, pageSize: number = 20): Observable<MyApplicationsResponse> {
    const params = new HttpParams()
      .set('Page', page.toString())
      .set('PageSize', pageSize.toString());
    
    return this.http.get<MyApplicationsResponse>(`${this.apiUrl}/my-applications`, { params });
  }

  // سحب الطلب (Withdraw)
  withdrawApplication(applicationId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${applicationId}/withdraw`, {});
  }
}