import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FlagsService } from '../services/flags';
import { FlaggedPost, FlagReasonLabel, FlagStatus, ReviewFlagRequest } from '../models/flags';

@Component({
  selector: 'app-flags-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './flags-list.html',
  styleUrls: ['./flags-list.scss'],
  // 1. تفعيل OnPush عشان الأداء يبقى أسرع بكتير ويقلل استهلاك الرامات
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlagsListComponent implements OnInit {
  
  private flagsService = inject(FlagsService);
  private cdr = inject(ChangeDetectorRef); // 2. حقن الـ ChangeDetectorRef

  flags: FlaggedPost[] = [];
  isLoading = true;
  errorMessage = '';
  
  currentPage = 1;
  pageSize = 10;
  totalCount = 0;

  // Modal State
  isModalOpen = false;
  selectedFlag: FlaggedPost | null = null;
  reviewAction: number = FlagStatus.ActionTaken;
  adminNote = '';
  isSubmitting = false;

  FlagStatus = FlagStatus;
  FlagReasonLabel = FlagReasonLabel;

  ngOnInit() {
    this.loadFlags();
  }

  loadFlags() {
    this.isLoading = true;
    // this.cdr.markForCheck(); // إعلام الأنجولار بالتحديث

    this.flagsService.getPendingFlags(this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.isSuccess) {
          this.flags = res.data;
          this.totalCount = res.totalCount;
        }
        this.cdr.markForCheck(); // 3. تحديث الواجهة يدوياً بعد وصول الداتا
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load data.';
        this.cdr.markForCheck();
      }
    });
  }

  // 4. دالة TrackBy (مهمة جداً للسرعة في الـ Loop)
  trackByFlagId(index: number, item: FlaggedPost): number {
    return item.id;
  }

  openReviewModal(flag: FlaggedPost) {
    this.selectedFlag = flag;
    this.reviewAction = FlagStatus.ActionTaken;
    this.adminNote = '';
    this.isModalOpen = true;
    this.cdr.markForCheck(); // تحديث المودال
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedFlag = null;
    this.cdr.markForCheck();
  }

  submitReview() {
    if (!this.selectedFlag) return;
    if (!this.adminNote.trim()) return alert('Note is required.');

    this.isSubmitting = true;
    this.cdr.markForCheck(); // تحديث زرار التحميل
    
    const payload: ReviewFlagRequest = {
      newStatus: Number(this.reviewAction),
      adminNote: this.adminNote
    };

    // Optimistic Update (احذفها من الشاشة فوراً قبل ما السيرفر يرد عشان اليوزر يحس بالسرعة)
    const processedFlagId = this.selectedFlag.id;
    this.flags = this.flags.filter(f => f.id !== processedFlagId);
    this.closeModal();
    
    this.flagsService.reviewFlag(processedFlagId, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        if (this.flags.length === 0 && this.totalCount > 0) this.loadFlags();
      },
      error: (err) => {
        // لو حصل خطأ رجعها تاني (Rollback)
        this.isSubmitting = false;
        alert('Failed to submit review.');
        this.loadFlags(); // Reload to be safe
      }
    });
  }

  getReasonName(id: number): string {
    return FlagReasonLabel[id] || 'Unknown';
  }
}