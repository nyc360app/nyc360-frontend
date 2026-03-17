import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { EventListItem, PaginatedEventResponse } from '../models/events-list.model';

@Injectable({
    providedIn: 'root'
})
export class EventsListService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiBaseUrl}/events`;

    // As per user request: ALL images (Event Banners & Organizer Avatars) 
    // are stored strictly in the 'events' folder on the server.
    private serverEventsFolder = `${environment.apiBaseUrl2}/events/`;

    getEvents(params: any = {}): Observable<PaginatedEventResponse> {
        let httpParams = new HttpParams();

        if (params.PageSize) httpParams = httpParams.set('PageSize', params.PageSize.toString());
        if (params.PageNumber) httpParams = httpParams.set('PageNumber', params.PageNumber.toString());
        if (params.SearchTerm) httpParams = httpParams.set('SearchTerm', params.SearchTerm);
        if (params.Category) httpParams = httpParams.set('Category', params.Category.toString());
        if (params.Status !== undefined && params.Status !== null) httpParams = httpParams.set('Status', params.Status.toString());
        if (params.FromDate) httpParams = httpParams.set('FromDate', params.FromDate);
        if (params.ToDate) httpParams = httpParams.set('ToDate', params.ToDate);
        if (params.LocationId) httpParams = httpParams.set('LocationId', params.LocationId.toString());

        return this.http.get<any>(this.apiUrl, { params: httpParams }).pipe(
            map(res => {
                const rawEvents = res.data || [];
                const events = rawEvents.map((event: any) => {
                    return {
                        ...event,
                        // Strictly resolve images from the /events/ folder on the server
                        imageUrl: event.imageUrl ? `${this.serverEventsFolder}${event.imageUrl}` : null,

                        primaryOrganizer: event.primaryOrganizer ? {
                            ...event.primaryOrganizer,
                            // Resolve organizer image from the same /events/ folder as requested
                            imageUrl: event.primaryOrganizer.imageUrl ? `${this.serverEventsFolder}${event.primaryOrganizer.imageUrl}` : null
                        } : null
                    };
                });

                return {
                    isSuccess: res.isSuccess,
                    data: events,
                    page: res.page || 1,
                    pageSize: res.pageSize || 20,
                    totalCount: res.totalCount || 0,
                    totalPages: res.totalPages || 1,
                    error: res.error
                };
            }),
            catchError(err => {
                console.error('API Error:', err);
                return throwError(() => err);
            })
        );
    }
}
