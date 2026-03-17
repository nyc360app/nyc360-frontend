import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LocationModel } from '../../models/location.model';
import { LocationDashboardService } from '../../service/location-dashboard.service';
import { ToastService } from '../../../../../../shared/services/toast.service';

@Component({
    selector: 'app-locations-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './locations-list.html',
    styleUrls: ['./locations-list.scss']
})
export class LocationsListComponent implements OnInit {
    private locationsService = inject(LocationDashboardService);
    private cdr = inject(ChangeDetectorRef);
    private toastService = inject(ToastService);
    public Math = Math;


    locations: LocationModel[] = [];

    // Filtering & Search
    searchTerm = '';

    // Pagination Metadata
    currentPage = 1;
    pageSize = 20;
    totalPages = 0;
    totalCount = 0;
    isLoading = false;

    // Stats
    stats = [
        { title: 'Total Locations', value: 0, icon: 'bi-geo-alt-fill', color: 'gold' },
        { title: 'Boroughs', value: 5, icon: 'bi-building', color: 'blue' },
        { title: 'Zip Codes', value: 0, icon: 'bi-mailbox', color: 'green' }
    ];

    ngOnInit() {
        this.loadData();
    }

    loadData(page: number = 1) {
        this.currentPage = page;
        this.isLoading = true;
        this.cdr.detectChanges();

        this.locationsService.getLocations(
            this.currentPage,
            this.pageSize,
            this.searchTerm
        ).subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    this.locations = res.data || [];
                    this.totalPages = res.totalPages;
                    this.totalCount = res.totalCount;

                    // Update Stats
                    this.stats[0].value = this.totalCount;

                    // Calculate unique zip codes from current list as a simple stat
                    const uniqueZips = new Set(this.locations.map(l => l.zipCode)).size;
                    this.stats[2].value = uniqueZips;
                }
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Network Error:', err);
                this.toastService.error('Failed to load locations data');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    onSearch() {
        this.loadData(1);
    }

    onDelete(id: number) {
        if (confirm('Are you sure you want to delete this location?')) {
            this.locationsService.deleteLocation(id).subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.toastService.success('Location deleted successfully');
                        this.loadData(this.currentPage);
                    } else {
                        this.toastService.error('Failed to delete location');
                    }
                },
                error: (err) => {
                    this.toastService.error('Error deleting location');
                }
            });
        }
    }

    copyCode(code: string) {
        navigator.clipboard.writeText(code);
        this.toastService.info('Location Code copied to clipboard');
    }

    getBoroughColor(borough: string): string {
        const b = borough.toLowerCase();
        if (b.includes('manhattan')) return '#FF7F50';
        if (b.includes('brooklyn')) return '#2E86C1';
        if (b.includes('queens')) return '#28B463';
        if (b.includes('bronx')) return '#884EA0';
        if (b.includes('staten')) return '#D35400';
        return '#D4AF37';
    }
}
