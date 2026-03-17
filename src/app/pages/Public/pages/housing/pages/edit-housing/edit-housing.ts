import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { PostsService } from '../../../../pages/posts/services/posts';
import { HousingViewService } from '../../service/housing-view.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { ImageService } from '../../../../../../shared/services/image.service';
import { ImgFallbackDirective } from '../../../../../../shared/directives/img-fallback.directive';

@Component({
    selector: 'app-edit-housing',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="d-flex justify-content-center align-items-center" style="height: 100vh;">
            <div class="text-center">
                <div class="spinner-border text-gold" role="status"></div>
                <p class="mt-3">Redirecting to appropriate edit form...</p>
            </div>
        </div>
    `
})
export class EditHousingComponent implements OnInit {
    private housingService = inject(HousingViewService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private toastService = inject(ToastService);

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.loadAndRedirect(+id);
            }
        });
    }

    loadAndRedirect(id: number) {
        this.housingService.getHousingDetails(id).subscribe({
            next: (res: any) => {
                if (res.isSuccess) {
                    const data = res.data.info || res.data;
                    const path = data.isRenting ? 'renting' : 'sale';
                    this.router.navigate(['/public/housing/edit', path, id], { replaceUrl: true });
                } else {
                    this.toastService.error('Failed to load listing');
                    this.router.navigate(['/public/housing/home']);
                }
            },
            error: () => {
                this.toastService.error('Error loading listing');
                this.router.navigate(['/public/housing/home']);
            }
        });
    }
}
