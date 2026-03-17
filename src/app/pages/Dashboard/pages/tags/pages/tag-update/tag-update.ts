import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';

// Services & Models
import { TagRequest, TagModel } from '../../models/tags.model';
import { CATEGORY_THEMES, CategoryEnum } from '../../../../../Public/Widgets/feeds/models/categories';
import { TagsService } from '../../service/tags-dashboard.service';
import { ToastService } from '../../../../../../shared/services/toast.service';

@Component({
  selector: 'app-tag-update',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tag-update.html',
  styleUrls: ['./tag-update.scss']
})
export class TagUpdateComponent implements OnInit {
  private tagsService = inject(TagsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);

  // Data
  tagId: string | null = null;
  categories = Object.entries(CATEGORY_THEMES).map(([key, value]) => ({
    id: Number(key),
    ...value
  }));
  isLoading = true;
  isSubmitting = false;
  formSubmitted = false;

  // Form Fields
  tagName: string = '';
  selectedDivision: number | null = null;
  selectedType: number = 3;
  parentTagId: number = 0;

  // Search Logic for Parent
  parentSearchTerm$ = new Subject<string>();
  parentSearchResults: TagModel[] = [];
  selectedParentName: string = 'NONE (TOP LEVEL)';
  parentSearchQuery: string = '';

  ngOnInit(): void {
    this.tagId = this.route.snapshot.paramMap.get('id');
    if (this.tagId) {
      this.fetchInitialData();
    } else {
      this.toastService.error('Invalid Tag ID');
      this.router.navigate(['/admin/tags']);
    }

    // search parent
    this.parentSearchTerm$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => term.length > 0 ? this.tagsService.searchTags(term) : of({ isSuccess: true, data: [] }))
    ).subscribe({
      next: (res: any) => {
        this.parentSearchResults = res.data || [];
        this.cdr.detectChanges();
      }
    });
  }

  fetchInitialData(): void {
    this.isLoading = true;
    if (!this.tagId) return;

    this.tagsService.getTagById(this.tagId).subscribe({
      next: (res: any) => {
        // Robust mapping for both camelCase and PascalCase
        const tag = res.data || res.Data || res;

        if (tag) {
          // Map properties safely
          this.tagName = tag.name || tag.Name || '';
          this.selectedDivision = tag.division ?? tag.Division ?? null;
          this.selectedType = tag.type ?? tag.Type ?? 3;

          // Map parent info
          const parent = tag.parent || tag.Parent;
          this.parentTagId = tag.parentTagId ?? tag.ParentTagId ?? 0;

          if (parent) {
            if (typeof parent === 'object') {
              this.selectedParentName = (parent.name || parent.Name || 'UNKNOWN');
              // Use ID from parent object if available
              this.parentTagId = parent.id || parent.Id || this.parentTagId;
            } else if (typeof parent === 'string') {
              this.selectedParentName = parent.toUpperCase();
            } else {
              this.selectedParentName = String(parent).toUpperCase();
            }
          } else {
            this.selectedParentName = 'NONE (TOP LEVEL)';
          }
          this.parentSearchQuery = this.selectedParentName;
        } else {
          console.error('Tag load error - no data found in response:', res);
          this.toastService.error('Tag details not found');
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Network error fetching tag:', err);
        this.toastService.error('Failed to communicate with server');
        this.isLoading = false;
        this.cdr.detectChanges();
        this.router.navigate(['/admin/tags']);
      }
    });
  }

  onSearchParent(event: any) {
    this.parentSearchTerm$.next(event.target.value);
  }

  selectParent(tag: any) {
    if (tag === 0) {
      this.parentTagId = 0;
      this.selectedParentName = 'NONE (TOP LEVEL)';
    } else {
      this.parentTagId = tag.id;
      this.selectedParentName = tag.name.toUpperCase();
    }
    this.parentSearchQuery = this.selectedParentName;
    this.parentSearchResults = [];
  }

  onSubmit(event: Event) {
    event.preventDefault();
    this.formSubmitted = true;

    if (!this.tagName.trim() || this.selectedDivision === null || !this.tagId) return;

    this.isSubmitting = true;

    const payload: TagRequest = {
      Name: this.tagName.trim(),
      Type: Number(this.selectedType),
      Division: Number(this.selectedDivision),
      ParentTagId: Number(this.parentTagId)
    };

    this.tagsService.updateTag(this.tagId, payload).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.toastService.success('Tag updated successfully');
          this.router.navigate(['/admin/tags']);
        } else {
          this.toastService.error('Update returned failure status');
        }
        this.isSubmitting = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.toastService.error(err.error?.Message || 'Update Failed');
        this.cdr.detectChanges();
      }
    });
  }

  onCancel() { this.router.navigate(['/admin/tags']); }
}