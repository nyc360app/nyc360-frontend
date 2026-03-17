import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FlagsService } from '../posts/services/flags';
import { FlaggedPost, FlagReasonLabel, FlagStatus, ReviewFlagRequest } from '../posts/models/flags';

@Component({
  selector: 'app-flags-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './flags-list.html',
  styleUrls: ['./flags-list.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlagsListComponent implements OnInit {

  private flagsService = inject(FlagsService);
  private cdr = inject(ChangeDetectorRef);

  flags: FlaggedPost[] = [];
  isLoading = true;
  errorMessage = '';

  currentPage = 1;
  pageSize = 50; // Get more for the dashboard feel
  totalCount = 0;

  // Dashboard Stats
  stats = {
    pending: 0,
    severityHigh: 0,
    resolvedToday: 0
  };

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
    this.flagsService.getPendingFlags(this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.isSuccess) {
          this.flags = res.data;
          this.totalCount = res.totalCount;
          this.calculateStats();
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load data.';
        this.cdr.markForCheck();
      }
    });
  }

  calculateStats() {
    // Fake stats for now based on loaded data, in real app this comes from API
    this.stats.pending = this.totalCount;
    this.stats.severityHigh = this.flags.filter(f => f.reason === 1 || f.reason === 2).length; // Hate/Harassment
    this.stats.resolvedToday = Math.floor(Math.random() * 10); // Mock
  }

  trackByFlagId(index: number, item: FlaggedPost): number {
    return item.id;
  }

  openReviewModal(flag: FlaggedPost) {
    this.selectedFlag = flag;
    this.reviewAction = FlagStatus.ActionTaken;
    this.adminNote = '';
    this.isModalOpen = true;
    this.cdr.markForCheck();
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
    this.cdr.markForCheck();

    const payload: ReviewFlagRequest = {
      newStatus: Number(this.reviewAction),
      adminNote: this.adminNote
    };

    const processedFlagId = this.selectedFlag.id;
    this.flags = this.flags.filter(f => f.id !== processedFlagId);
    this.calculateStats(); // Update stats locally
    this.closeModal();

    this.flagsService.reviewFlag(processedFlagId, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        if (this.flags.length === 0 && this.totalCount > 0) this.loadFlags();
      },
      error: (err) => {
        this.isSubmitting = false;
        alert('Failed to submit review.');
        this.loadFlags();
      }
    });
  }

  getReasonName(id: number): string {
    return FlagReasonLabel[id] || 'Unknown';
  }

  getReasonSeverityClass(id: number): string {
    // 0: Spam, 1: HateSpeech, 2: Harassment, etc.
    if (id === 1 || id === 2 || id === 4) return 'severity-high'; // Hate, Harass, Scam
    return 'severity-medium';
  }
}