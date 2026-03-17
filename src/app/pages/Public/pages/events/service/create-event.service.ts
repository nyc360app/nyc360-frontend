import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CreateEventService {
    private http = inject(HttpClient);
    private createUrl = `${environment.apiBaseUrl}/events/create`;

    // PUT /api/events/{EventId}/management/tickets/edit
    private editTicketsUrl = (eventId: number) => `${environment.apiBaseUrl}/events/${eventId}/management/tickets/edit`;

    // POST /api/events/{EventId}/management/publish
    private publishUrl = (eventId: number) => `${environment.apiBaseUrl}/events/${eventId}/management/publish`;

    createEvent(formData: FormData): Observable<any> {
        return this.http.post<any>(this.createUrl, formData);
    }

    updateTickets(eventId: number, tiers: any[]): Observable<any> {
        const payload = { Tiers: tiers };
        return this.http.put<any>(this.editTicketsUrl(eventId), payload);
    }

    publishEvent(eventId: number): Observable<any> {
        // Sending empty object {} ensures Content-Type is application/json
        return this.http.post<any>(this.publishUrl(eventId), {});
    }
}
