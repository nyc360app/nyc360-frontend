// location-dashboard.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { LocationListResponse, LocationRequest, LocationSingleResponse } from '../models/location.model';

@Injectable({ providedIn: 'root' })
export class LocationDashboardService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiBaseUrl}/locations-dashboard`;

    getLocations(
        page: number = 1,
        pageSize: number = 20,
        search: string = ''
    ): Observable<LocationListResponse> {
        let params = new HttpParams()
            .set('Page', page.toString())
            .set('PageSize', pageSize.toString());

        if (search) {
            params = params.set('Search', search);
        }

        return this.http.get<LocationListResponse>(`${this.baseUrl}/list`, { params });
    }

    createLocation(data: LocationRequest): Observable<LocationSingleResponse> {
        return this.http.post<LocationSingleResponse>(`${this.baseUrl}/create`, data);
    }

    updateLocation(id: number, data: LocationRequest): Observable<LocationSingleResponse> {
        return this.http.put<LocationSingleResponse>(`${this.baseUrl}/update/${id}`, data);
    }

    deleteLocation(id: number): Observable<LocationSingleResponse> {
        return this.http.delete<LocationSingleResponse>(`${this.baseUrl}/delete/${id}`);
    }

    // To get a single location for editing, if needed. 
    // The API list didn't specify a GET by ID but standard dashboards usually have one
    // or we pass the data from the list.
    getLocationById(id: number): Observable<LocationSingleResponse> {
        return this.http.get<LocationSingleResponse>(`${this.baseUrl}/${id}`);
    }
}
