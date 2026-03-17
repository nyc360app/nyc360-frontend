import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RssService } from '../../services/rss';
import { RssSource } from '../../models/rss';
import { CATEGORY_THEMES, CategoryEnum } from '../../../../../Public/Widgets/feeds/models/categories';
import { ToastService } from '../../../../../../shared/services/toast.service';

@Component({
  selector: 'app-rss-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './rss-form.html',
  styleUrls: ['./rss-form.scss']
})
export class RssFormComponent implements OnInit {

  private fb = inject(FormBuilder);
  private rssService = inject(RssService);
  private router = inject(Router);
  private location = inject(Location);
  private toast = inject(ToastService);

  form!: FormGroup;
  isEditMode = false;
  editId: number | null = null;

  // القائمة المشتركة
  categories = Object.entries(CATEGORY_THEMES).map(([key, value]) => ({
    id: Number(key),
    ...value
  }));

  isLoading = false;
  isTesting = false;
  feedVerified = false;
  selectedFile: File | null = null;

  ngOnInit() {
    const state = (history.state as any).data as RssSource;

    if (state && state.id) {
      this.isEditMode = true;
      this.editId = state.id;
      this.initEditForm(state);
    } else {
      this.initCreateForm();
    }
  }

  // --- Form for CREATE ---
  initCreateForm() {
    this.form = this.fb.group({
      url: ['', [Validators.required, Validators.pattern('https?://.+')]],
      category: [null, Validators.required],
      name: ['', Validators.required],
      description: [''],
      imageUrl: ['']
    });
  }

  // --- Form for EDIT ---
  initEditForm(data: RssSource) {
    this.form = this.fb.group({
      name: [data.name, Validators.required],
      rssUrl: [data.rssUrl, Validators.required],
      category: [data.category, Validators.required],
      description: [data.description],
      isActive: [data.isActive]
    });
  }

  // --- File Handling ---
  onFileSelect(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  // --- Test Logic ---
  onTest() {
    const url = this.form.get('url')?.value;
    if (!url) return;

    this.isTesting = true;
    this.feedVerified = false; // Reset verification

    this.rssService.testRssSource(url).subscribe({
      next: (res: any) => {
        this.isTesting = false;
        if (res.isSuccess || res.IsSuccess) {
          this.feedVerified = true;
          const data = res.data;

          this.form.patchValue({
            name: data.name,
            description: data.description,
            imageUrl: data.imageUrl,
            category: (data.category && data.category !== 0) ? data.category : this.form.get('category')?.value
          });
        } else {
          this.handleError({ error: res.error });
        }
      },

      error: (err: any) => {
        this.isTesting = false;
        this.handleError(err);
      }
    });
  }

  // --- Submit Logic ---
  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    if (this.isEditMode && this.editId) {
      // UPDATE Logic
      this.rssService.updateRssSource(this.editId, this.form.value, this.selectedFile || undefined)
        .subscribe({
          next: (res: any) => {
            if (res.isSuccess || res.IsSuccess) {
              this.handleSuccess('Updated');
            } else {
              this.handleError({ error: res.error });
            }
          },
          error: (err: any) => this.handleError(err)
        });
    } else {
      // CREATE Logic
      const payload = {
        url: this.form.value.url,
        category: Number(this.form.value.category),
        name: this.form.value.name,
        description: this.form.value.description,
        imageUrl: this.form.value.imageUrl,
        image: this.selectedFile || undefined
      };

      this.rssService.createRssSource(payload)
        .subscribe({
          next: (res: any) => {
            if (res.isSuccess || res.IsSuccess) {
              this.handleSuccess('Created');
            } else {
              const errorObj = res.error || res.Error;
              this.handleError({ error: errorObj });
            }
          },
          error: (err: any) => this.handleError(err)
        });
    }
  }

  handleSuccess(action: string) {
    this.toast.success(`RSS Feed ${action} Successfully!`);
    this.isLoading = false;
    this.router.navigate(['/admin/rss']);
  }

  // 🔥 تحسين هندلة الخطأ لعرض رسالة الباك إند
  handleError(err: any) {
    this.isLoading = false;
    console.error('API Error:', err);

    let msg = 'Operation failed. Please try again.';

    // Try to extract message from backend error
    const backendError = err.error || err.Error;

    if (backendError) {
      if (backendError.message) msg = backendError.message;
      else if (backendError.Message) msg = backendError.Message;
    } else if (err.message) {
      msg = err.message;
    }

    this.toast.error(msg);
  }

  goBack() {
    this.location.back();
  }
}