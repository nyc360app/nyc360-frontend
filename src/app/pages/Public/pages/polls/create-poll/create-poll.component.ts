import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { NewsDepartmentHeroComponent } from '../../../Widgets/news-department-hero/news-department-hero.component';
import { AuthService } from '../../../../Authentication/Service/auth';
import { EMPTY_NEWS_ACCESS, NewsAccess, NewsService } from '../../../../../shared/services/news.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import { GlobalLoaderService } from '../../../../../shared/components/global-loader/global-loader.service';

@Component({
  selector: 'app-create-poll',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NewsDepartmentHeroComponent],
  templateUrl: './create-poll.component.html',
  styleUrls: ['./create-poll.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatePollComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly newsService = inject(NewsService);
  private readonly toastService = inject(ToastService);
  private readonly loaderService = inject(GlobalLoaderService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly pollForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(120)]],
    question: ['', [Validators.required, Validators.minLength(16), Validators.maxLength(220)]],
    description: ['', [Validators.maxLength(1200)]],
    closesAt: [''],
    allowMultipleAnswers: [false],
    showResultsBeforeVoting: [false],
    coverImage: [null as File | null],
    options: this.fb.array([
      this.createOptionControl(''),
      this.createOptionControl('')
    ])
  });

  newsAccess: NewsAccess = EMPTY_NEWS_ACCESS;
  isSubmitting = false;
  coverPreviewUrl: string | null = null;
  coverFileName = '';

  constructor() {
    this.newsService.getNewsAccess()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (access) => {
          this.newsAccess = access;
          this.cdr.markForCheck();
        },
        error: () => {
          this.newsAccess = EMPTY_NEWS_ACCESS;
          this.cdr.markForCheck();
        }
      });
  }

  get options(): FormArray {
    return this.pollForm.get('options') as FormArray;
  }

  get canCreatePoll(): boolean {
    return this.hasStaffBypass() || this.newsAccess.canSubmitContent;
  }

  get canAddMoreOptions(): boolean {
    return this.options.length < 6;
  }

  get pollTitle(): string {
    return (this.pollForm.get('title')?.value || '').trim() || 'Your poll title will appear here';
  }

  get pollQuestion(): string {
    return (this.pollForm.get('question')?.value || '').trim() || 'Ask a focused question that readers can answer quickly.';
  }

  get pollDescription(): string {
    return (this.pollForm.get('description')?.value || '').trim() || 'Use the optional description to add context, timing, or why this poll matters.';
  }

  get hasCloseDate(): boolean {
    return !!this.pollForm.get('closesAt')?.value;
  }

  addOption(): void {
    if (!this.canAddMoreOptions) {
      return;
    }

    this.options.push(this.createOptionControl(''));
    this.cdr.markForCheck();
  }

  removeOption(index: number): void {
    if (this.options.length <= 2) {
      return;
    }

    this.options.removeAt(index);
    this.cdr.markForCheck();
  }

  onCoverSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] || null;

    this.pollForm.patchValue({ coverImage: file });
    this.coverFileName = file?.name || '';

    if (!file) {
      this.coverPreviewUrl = null;
      this.cdr.markForCheck();
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.toastService.warning('Please upload an image file for the poll cover.');
      this.pollForm.patchValue({ coverImage: null });
      this.coverFileName = '';
      this.coverPreviewUrl = null;
      this.cdr.markForCheck();
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.coverPreviewUrl = typeof reader.result === 'string' ? reader.result : null;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  clearCover(): void {
    this.pollForm.patchValue({ coverImage: null });
    this.coverPreviewUrl = null;
    this.coverFileName = '';
    this.cdr.markForCheck();
  }

  trackByIndex(index: number): number {
    return index;
  }

  submit(): void {
    if (!this.canCreatePoll) {
      this.toastService.error('Your account does not currently have News poll access.');
      return;
    }

    if (this.pollForm.invalid) {
      this.pollForm.markAllAsTouched();
      this.toastService.warning('Please complete the poll form before submitting.');
      return;
    }

    const trimmedOptions = this.options.controls
      .map((control) => String(control.value || '').trim())
      .filter(Boolean);

    if (trimmedOptions.length < 2) {
      this.toastService.warning('Please provide at least two answer options.');
      return;
    }

    this.isSubmitting = true;
    this.loaderService.show();

    const formData = new FormData();
    formData.append('Title', this.pollForm.get('title')?.value?.trim() || '');
    formData.append('Question', this.pollForm.get('question')?.value?.trim() || '');
    formData.append('Description', this.pollForm.get('description')?.value?.trim() || '');
    formData.append('AllowMultipleAnswers', String(!!this.pollForm.get('allowMultipleAnswers')?.value));
    formData.append('ShowResultsBeforeVoting', String(!!this.pollForm.get('showResultsBeforeVoting')?.value));

    const closesAt = this.pollForm.get('closesAt')?.value;
    if (closesAt) {
      formData.append('ClosesAt', closesAt);
    }

    trimmedOptions.forEach((option) => formData.append('Options', option));

    const coverImage = this.pollForm.get('coverImage')?.value;
    if (coverImage instanceof File) {
      formData.append('CoverImage', coverImage);
    }

    this.newsService.createNewsPoll(formData).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;
        this.loaderService.hide();

        if (response?.isSuccess) {
          this.toastService.success('Poll created successfully.');
          const createdPollId = Number(response?.data?.pollId ?? response?.data?.PollId ?? 0);
          if (createdPollId) {
            this.router.navigate(['/news/polls', createdPollId]);
          } else {
            this.router.navigate(['/news/dashboard']);
          }
          return;
        }

        this.toastService.error(response?.error?.message || response?.error?.Message || 'Failed to create poll.');
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.loaderService.hide();

        if (error?.status === 404) {
          this.toastService.info('Poll backend is not live yet. UI is ready; API wiring is pending.');
        } else {
          this.toastService.error(error?.error?.error?.message || error?.error?.message || 'An unexpected error occurred while creating the poll.');
        }

        this.cdr.markForCheck();
      }
    });
  }

  private createOptionControl(value: string) {
    return this.fb.control(value, [Validators.required, Validators.minLength(1), Validators.maxLength(80)]);
  }

  private hasStaffBypass(): boolean {
    return this.authService.hasRole('Admin')
      || this.authService.hasRole('SuccessAdmin')
      || this.authService.hasRole('SuperAdmin');
  }
}
