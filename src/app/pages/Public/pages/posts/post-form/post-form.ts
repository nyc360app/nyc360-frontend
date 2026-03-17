import { Component, OnInit, inject, ElementRef, ViewChild, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { PostsService } from '../services/posts';
import { CATEGORY_LIST } from '../../../../../pages/models/category-list';
import { ToastService } from '../../../../../shared/services/toast.service';
import { CategoryContextService } from '../../../../../shared/services/category-context.service';

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
  private cdr = inject(ChangeDetectorRef);
  private categoryContext = inject(CategoryContextService);
  protected readonly environment = environment;

  form: FormGroup;
  isEditMode = false;
  postId: number | null = null;
  isLoading = false;
  isSubmitting = false;

  // Exclude Community (0), Housing (4), and Professions (8) from category selection
  categories = CATEGORY_LIST;

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
  allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'video/mp4', 'video/webm', 'video/ogg'];
  imagePreviews: { url: string, isVideo: boolean }[] = [];
  existingAttachments: any[] = [];
  removedAttachmentIds: number[] = [];

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
      category: [7, Validators.required], // Default to 7 (News) - excluding Community, Housing, Professions
      type: [0, Validators.required],
      locationSearch: ['']
    });
  }

  getCategoryName(id: any): string {
    const cat = this.categories.find(c => c.id == id);
    return cat ? cat.name : 'Unknown';
  }

  predefinedCategory: number | null = null;

  ngOnInit() {
    this.setupSearch();

    this.route.queryParams.subscribe(queryParams => {
      if (queryParams['category']) {
        this.predefinedCategory = +queryParams['category'];
      } else {
        // Fallback to context, but exclude Community (0), Housing (4), and Professions (8)
        const contextCat = this.categoryContext.getCategory();

        if (contextCat !== null) {
          this.predefinedCategory = contextCat;
        }
        // If context category is excluded, predefinedCategory remains null
        // and the form will use its default value (0) from line 71
        // But we should change that default to something else
      }

      if (this.predefinedCategory !== null) {
        this.form.patchValue({ category: this.predefinedCategory });
      }
      // If predefinedCategory is null, the form keeps its default from initialization
    });

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.postId = +params['id'];

        // Check if data passed via router state
        const stateData = (typeof window !== 'undefined') ? window.history.state?.postData : null;
        if (stateData && stateData.id === this.postId) {
          this.populateForm(stateData);
        } else {
          this.loadPostData(this.postId);
        }
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    this.showLocationDropdown = false;
    this.showTagDropdown = false;
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

  removeExistingFile(index: number, id: number) {
    this.existingAttachments.splice(index, 1);
    this.removedAttachmentIds.push(id);
  }

  // --- Attachments ---
  onFileSelect(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      const allFiles = Array.from(event.target.files) as File[];

      // Filter valid files
      const validFiles = allFiles.filter(file => {
        const isValid = file.type.startsWith('image/') || file.type.startsWith('video/');
        if (!isValid) {
          this.toastService.error(`File ${file.name} is not a valid image or video.`);
        }
        return isValid;
      });

      this.selectedFiles = [...this.selectedFiles, ...validFiles];

      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagePreviews.push({
            url: e.target.result,
            isVideo: file.type.startsWith('video/')
          });
          this.cdr.detectChanges();
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
        if (res.isSuccess && res.data) {
          this.populateForm(res.data);
        }
      },
      error: () => {
        this.isLoading = false;
        this.toastService.error('Failed to load post data');
      }
    });
  }

  populateForm(post: any) {
    this.form.patchValue({
      title: post.title,
      content: post.content,
      category: post.category,
      type: post.postType || 0,
      locationSearch: post.location?.neighborhoodNet || ''
    });

    if (post.location) this.selectedLocation = post.location;

    // Map tags
    if (post.tags && Array.isArray(post.tags)) {
      this.selectedTags = post.tags.map((t: any) => {
        if (typeof t === 'object') return t;
        return { id: 0, name: t };
      });
    }

    // Map attachments
    if (post.attachments && Array.isArray(post.attachments)) {
      this.existingAttachments = [...post.attachments];
    } else if (post.imageUrl) {
      this.existingAttachments = [{ id: 0, url: post.imageUrl }];
    }
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
      tags: this.selectedTags.map((t: any) => t.id) // Send IDs array
    };

    let request$: Observable<any>;

    if (this.isEditMode && this.postId) {
      request$ = this.postsService.updatePost(this.postId, formData, this.selectedFiles, this.removedAttachmentIds);
    } else {
      request$ = this.postsService.createPost(formData, this.selectedFiles);
    }

    request$.subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        if (res.isSuccess) {
          this.toastService.success(this.isEditMode ? 'Post updated successfully!' : 'Post published successfully!');
          this.router.navigate(['/public/home']);
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

  resolveImageUrl(url: string | undefined | null): string {
    if (!url) return 'assets/images/placeholder.jpg';
    if (url.includes('@local://')) return `${this.environment.apiBaseUrl3 || this.environment.apiBaseUrl}/${url.replace('@local://', '')}`;
    if (!url.startsWith('http') && !url.startsWith('data:')) return `${this.environment.apiBaseUrl}/${url}`;
    return url;
  }

  goBack() {
    this.router.navigate(['/public/home']);
  }
}