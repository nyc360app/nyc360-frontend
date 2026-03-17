import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HousingViewService } from '../../service/housing-view.service';
import { ImageService } from '../../../../../../shared/services/image.service';
import { ImgFallbackDirective } from '../../../../../../shared/directives/img-fallback.directive';

@Component({
    selector: 'app-housing-feed',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, ImgFallbackDirective],
    templateUrl: './housing-feed.html',
    styleUrls: ['./housing-feed.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HousingFeedComponent implements OnInit {
    private housingService = inject(HousingViewService);
    private route = inject(ActivatedRoute);
    private cdr = inject(ChangeDetectorRef);
    protected imageService = inject(ImageService);

    // --- State ---
    listings: any[] = [];
    isLoading = true;
    totalCount = 0;
    totalPages = 1;
    currentView: 'grid' | 'row' = 'grid';

    // --- Filters ---
    filters = {
        IsRenting: '',
        MinPrice: null,
        MaxPrice: null,
        LocationId: null,
        Search: '',
        Page: 1,
        PageSize: 20
    };

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            if (params['type']) {
                this.filters.IsRenting = params['type'] === 'rent' ? 'true' : 'false';
            }
            this.loadFeed();
        });
    }

    loadFeed(): void {
        this.isLoading = true;
        this.cdr.markForCheck();

        this.housingService.getHousingFeed(this.filters).subscribe({
            next: (res: any) => {
                if (res.isSuccess) {
                    this.listings = (res.data || []).map((item: any) => {
                        const mediaUrl = this.imageService.resolveImageUrl(item.imageUrl || (item.attachments?.[0]?.url || item.attachments?.[0]), 'housing');
                        return { ...item, mediaUrl };
                    });
                    this.totalCount = res.totalCount;
                    this.totalPages = res.totalPages;
                }
                this.isLoading = false;
                this.cdr.markForCheck();
            },
            error: (err) => {
                console.error('Error loading housing feed:', err);
                this.isLoading = false;
                this.cdr.markForCheck();
            }
        });
    }

    applyFilters(): void {
        this.filters.Page = 1;
        this.loadFeed();
    }

    resetFilters(): void {
        this.filters = {
            IsRenting: '',
            MinPrice: null,
            MaxPrice: null,
            LocationId: null,
            Search: '',
            Page: 1,
            PageSize: 20
        };
        this.loadFeed();
    }

    changePage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.filters.Page = page;
            this.loadFeed();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    setView(view: 'grid' | 'row'): void {
        this.currentView = view;
        this.cdr.markForCheck();
    }

    formatPrice(price: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(price);
    }

    isVideo(url: string): boolean {
        if (!url) return false;
        const lower = url.toLowerCase();
        return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.ogg') || lower.endsWith('.mov');
    }
}
