import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RssService } from '../service/rss.service';
import { CATEGORY_THEMES } from '../../../Widgets/feeds/models/categories';

@Component({
    selector: 'app-connect-rss',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './connect-rss.component.html',
    styleUrls: ['./connect-rss.component.scss']
})
export class ConnectRssComponent implements OnInit {
    private fb = inject(FormBuilder);
    private rssService = inject(RssService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    rssForm = this.fb.group({
        Url: ['', [Validators.required, Validators.pattern(/^(http|https):\/\/[^ "]+$/)]],
        Category: [0, [Validators.required]],
        Name: ['', [Validators.required]],
        Description: ['', [Validators.required]],
        ImageUrl: ['']
    });

    isSubmitting = signal(false);
    errorMessage = signal<string | null>(null);
    successMessage = signal<string | null>(null);

    // Category information
    categoryInfo = signal<any>(null);
    categoryName = signal<string>('');

    ngOnInit() {
        this.route.queryParamMap.subscribe(params => {
            const rawCategory = Number(params.get('category'));
            const fallbackCategory = Number(this.rssForm.get('Category')?.value ?? 0);
            const resolvedCategory = Number.isFinite(rawCategory) ? rawCategory : fallbackCategory;
            this.applyCategory(resolvedCategory);
        });
    }

    onSubmit() {
        if (this.rssForm.invalid) {
            this.rssForm.markAllAsTouched();
            return;
        }

        this.isSubmitting.set(true);
        this.errorMessage.set(null);
        this.successMessage.set(null);

        const formData = {
            ...this.rssForm.getRawValue(),
            ImageUrl: this.rssForm.get('ImageUrl')?.value?.trim() || ''
        } as any;
        formData.Category = Number(formData.Category);
        this.applyCategory(formData.Category);

        this.rssService.connectRss(formData).subscribe({
            next: (res) => {
                const isSuccess = this.isSuccessfulResponse(res);

                if (isSuccess) {
                    this.successMessage.set('RSS feed request submitted successfully!');
                    this.navigateAfterSuccess(formData.Category);
                } else {
                    this.errorMessage.set(this.getErrorMessage(res) || 'Failed to submit RSS feed request.');
                }
                this.isSubmitting.set(false);
            },
            error: (err) => {
                if (err.status === 200 || err.status === 201) {
                    this.successMessage.set('RSS feed request submitted successfully!');
                    this.navigateAfterSuccess(formData.Category);
                } else {
                    this.errorMessage.set(this.getErrorMessage(err?.error ?? err) || 'An unexpected error occurred.');
                }
                this.isSubmitting.set(false);
            }
        });
    }

    private applyCategory(categoryId: number): void {
        const info = this.getCategoryInfo(categoryId);
        const resolvedCategoryId = info ? categoryId : 0;
        const resolvedInfo = info || this.getCategoryInfo(resolvedCategoryId);

        this.rssForm.patchValue({ Category: resolvedCategoryId }, { emitEvent: false });
        this.categoryInfo.set(resolvedInfo);
        this.categoryName.set(resolvedInfo?.label || '');
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
}
