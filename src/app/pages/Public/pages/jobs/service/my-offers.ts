import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { MyOffersResponse } from '../models/my-offers';

@Injectable({ providedIn: 'root' })
export class MyOffersService {
  private http = inject(HttpClient);
  // Base URL: /api/professions/offers
  private baseUrl = `${environment.apiBaseUrl}/professions/offers`;

  // 1. Get All Offers
  getMyOffers(page: number = 1, pageSize: number = 20, isActive?: boolean): Observable<MyOffersResponse> {
    let params = new HttpParams()
      .set('Page', page.toString())
      .set('PageSize', pageSize.toString());

    if (isActive !== undefined && isActive !== null) {
      params = params.set('IsActive', isActive.toString());
    }

    return this.http.get<MyOffersResponse>(`${this.baseUrl}/my-offers`, { params });
  }

  // 2. Get Single Offer (عشان نعرض البيانات في صفحة التعديل)
  getOfferById(offerId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${offerId}`);
  }

  // 3. Update Offer (PUT)
  updateOffer(offerId: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${offerId}/update`, data);
  }

  // 4. Delete Offer (DELETE)
  deleteOffer(offerId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${offerId}/delete`);
  }
}