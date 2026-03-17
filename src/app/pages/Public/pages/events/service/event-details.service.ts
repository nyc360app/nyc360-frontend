import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { EventDetail } from '../models/event-details.model';

@Injectable({
    providedIn: 'root'
})
export class EventDetailsService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiBaseUrl}/events`;
    // Image path logic from events-list service
    private serverEventsFolder = `${environment.apiBaseUrl2}/events/`;

    getEventDetails(id: string | number): Observable<EventDetail | null> {
        const url = `${this.baseUrl}/${id}`;
        return this.http.get<any>(url).pipe(
            map(res => {
                if (!res.isSuccess || !res.data) return null;
                const event = res.data;

                // Map images to full URLs
                if (event.attachments && event.attachments.length > 0) {
                    event.attachments = event.attachments.map((img: string) =>
                        img.startsWith('http') ? img : `${this.serverEventsFolder}${img}`
                    );
                }

                // Map Staff images
                if (event.staff && event.staff.length > 0) {
                    event.staff.forEach((s: any) => {
                        if (s.imageUrl && !s.imageUrl.startsWith('http')) {
                            s.imageUrl = `${this.serverEventsFolder}${s.imageUrl}`;
                        }
                    });
                }

                return event as EventDetail;
            }),
            catchError(err => {
                console.error('Error fetching event details:', err);
                return of(null);
            })
        );
    }
}
