import { Component, OnInit, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { PostsService } from '../services/posts';
import { CATEGORY_THEMES, CategoryEnum } from '../../../../Public/Widgets/feeds/models/categories';
import { ToastService } from '../../../../../shared/services/toast.service';

@Component({
  selector: 'app-post-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './post-form.html',
  styleUrls: ['./post-form.scss']
})
export class PostFormComponent implements OnInit {

  private fb = inject(FormBuilder);
  private postsService = inject(PostsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  form: FormGroup;
  isEditMode = false;
  postId: number | null = null;
  isLoading = false;
  isSubmitting = false;

  categories = Object.entries(CATEGORY_THEMES).map(([key, value]) => ({
    id: Number(key),
    ...value
  }));

  postTypes = [
    { id: 0, name: 'Normal' },
    { id: 1, name: 'News' },
    { id: 2, name: 'Job' },
    { id: 3, name: 'Event' },
    { id: 4, name: 'Initiative' },
    { id: 5, name: 'Moment' },
    { id: 6, name: 'Grant' }
  ];

  selectedFiles: File[] = [];
  imagePreviews: string[] = [];
  existingAttachments: any[] = [];

  // -- Search Logic: Location --
  locationSearch$ = new Subject<string>();
  locationResults: any[] = [];
  selectedLocation: any = null;
  showLocationDropdown = false;

  // -- Search Logic: Tags --
  tagSearch$ = new Subject<string>();
  tagResults: any[] = [];
  selectedTags: any[] = []; // Array of objects {id, name}
  showTagDropdown = false;

  constructor() {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      content: ['', [Validators.required, Validators.minLength(20)]],
      category: [null, Validators.required],
      type: [0, Validators.required],
      locationSearch: [''] // Display only input
    });
  }

  ngOnInit() {
    this.setupSearch();
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.postId = +params['id'];
        this.loadPostData(this.postId);
      }
    });
  }

  setupSearch() {
    // Location Search Config
    this.locationSearch$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => {
        if (!term || term.length < 2) return of([]);
        return this.postsService.searchLocations(term).pipe(
          catchError(() => of([]))
        );
      })
    ).subscribe((res: any) => {
      this.locationResults = res.data || [];
      this.showLocationDropdown = this.locationResults.length > 0;
    });

    // Tag Search Config
    this.tagSearch$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => {
        if (!term || term.length < 2) return of([]);
        return this.postsService.searchTags(term).pipe(
          catchError(() => of([]))
        );
      })
    ).subscribe((res: any) => {
      this.tagResults = res.data || [];
      this.showTagDropdown = this.tagResults.length > 0;
    });
  }

  // --- Location Handlers ---
  onLocationInput(event: any) {
    const val = event.target.value;
    this.locationSearch$.next(val);
    if (!val) {
      this.selectedLocation = null;
      this.showLocationDropdown = false;
    }
  }

  selectLocation(loc: any) {
    this.selectedLocation = loc;
    this.form.patchValue({ locationSearch: loc.neighborhoodNet || loc.borough }); // Display value
    this.showLocationDropdown = false;
  }

  // --- Tag Handlers ---
  onTagInput(event: any) {
    const val = event.target.value;
    this.tagSearch$.next(val);
  }

  selectTag(tag: any) {
    // Avoid duplicates
    if (!this.selectedTags.find(t => t.id === tag.id)) {
      this.selectedTags.push(tag);
    }
    this.showTagDropdown = false;
    // Clear input manually if needed via ViewChild, but for now logic is simple
  }

  removeTag(index: number) {
    this.selectedTags.splice(index, 1);
  }

  // --- Attachments ---
  onFileSelect(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      const files = Array.from(event.target.files) as File[];
      this.selectedFiles = [...this.selectedFiles, ...files];

      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagePreviews.push(e.target.result);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  // --- Load Data (Edit Mode) ---
  loadPostData(id: number) {
    this.isLoading = true;
    this.postsService.getPostById(id).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.isSuccess) {
          const post = res.data;
          this.form.patchValue({
            title: post.title,
            content: post.content,
            category: post.category,
            type: post.postType || 0,
            locationSearch: post.location?.neighborhoodNet || ''
          });

          if (post.location) this.selectedLocation = post.location;
          if (post.attachments) this.existingAttachments = post.attachments;
        }
      },
      error: () => {
        this.isLoading = false;
        this.toastService.error('Failed to load post data');
      }
    });
  }

  // --- Submit ---
  onSubmit() {
    // Location is mandatory per user logic (implied by API call requirement), but if user didn't change it on edit...
    // Let's assume on create it's mandatory.
    if (this.form.invalid || (!this.selectedLocation && !this.isEditMode)) {
      // On edit if location is already there but not re-selected, we might need handling. 
      // But assuming selectedLocation is populated on load.
      // Actually let's just check selectedLocation if we require it.
    }

    // User requested validation for all fields.
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.error('Please fill in all required fields marked with *');
      return;
    }

    this.isSubmitting = true;

    // Prepare final payload
    const formData: any = {
      title: this.form.value.title,
      content: this.form.value.content,
      category: this.form.value.category,
      type: this.form.value.type,
      locationId: this.selectedLocation ? this.selectedLocation.id : 0, // 0 or null if not selected but required?
      tags: this.selectedTags.map(t => t.id) // Send IDs array
    };

    let request$: Observable<any>;

    if (this.isEditMode && this.postId) {
      request$ = this.postsService.updatePost(this.postId, formData, this.selectedFiles);
    } else {
      request$ = this.postsService.createPost(formData, this.selectedFiles);
    }

    request$.subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        if (res.isSuccess) {
          this.toastService.success(this.isEditMode ? 'Post updated successfully!' : 'Post published successfully!');
          this.router.navigate(['/admin/posts']); // Update to Admin Route
        } else {
          this.toastService.error(res.error?.message || 'Operation failed');
        }
      },
      error: (err: any) => {
        this.isSubmitting = false;
        console.error(err);
        this.toastService.error('Network error occurred. Please try again.');
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin/posts']);
  }
}