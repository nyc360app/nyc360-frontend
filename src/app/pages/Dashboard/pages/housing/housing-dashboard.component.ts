import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HousingDashboardService, HousingListing } from './housing-dashboard.service';
import { ImgFallbackDirective } from '../../../../shared/directives/img-fallback.directive';
import { ImageService } from '../../../../shared/services/image.service';

@Component({
    selector: 'app-housing-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ImgFallbackDirective],
    templateUrl: './housing-dashboard.component.html',
    styleUrls: ['./housing-dashboard.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HousingDashboardComponent implements OnInit {
    private service = inject(HousingDashboardService);
    private cdr = inject(ChangeDetectorRef);
    public imageService = inject(ImageService);

    listings: HousingListing[] = [];
    isLoading = false;

    // Filters from API spec
    filters = {
        pageNumber: 1,
        pageSize: 10,
        search: '',
        isPublished: 'null' // 'null' string to distinguish from boolean true/false in select
    };

    pagination = {
        totalCount: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
    };

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading = true;
        this.cdr.markForCheck();

        // Convert 'null' string to actual null or boolean
        let publishedStatus: boolean | undefined = undefined;
        if (this.filters.isPublished === 'true') publishedStatus = true;
        if (this.filters.isPublished === 'false') publishedStatus = false;

        this.service.getList(
            this.filters.pageNumber,
            this.filters.pageSize,
            publishedStatus,
            this.filters.search
        ).subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    this.listings = res.data;
                    this.pagination.totalCount = res.totalCount;
                    this.pagination.totalPages = res.totalPages;
                    this.pagination.hasNext = this.filters.pageNumber < res.totalPages;
                    this.pagination.hasPrev = this.filters.pageNumber > 1;
                }
                this.isLoading = false;
                this.cdr.markForCheck();
            },
            error: (err) => {
                console.error('Error loading housing data', err);
                this.isLoading = false;
                this.cdr.markForCheck();
            }
        });
    }

    onSearch() {
        this.filters.pageNumber = 1; // Reset to page 1
        this.loadData();
    }

    onFilterChange() {
        this.filters.pageNumber = 1;
        this.loadData();
    }

    changePage(newPage: number) {
        if (newPage >= 1 && newPage <= this.pagination.totalPages) {
            this.filters.pageNumber = newPage;
            this.loadData();
        }
    }

    togglePublish(listing: any) {
        // Optimistic update
        const oldStatus = listing.isPublished;
        listing.isPublished = !oldStatus;
        this.cdr.markForCheck();

        this.service.publish(listing.id, listing.isPublished).subscribe({
            next: (res) => {
                if (!res.isSuccess) {
                    // Revert if API failed
                    listing.isPublished = oldStatus;
                    this.cdr.markForCheck();
                }
            },
            error: () => {
                listing.isPublished = oldStatus;
                this.cdr.markForCheck();
            }
        });
    }

    toggleExpand(listing: HousingListing) {
        listing.isExpanded = !listing.isExpanded;
    }
}
