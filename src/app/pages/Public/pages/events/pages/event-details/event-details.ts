import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { EventDetailsService } from '../../service/event-details.service';
import { EventDetail } from '../../models/event-details.model';
import { Title } from '@angular/platform-browser';

@Component({
    selector: 'app-event-details',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './event-details.html',
    styleUrls: ['./event-details.scss']
})
export class EventDetailsComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private eventService = inject(EventDetailsService);
    private titleService = inject(Title);

    event: EventDetail | null = null;
    isLoading = true;

    // Helper for category names
    categoryMap: { [key: number]: string } = {
        1: 'Music', 2: 'Theater', 3: 'Sports', 4: 'Food & Drink',
        5: 'Networking', 6: 'Community', 7: 'Outdoor', 8: 'Dance'
    };

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.fetchEventDetails(id);
            }
        });
    }

    fetchEventDetails(id: string) {
        this.isLoading = true;
        this.eventService.getEventDetails(id).subscribe({
            next: (data) => {
                this.event = data;
                this.isLoading = false;
                if (this.event) {
                    this.titleService.setTitle(`${this.event.title} | NYC360`);
                }
            },
            error: (err) => {
                this.isLoading = false;
            }
        });
    }

    getMinPrice(): number {
        if (!this.event?.tiers || this.event.tiers.length === 0) return 0;
        const prices = this.event.tiers.map(t => t.price || 0);
        return Math.min(...prices);
    }

    getCategoryName(catId: number): string {
        return this.categoryMap[catId] || 'Event';
    }

    getOrganizer() {
        return this.event?.staff?.[0] || null;
    }
}
