import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RssService } from '../service/rss.service';
import { CategoryEnum, CATEGORY_THEMES } from '../../../Widgets/feeds/models/categories';

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
        // Get category from query params
        this.route.queryParams.subscribe(params => {
            const categoryId = params['category'];
            if (categoryId !== undefined && categoryId !== null) {
                const catId = Number(categoryId);
                this.rssForm.patchValue({ Category: catId });

                // Get category info from CATEGORY_THEMES
                const catInfo = CATEGORY_THEMES[catId];
                if (catInfo) {
                    this.categoryInfo.set(catInfo);
                    this.categoryName.set(catInfo.label);
                }
            }
        });
    }

    onSubmit() {
        console.log('Form submitted');
        console.log('Form valid:', this.rssForm.valid);
        console.log('Form value:', this.rssForm.value);
        console.log('Form errors:', this.getFormValidationErrors());

        if (this.rssForm.invalid) {
            this.rssForm.markAllAsTouched();
            console.error('Form is invalid');
            return;
        }

        this.isSubmitting.set(true);
        this.errorMessage.set(null);
        this.successMessage.set(null);

        const formData = this.rssForm.value as any;
        formData.Category = Number(formData.Category);

        console.log('Sending data:', formData);

        this.rssService.connectRss(formData).subscribe({
            next: (res) => {
                console.log('Response:', res);
                // Check if response is successful (either IsSuccess is true OR response exists without error)
                const isSuccess = res?.IsSuccess === true || (res && !res.Error);

                if (isSuccess) {
                    this.successMessage.set('RSS Feed connected successfully!');
                    setTimeout(() => {
                        // Navigate back to the category page
                        const catInfo = this.categoryInfo();
                        if (catInfo && catInfo.route) {
                            this.router.navigate([catInfo.route]);
                        } else {
                            this.router.navigate(['/home']);
                        }
                    }, 2000);
                } else {
                    this.errorMessage.set(res?.Error?.Message || 'Failed to connect RSS feed.');
                }
                this.isSubmitting.set(false);
            },
            error: (err) => {
                console.error('Error:', err);
                // Check if it's actually a success (status 200) but Angular treats it as error
                if (err.status === 200 || err.status === 201) {
                    this.successMessage.set('RSS Feed connected successfully!');
                    setTimeout(() => {
                        const catInfo = this.categoryInfo();
                        if (catInfo && catInfo.route) {
                            this.router.navigate([catInfo.route]);
                        } else {
                            this.router.navigate(['/home']);
                        }
                    }, 2000);
                } else {
                    this.errorMessage.set('An unexpected error occurred.');
                }
                this.isSubmitting.set(false);
            }
        });
    }

    getFormValidationErrors() {
        const errors: any = {};
        Object.keys(this.rssForm.controls).forEach(key => {
            const control = this.rssForm.get(key);
            if (control && control.errors) {
                errors[key] = control.errors;
            }
        });
        return errors;
    }
}
