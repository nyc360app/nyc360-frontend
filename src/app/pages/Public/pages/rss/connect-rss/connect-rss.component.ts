import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CATEGORY_THEMES, CategoryEnum } from '../../../Widgets/feeds/models/categories';
import { EMPTY_NEWS_ACCESS, NewsService } from '../../../../../shared/services/news.service';
import { RssService, type ConnectRssRequest } from '../service/rss.service';
import { VerificationModalComponent } from '../../../../../shared/components/verification-modal/verification-modal';
import { AuthService } from '../../../../Authentication/Service/auth';

type DivisionTag = {
    id: number;
    label: string;
    color: string;
};

@Component({
    selector: 'app-connect-rss',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, VerificationModalComponent],
    templateUrl: './connect-rss.component.html',
    styleUrls: ['./connect-rss.component.scss']
})
export class ConnectRssComponent implements OnInit, OnDestroy {
    private fb = inject(FormBuilder);
    private rssService = inject(RssService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private newsService = inject(NewsService);
    private authService = inject(AuthService);

    readonly languageOptions = [
        'English',
        'Spanish',
        'Arabic',
        'Bengali',
        'Chinese',
        'French',
        'German',
        'Gujarati',
        'Haitian Creole',
        'Hebrew',
        'Hindi',
        'Italian',
        'Japanese',
        'Korean',
        'Polish',
        'Portuguese',
        'Punjabi',
        'Russian',
        'Tagalog',
        'Tamil',
        'Telugu',
        'Turkish',
        'Ukrainian',
        'Urdu',
        'Uzbek',
        'Vietnamese'
    ];

    readonly credibilityOptions = [
        'Major News Organization',
        'Independent Media',
        'Research Organization',
        'Government Source',
        'Blog / Independent Publisher'
    ];

    readonly divisionTags: DivisionTag[] = Object.entries(CATEGORY_THEMES)
        .map(([key, value]) => ({
            id: Number(key),
            label: String(value?.label || ''),
            color: String(value?.color || '#F97316')
        }))
        .sort((left, right) => left.id - right.id);

    readonly maxLogoFileSizeInBytes = 10 * 1024 * 1024;
    readonly acceptedLogoExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

    rssForm = this.fb.group({
        Url: ['', [Validators.required, Validators.pattern(/^(http|https):\/\/[^ "]+$/)]],
        Category: [0, [Validators.required]],
        Language: ['', [Validators.required]],
        Name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(140)]],
        SourceWebsite: ['', [Validators.required, Validators.pattern(/^(http|https):\/\/[^ "]+$/)]],
        SourceCredibility: ['', Validators.required],
        Description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(3000)]],
        AgreementAccepted: [false, Validators.requiredTrue],
        ImageUrl: ['']
    });

    isSubmitting = signal(false);
    errorMessage = signal<string | null>(null);
    successMessage = signal<string | null>(null);
    isDraggingLogo = signal(false);
    selectedLogoPreviewUrl = signal<string | null>(null);
    selectedLogoFileName = signal<string | null>(null);
    logoFileError = signal<string | null>(null);

    categoryInfo = signal<any>(null);
    categoryName = signal<string>('');
    hasNewsRssAccess = signal(false);
    showNewsRssVerificationModal = signal(false);
    newsBadgeTags = signal<any[]>([]);
    newsRssRequestOccupations = signal<any[]>([]);

    private selectedLogoFile: File | null = null;
    private selectedLogoObjectUrl: string | null = null;

    ngOnInit() {
        this.route.queryParamMap.subscribe(params => {
            const categoryParam = params.get('category');
            const feedUrlParam = String(params.get('url') || '').trim();
            const rawCategory = categoryParam !== null ? Number(categoryParam) : Number.NaN;
            const routeCategory = Number(this.route.snapshot.data['categoryId']);
            const fallbackCategory = Number.isFinite(routeCategory)
                ? routeCategory
                : Number(this.rssForm.get('Category')?.value ?? 0);
            const resolvedCategory = Number.isFinite(rawCategory) ? rawCategory : fallbackCategory;
            this.applyCategory(resolvedCategory);

            if (feedUrlParam) {
                this.rssForm.patchValue({ Url: feedUrlParam }, { emitEvent: false });
                this.onFeedUrlBlur();
            }
        });

        this.newsService.getNewsHome(12).subscribe({
            next: (res: any) => {
                const tags = res?.isSuccess && Array.isArray(res?.data?.tags) ? res.data.tags : [];
                this.newsBadgeTags.set(tags);
                this.newsRssRequestOccupations.set(this.resolveNewsRssOccupations(tags));
            },
            error: () => {
                this.newsBadgeTags.set([]);
                this.newsRssRequestOccupations.set([]);
            }
        });
    }

    ngOnDestroy(): void {
        this.revokeSelectedLogoObjectUrl();
    }

    onSubmit() {
        if (this.isNewsCategory() && !this.hasNewsRssAccess()) {
            this.errorMessage.set('You need Publisher-level News RSS access to connect a feed.');
            return;
        }

        if (this.rssForm.invalid) {
            this.rssForm.markAllAsTouched();
            return;
        }

        this.isSubmitting.set(true);
        this.errorMessage.set(null);
        this.successMessage.set(null);

        const formValue = this.rssForm.getRawValue();
        const payload: ConnectRssRequest = {
            url: String(formValue.Url || '').trim(),
            category: Number(formValue.Category),
            name: String(formValue.Name || '').trim(),
            description: String(formValue.Description || '').trim(),
            imageUrl: String(formValue.ImageUrl || '').trim(),
            language: String(formValue.Language || '').trim(),
            sourceWebsite: String(formValue.SourceWebsite || '').trim(),
            sourceCredibility: String(formValue.SourceCredibility || '').trim(),
            agreementAccepted: !!formValue.AgreementAccepted,
            divisionTag: this.categoryName(),
            logoImage: this.selectedLogoFile
        };

        this.rssService.connectRss(payload).subscribe({
            next: (res) => {
                const isSuccess = this.isSuccessfulResponse(res);

                if (isSuccess) {
                    this.successMessage.set('RSS feed request submitted successfully!');
                    this.navigateAfterSuccess(payload.category);
                } else {
                    this.errorMessage.set(this.getErrorMessage(res) || 'Failed to submit RSS feed request.');
                }

                this.isSubmitting.set(false);
            },
            error: (err) => {
                if (err.status === 200 || err.status === 201) {
                    this.successMessage.set('RSS feed request submitted successfully!');
                    this.navigateAfterSuccess(payload.category);
                } else {
                    this.errorMessage.set(this.getErrorMessage(err?.error ?? err) || 'An unexpected error occurred.');
                }

                this.isSubmitting.set(false);
            }
        });
    }

    onFeedUrlBlur(): void {
        const sourceWebsiteControl = this.rssForm.get('SourceWebsite');
        const sourceWebsiteValue = String(sourceWebsiteControl?.value || '').trim();
        const feedUrlValue = String(this.rssForm.get('Url')?.value || '').trim();
        if (sourceWebsiteValue || !feedUrlValue) return;

        try {
            const parsedUrl = new URL(feedUrlValue);
            sourceWebsiteControl?.setValue(parsedUrl.origin);
        } catch {
            // Ignore invalid URL input and let form validation handle it.
        }
    }

    onLogoSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input?.files?.[0] || null;
        this.applyLogoFile(file);
        input.value = '';
    }

    onLogoDragOver(event: DragEvent): void {
        event.preventDefault();
        this.isDraggingLogo.set(true);
    }

    onLogoDragLeave(event: DragEvent): void {
        event.preventDefault();
        this.isDraggingLogo.set(false);
    }

    onLogoDrop(event: DragEvent): void {
        event.preventDefault();
        this.isDraggingLogo.set(false);
        const file = event.dataTransfer?.files?.[0] || null;
        this.applyLogoFile(file);
    }

    removeSelectedLogo(): void {
        this.selectedLogoFile = null;
        this.selectedLogoFileName.set(null);
        this.logoFileError.set(null);
        this.revokeSelectedLogoObjectUrl();
        this.selectedLogoPreviewUrl.set(null);
    }

    selectCredibility(option: string): void {
        this.rssForm.patchValue({ SourceCredibility: option });
        this.rssForm.get('SourceCredibility')?.markAsTouched();
    }

    selectDivisionTag(tagId: number): void {
        this.applyCategory(tagId);
        this.errorMessage.set(null);
        this.successMessage.set(null);
    }

    hasControlError(controlName: string, errorName?: string): boolean {
        const control = this.rssForm.get(controlName);
        if (!control || !control.touched) return false;
        if (!errorName) return control.invalid;
        return control.hasError(errorName);
    }

    isTagActive(tagId: number): boolean {
        return Number(this.rssForm.get('Category')?.value) === tagId;
    }

    isNewsCategory(): boolean {
        return Number(this.rssForm.get('Category')?.value) === CategoryEnum.News;
    }

    isNewsCategoryLocked(): boolean {
        return this.isNewsCategory() && !this.hasNewsRssAccess();
    }

    openNewsRssVerificationRequest(): void {
        this.newsRssRequestOccupations.set(this.resolveNewsRssOccupations(this.newsBadgeTags()));
        this.showNewsRssVerificationModal.set(true);
    }

    closeNewsRssVerificationRequest(): void {
        this.showNewsRssVerificationModal.set(false);
    }

    onNewsRssVerified(): void {
        this.showNewsRssVerificationModal.set(false);
        this.authService.fetchFullUserInfo().subscribe({ error: () => undefined });
        this.resolveNewsRssAccess(CategoryEnum.News);
    }

    private applyCategory(categoryId: number): void {
        const info = this.getCategoryInfo(categoryId);
        const resolvedCategoryId = info ? categoryId : 0;
        const resolvedInfo = info || this.getCategoryInfo(resolvedCategoryId);

        this.rssForm.patchValue({ Category: resolvedCategoryId }, { emitEvent: false });
        this.categoryInfo.set(resolvedInfo);
        this.categoryName.set(resolvedInfo?.label || '');
        this.resolveNewsRssAccess(resolvedCategoryId);
    }

    private applyLogoFile(file: File | null): void {
        if (!file) return;

        const normalizedFileName = file.name.toLowerCase();
        const hasAllowedExtension = this.acceptedLogoExtensions.some((extension) =>
            normalizedFileName.endsWith(extension)
        );

        if (!hasAllowedExtension) {
            this.removeSelectedLogo();
            this.logoFileError.set('Upload a JPG, JPEG, PNG, or WEBP image.');
            return;
        }

        if (file.size > this.maxLogoFileSizeInBytes) {
            this.removeSelectedLogo();
            this.logoFileError.set('Logo image must be 10MB or less.');
            return;
        }

        this.selectedLogoFile = file;
        this.selectedLogoFileName.set(file.name);
        this.logoFileError.set(null);
        this.revokeSelectedLogoObjectUrl();
        this.selectedLogoObjectUrl = URL.createObjectURL(file);
        this.selectedLogoPreviewUrl.set(this.selectedLogoObjectUrl);
    }

    private revokeSelectedLogoObjectUrl(): void {
        if (!this.selectedLogoObjectUrl) return;
        URL.revokeObjectURL(this.selectedLogoObjectUrl);
        this.selectedLogoObjectUrl = null;
    }

    private navigateAfterSuccess(categoryId: number) {
        setTimeout(() => {
            const catInfo = this.getCategoryInfo(categoryId);
            this.router.navigate([catInfo?.route || '/public/home']);
        }, 2000);
    }

    private isSuccessfulResponse(payload: any): boolean {
        const explicitStatus = payload?.isSuccess ?? payload?.IsSuccess;
        if (typeof explicitStatus === 'boolean') {
            return explicitStatus;
        }

        return !!payload && !this.getErrorMessage(payload);
    }

    private getErrorMessage(payload: any): string | null {
        const nestedError = payload?.error?.error;
        const topLevelError = payload?.error ?? payload?.Error;

        return nestedError?.message
            || nestedError?.Message
            || topLevelError?.message
            || topLevelError?.Message
            || null;
    }

    private getCategoryInfo(categoryId: number): any {
        return Number.isFinite(categoryId) ? (CATEGORY_THEMES as any)[categoryId] : null;
    }

    private resolveNewsRssOccupations(tags: any[]): any[] {
        if (!Array.isArray(tags) || !tags.length) {
            return [];
        }

        const rssOrPublisherTags = tags.filter((tag) => this.isNewsRssTag(tag));
        if (rssOrPublisherTags.length) {
            return rssOrPublisherTags;
        }

        const nonListingTags = tags.filter((tag) => !this.isNewsListingTag(tag));
        return nonListingTags.length ? nonListingTags : tags;
    }

    private isNewsRssTag(tag: any): boolean {
        const label = String(tag?.name ?? tag?.Name ?? '').trim().toLowerCase();
        return label.includes('rss') || label.includes('publisher');
    }

    private isNewsListingTag(tag: any): boolean {
        const label = String(tag?.name ?? tag?.Name ?? '').trim().toLowerCase();
        return label.includes('organization')
            || label.includes('space')
            || label.includes('location');
    }

    private resolveNewsRssAccess(categoryId: number): void {
        if (categoryId !== CategoryEnum.News) {
            this.hasNewsRssAccess.set(true);
            return;
        }

        this.hasNewsRssAccess.set(false);

        this.newsService.getNewsAccess().subscribe({
            next: (access) => {
                const canConnect = access?.canConnectRss ?? EMPTY_NEWS_ACCESS.canConnectRss;
                this.hasNewsRssAccess.set(!!canConnect);
            },
            error: () => {
                this.hasNewsRssAccess.set(false);
            }
        });
    }
}
