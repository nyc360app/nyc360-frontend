import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { CATEGORY_THEMES, CategoryEnum } from '../../../../../Public/Widgets/feeds/models/categories';
import { TagRequest, TagModel } from '../../models/tags.model';
import { TagsService } from '../../service/tags-dashboard.service';
import { ToastService } from '../../../../../../shared/services/toast.service';

@Component({
  selector: 'app-tag-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tag-create.html',
  styleUrls: ['./tag-create.scss']
})
export class TagCreateComponent implements OnInit {
  private tagsService = inject(TagsService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);

  tagName: string = '';
  selectedDivision: number | null = null;
  selectedType: number = 3;
  parentTagId: number = 0;

  parentSearchTerm$ = new Subject<string>();
  parentSearchResults: TagModel[] = [];
  selectedParentName: string = 'NONE (TOP LEVEL)';

  categories = Object.entries(CATEGORY_THEMES).map(([key, value]) => ({
    id: Number(key),
    ...value
  }));
  isSubmitting = false;
  formSubmitted = false;

  ngOnInit() {
    this.parentSearchTerm$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => term.length > 0 ? this.tagsService.searchTags(term) : of({ isSuccess: true, data: [] }))
    ).subscribe({
      next: (res: any) => {
        this.parentSearchResults = res.data || res.Data || [];
        this.cdr.detectChanges();
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
    this.parentSearchResults = [];
  }

  onSubmit(event: Event) {
    event.preventDefault(); // ✅ منع ريلود الصفحة
    this.formSubmitted = true;

    if (!this.tagName.trim() || this.selectedDivision === null) return;

    this.isSubmitting = true;
    const payload: TagRequest = {
      Name: this.tagName.trim(),
      Type: Number(this.selectedType),
      Division: Number(this.selectedDivision),
      ParentTagId: Number(this.parentTagId)
    };

    this.tagsService.createTag(payload).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.toastService.success('Tag created successfully');
          this.router.navigate(['/admin/tags']);
        }
        this.isSubmitting = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.toastService.error(err.error?.Message || 'Failed to create tag');
        this.cdr.detectChanges();
      }
    });
  }

  onCancel() { this.router.navigate(['/admin/tags']); }
}