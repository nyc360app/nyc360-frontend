import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EventsListService } from '../../service/events-list.service';
import { EventListItem, EventCategory, EventStatus } from '../../models/events-list.model';
import { LocationDashboardService } from '../../../../../Dashboard/pages/locations/service/location-dashboard.service';
import { LocationModel } from '../../../../../Dashboard/pages/locations/models/location.model';

@Component({
    selector: 'app-events-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './events-list.html',
    styleUrls: ['./events-list.scss']
})
export class EventsListComponent implements OnInit {
    private eventsService = inject(EventsListService);
    private locationService = inject(LocationDashboardService);
    private router = inject(Router);

    events: EventListItem[] = [];
    isLoading = true;

    // Filters
    searchTerm = '';
    selectedCategory: number | null = null;
    selectedLocation: number | null = null;
    selectedStatus: number | null = null;
    fromDate: string = '';
    toDate: string = '';

    // Pagination
    pageNumber = 1;
    pageSize = 12;
    totalCount = 0;
    totalPages = 1;

    // Lookups
    locations: LocationModel[] = [];

    categories = [
        { id: null, name: 'All', icon: 'bi-grid' },
        { id: EventCategory.Music, name: 'Music', icon: 'bi-music-note-beamed' },
        { id: EventCategory.Theater, name: 'Theater', icon: 'bi-theater-masks' },
        { id: EventCategory.Sports, name: 'Sports', icon: 'bi-trophy' },
        { id: EventCategory.FoodAndDrink, name: 'Food & Drink', icon: 'bi-cup-hot' },
        { id: EventCategory.Networking, name: 'Networking', icon: 'bi-people' },
        { id: EventCategory.Community, name: 'Community', icon: 'bi-globe' },
        { id: EventCategory.Outdoor, name: 'Outdoor', icon: 'bi-tree' },
        { id: EventCategory.Dance, name: 'Dance', icon: 'bi-activity' }
    ];

    statuses = [
        { id: 0, name: 'Draft' },
        { id: 1, name: 'Published' },
        { id: 2, name: 'Cancelled' },
        { id: 3, name: 'Completed' },
        { id: 4, name: 'Archived' },
        { id: 5, name: 'Hidden' }
    ];

    ngOnInit() {
        this.fetchLocations();
        this.fetchEvents();
    }

    fetchLocations() {
        this.locationService.getLocations(1, 100).subscribe({
            next: (res: any) => {
                if (res.isSuccess) {
                    this.locations = res.data;
                }
            }
        });
    }

    fetchEvents() {
        this.isLoading = true;
        const params = {
            PageSize: this.pageSize,
            PageNumber: this.pageNumber,
            SearchTerm: this.searchTerm,
            Category: this.selectedCategory,
            LocationId: this.selectedLocation,
            Status: this.selectedStatus,
            FromDate: this.fromDate,
            ToDate: this.toDate
        };

        this.eventsService.getEvents(params).subscribe({
            next: (res) => {
                this.events = res.data || [];
                this.totalCount = res.totalCount;
                this.totalPages = res.totalPages;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error fetching events:', err);
                this.isLoading = false;
                this.events = [];
            }
        });
    }

    onSearch() {
        this.pageNumber = 1;
        this.fetchEvents();
    }

    onFilterChange() {
        this.pageNumber = 1;
        this.fetchEvents();
    }

    selectCategory(catId: number | null) {
        this.selectedCategory = catId;
        this.pageNumber = 1;
        this.fetchEvents();
    }

    changePage(newPage: number) {
        if (newPage >= 1 && newPage <= this.totalPages) {
            this.pageNumber = newPage;
            this.fetchEvents();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    getCategoryIcon(catId: number): string {
        const cat = this.categories.find(c => c.id === catId);
        return cat ? cat.icon : 'bi-calendar-event';
    }

    getCategoryName(catId: number): string {
        const cat = this.categories.find(c => c.id === catId);
        return cat ? cat.name : 'Other';
    }

    getPriceDisplay(event: EventListItem): string {
        if (event.priceStart === null || event.priceEnd === null) return 'Price TBA';
        if (event.priceStart === 0 && event.priceEnd === 0) return 'FREE';
        if (event.priceStart === event.priceEnd) return `$${event.priceStart}`;
        return `$${event.priceStart} - $${event.priceEnd}`;
    }
}
