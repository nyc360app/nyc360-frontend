import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HousingAgentService } from '../../../../service/housing-agent.service';
import { ImageService } from '../../../../../../../../shared/services/image.service';
import { ImgFallbackDirective } from '../../../../../../../../shared/directives/img-fallback.directive';

@Component({
    selector: 'app-agent-listings',
    standalone: true,
    imports: [CommonModule, RouterModule, ImgFallbackDirective],
    templateUrl: './agent-listings.component.html',
    styleUrls: ['./agent-listings.component.scss']
})
export class AgentListingsComponent implements OnInit {
    private housingService = inject(HousingAgentService);
    public imageService = inject(ImageService);

    listings: any[] = [];
    isLoading = true;
    currentPage = 1;
    pageSize = 10;
    totalCount = 0;
    totalPages = 0;

    ngOnInit() {
        this.loadListings();
    }

    loadListings() {
        this.isLoading = true;
        this.housingService.getAgentListings(this.currentPage, this.pageSize).subscribe({
            next: (res: any) => {
                const isSuccess = res.IsSuccess ?? res.isSuccess;
                if (isSuccess) {
                    this.listings = res.Data ?? res.data ?? [];
                    this.totalCount = res.TotalCount ?? res.totalCount ?? 0;
                    this.totalPages = res.TotalPages ?? res.totalPages ?? 0;
                }
                this.isLoading = false;
            },
            error: () => {
                this.isLoading = false;
            }
        });
    }

    formatPrice(price: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(price);
    }

    onPageChange(page: number) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadListings();
        }
    }

    isVideo(url: string | null | undefined): boolean {
        if (!url) return false;
        const lower = url.toLowerCase();
        return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.ogg') || lower.endsWith('.mov');
    }
}
