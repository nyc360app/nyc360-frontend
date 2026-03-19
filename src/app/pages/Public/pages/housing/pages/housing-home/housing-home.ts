import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HousingViewService } from '../../service/housing-view.service';
import { ImageService } from '../../../../../../shared/services/image.service';
import { ImgFallbackDirective } from '../../../../../../shared/directives/img-fallback.directive';
import { CategoryContextService } from '../../../../../../shared/services/category-context.service';
import { HousingDepartmentHeroComponent } from '../../../../Widgets/housing-department-hero/housing-department-hero.component';

@Component({
    selector: 'app-housing-home',
    standalone: true,
    imports: [CommonModule, RouterModule, ImgFallbackDirective, HousingDepartmentHeroComponent],
    templateUrl: './housing-home.html',
    styleUrls: ['./housing-home.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HousingHomeComponent implements OnInit {
    private housingService = inject(HousingViewService);
    private cdr = inject(ChangeDetectorRef);
    protected imageService = inject(ImageService);
    private categoryContext = inject(CategoryContextService);

    // --- Data ---
    heroPost: any = null;
    homesForSale: any[] = [];
    homesForRent: any[] = [];
    textOnlyListings: any[] = [];
    rssPosts: any[] = [];
    discussionPosts: any[] = [];
    allPosts: any[] = [];
    isLoading = true;

    ngOnInit(): void {
        this.categoryContext.setCategory(4); // 4 = Housing
        this.loadData();
    }

    loadData(): void {
        this.isLoading = true;
        this.housingService.getHousingHome().subscribe({
            next: (res: any) => {
                try {
                    if (res.isSuccess && res.data) {
                        const data = res.data;

                        // Helper: Strict Media Check
                        const hasMedia = (item: any) => !!(item && item.mediaUrl);

                        // 1. Process Everything
                        const processedSale = (data.forSale || []).map((p: any) => this.processHousingItem(p, 'sale'));
                        const processedRent = (data.forRenting || []).map((p: any) => this.processHousingItem(p, 'rent'));
                        const processedAll = (data.all || []).map((p: any) => this.processHousingItem(p, 'post'));
                        const processedRss = (data.rss || []).map((p: any) => this.processHousingItem(p, 'rss'));
                        this.discussionPosts = (data.discussions || []).map((p: any) => this.processHousingItem(p, 'discussion'));

                        // 2. Distribute to Buckets (Only items WITH media for grid sections)
                        this.homesForSale = processedSale.filter(hasMedia);
                        this.homesForRent = processedRent.filter(hasMedia);
                        this.rssPosts = processedRss.filter(hasMedia);
                        this.allPosts = processedAll.filter(hasMedia);

                        // 3. Collect Text-Only Items (Items that failed media check from ALL sources)
                        this.textOnlyListings = [
                            ...processedSale.filter((p: any) => !hasMedia(p)),
                            ...processedRent.filter((p: any) => !hasMedia(p)),
                            ...processedAll.filter((p: any) => !hasMedia(p)),
                            ...processedRss.filter((p: any) => !hasMedia(p))
                        ];

                        // Deduplicate by ID just in case
                        const uniqueMap = new Map();
                        this.textOnlyListings.forEach(item => uniqueMap.set(item.id, item));
                        this.textOnlyListings = Array.from(uniqueMap.values());

                        // 4. Hero Logic
                        if (data.hero) {
                            this.heroPost = this.processHousingItem(data.hero, 'hero');
                            if (!hasMedia(this.heroPost)) {
                                this.textOnlyListings.unshift(this.heroPost);
                                this.heroPost = null;
                            }
                        } else if (this.homesForSale.length > 0) {
                            this.heroPost = this.homesForSale[0];
                        } else if (this.homesForRent.length > 0) {
                            this.heroPost = this.homesForRent[0];
                        }
                    }
                } catch (error) {
                    console.error('Error processing housing data:', error);
                } finally {
                    this.isLoading = false;
                    this.cdr.markForCheck();
                }
            },
            error: (err) => {
                console.error('Error fetching housing home:', err);
                this.isLoading = false;
                this.cdr.markForCheck();
            }
        });
    }

    private stripHtml(html: string | null | undefined): string {
        if (!html) return '';
        try {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
        } catch {
            return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
        }
    }

    private processHousingItem(item: any, type: string): any {
        if (!item) return null;

        // 1. Resolve Title
        const title = item.title || item.Title ||
            (item.numberOfRooms !== undefined ? `${item.numberOfRooms} Bed ${item.numberOfBathrooms} Bath Property` : 'NYC Property');

        // 2. Resolve Description
        let description = item.content || item.description || item.Description || '';
        let displayDescription = description;
        let metadata = null;

        if (description.includes('\n\n\n')) {
            const parts = description.split('\n\n\n');
            displayDescription = this.stripHtml(parts[0]);
            try {
                metadata = JSON.parse(parts[parts.length - 1]);
            } catch (e) { }
        } else {
            displayDescription = this.stripHtml(description);
        }

        // 3. Resolve Media
        let mediaUrl = null;
        const rawUrl = item.imageUrl || item.ImageUrl || (item.attachments && item.attachments.length > 0 ? (item.attachments[0].url || item.attachments[0]) : null);

        if (rawUrl) {
            mediaUrl = this.imageService.resolveImageUrl(rawUrl, 'housing');
        }

        // 4. Merge Data
        return {
            ...item,
            title,
            displayDescription,
            metadata: metadata || item.metadata,
            mediaUrl: mediaUrl,
            startingPrice: item.startingPrice || item.StartingPrice || item.Price || (metadata ? metadata.Price : 0),
            numberOfRooms: item.numberOfRooms || item.NumberOfRooms || (metadata ? metadata.Rooms : 0),
            numberOfBathrooms: item.numberOfBathrooms || item.NumberOfBathrooms || (metadata ? metadata.Bathrooms : 0),
            size: item.size || item.Size || (metadata ? metadata.SizeSqFt : 0),
            routingPath: (item.startingPrice || item.numberOfRooms || item.location) ? '/public/housing/details' : '/public/posts/details'
        };
    }

    // --- Helpers ---
    getPostMetadata(content: string): any {
        try {
            const parts = content.split('\n\n\n');
            if (parts.length > 1) {
                return JSON.parse(parts[parts.length - 1]);
            }
        } catch (e) { }
        return null;
    }

    formatPrice(price: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(price || 0);
    }

    isVideo(url: string): boolean {
        if (!url) return false;
        const lower = url.toLowerCase();
        return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.ogg') || lower.endsWith('.mov');
    }
}
