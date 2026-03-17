import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EventService } from '../../service/event.service';
import { NYCEvent } from '../../models/event';

@Component({
    selector: 'app-event-home',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './event-home.html',
    styleUrls: ['./event-home.scss']
})
export class EventHomeComponent implements OnInit {
    private eventService = inject(EventService);

    featuredEvent?: NYCEvent;
    popularEvents: NYCEvent[] = [];
    thisWeekEvents: NYCEvent[] = [];

    categories = [
        { name: 'All', icon: 'bi-grid-fill', active: true },
        { name: 'Art', icon: 'bi-palette', active: false },
        { name: 'Food', icon: 'bi-egg-fried', active: false },
        { name: 'Music', icon: 'bi-music-note-beamed', active: false },
        { name: 'Sports', icon: 'bi-trophy', active: false },
        { name: 'Theatre', icon: 'bi-masks', active: false }
    ];

    ngOnInit(): void {
        this.eventService.getFeaturedEvent().subscribe(event => this.featuredEvent = event);
        this.eventService.getPopularEvents().subscribe(events => this.popularEvents = events);
        this.eventService.getEventsThisWeek().subscribe(events => this.thisWeekEvents = events);
    }
}
