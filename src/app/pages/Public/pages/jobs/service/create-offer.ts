import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse, CreateOfferRequest } from '../models/create-offer';

@Injectable({ providedIn: 'root' })
export class CreateOfferService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/professions/offers/create`;

  createOffer(data: CreateOfferRequest): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(this.apiUrl, data);
  }

  searchLocations(query: string): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/locations/search`, {
      params: { Query: query, Limit: 15 }
    });
  }
}