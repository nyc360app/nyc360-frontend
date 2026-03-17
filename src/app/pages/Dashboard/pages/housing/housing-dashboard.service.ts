import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface HousingAttachment {
    id: number;
    url: string;
}

export interface HousingAvailability {
    availabilityType: number;
    dates: string[];
    timeFrom: string;
    timeTo: string;
}

export interface HousingAuthorization {
    id: number;
    houseListingId: number;
    fullName: string;
    organizationName: string;
    email: string;
    phoneNumber: string;
    availabilities: HousingAvailability[];
    authorizationType: number;
    listingAuthorizationDocument: number;
    authorizationValidationDate: string;
    saveThisAuthorizationForFutureListings: boolean;
    attachments: HousingAttachment[];
}

export interface HousingListing {
    id: number;
    imageUrl: string;
    price: number;
    neighborhood: string;
    houseType: string;
    bedrooms: number;
    bathrooms: number;
    totalInquiries: number;
    isPublished: boolean;
    createdAt: string;
    authorization: HousingAuthorization | null;
    // UI Helper
    isExpanded?: boolean;
}

export interface HousingDashboardListResponse {
    isSuccess: boolean;
    data: HousingListing[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    error: any;
}

@Injectable({
    providedIn: 'root'
})
export class HousingDashboardService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiBaseUrl + '/housing-dashboard';

    getList(page: number, pageSize: number, isPublished?: boolean, search?: string): Observable<HousingDashboardListResponse> {
        let params = new HttpParams()
            .set('PageNumber', page.toString())
            .set('PageSize', pageSize.toString());

        if (isPublished !== undefined && isPublished !== null) {
            params = params.set('IsPublished', isPublished.toString());
        }

        if (search) {
            params = params.set('Search', search);
        }

        return this.http.get<HousingDashboardListResponse>(`${this.apiUrl}/list`, { params });
    }

    publish(houseId: number, isPublished: boolean): Observable<any> {
        return this.http.post(`${this.apiUrl}/publish`, {
            HouseId: houseId,
            IsPublished: isPublished
        });
    }
}
