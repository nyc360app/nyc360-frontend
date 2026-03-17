import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { NYCEvent } from '../models/event';

@Injectable({
    providedIn: 'root'
})
export class EventService {
    private fakeEvents: NYCEvent[] = [
        {
            id: 1,
            title: 'The Tribeca Film Festival 2026',
            description: 'Experience exclusive screenings, talks, and performances across Lower Manhattan creating creators, artists, and audiences from around the world for . Don\'t miss the biggest storytelling event of the year.',
            date: 'JUNE 5 - JUNE 21',
            location: 'Lower Manhattan',
            imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
            category: 'Festival',
            isPopular: true
        },
        {
            id: 2,
            title: 'Harlem Late Night Jazz',
            description: 'A magical night of jazz in the heart of Harlem.',
            date: 'FRI, OCT 24  8:00 PM - 1:00 AM',
            location: 'Bill\'s Place - Harlem',
            price: '$37.00',
            priceValue: 37,
            imageUrl: 'https://images.unsplash.com/photo-1511192303578-4a7bb080ba22?auto=format&fit=crop&w=600&q=80',
            category: 'MUSIC',
            isPopular: true
        },
        {
            id: 3,
            title: 'Symphony in the park',
            description: 'Outdoor classical music experience.',
            date: 'FRI, OCT 24  5:00 PM - 7:00 PM',
            location: 'Central Park - Manhattan',
            price: 'For Free',
            priceValue: 0,
            imageUrl: 'https://images.unsplash.com/photo-1514525253361-b83f85dfd05c?auto=format&fit=crop&w=600&q=80',
            category: 'Art',
            isPopular: true
        },
        {
            id: 4,
            title: 'Smorgasburg – Prospect Park',
            description: 'Grab a bite, explore local vendors, and enjoy the energy of Smorgasburg at Prospect Park.',
            date: 'SUN, 11 AM',
            location: 'Prospect Park - Brooklyn',
            price: 'Free',
            imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=600&q=80',
            category: 'Food',
            thisWeek: true
        },
        {
            id: 5,
            title: 'Morning Yoga in the Park',
            description: 'Peaceful yoga gathering where friends come together to stretch, breathe, and reconnect.',
            date: 'SUN, 9 AM',
            location: 'Central Park - Manhattan',
            price: 'Free',
            imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80',
            category: 'Health',
            thisWeek: true
        },
        {
            id: 6,
            title: 'A Live Theatre Experience',
            description: 'A curated theatre event bringing together creativity, emotion, and live performance.',
            date: 'SUN, 7 PM',
            location: 'Theater District',
            price: 'Paid',
            imageUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=600&q=80',
            category: 'Theatre',
            thisWeek: true
        }
    ];

    getFeaturedEvent(): Observable<NYCEvent> {
        return of(this.fakeEvents[0]);
    }

    getPopularEvents(): Observable<NYCEvent[]> {
        return of(this.fakeEvents.slice(1, 5));
    }

    getEventsThisWeek(): Observable<NYCEvent[]> {
        return of(this.fakeEvents.filter(e => e.thisWeek));
    }
}
