import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, HostListener, Input, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../Authentication/Service/auth';
import { CommunityService } from '../../pages/communities/services/community';
import { CommunityLeaderApplicationModalComponent } from '../../../../shared/components/community-leader-application-modal/community-leader-application-modal';
import { VerificationModalComponent } from '../../../../shared/components/verification-modal/verification-modal';
import { ToastService } from '../../../../shared/services/toast.service';
import { buildCommunityD01BadgeOptions, isCommunityLeaderTag } from '../../../../shared/utils/community-badge-policy';
import { CommunityLeaderApplicationPayload } from '../../pages/communities/models/community-leader-application';
import { getDepartmentExploreRoute } from '../feeds/models/categories';

@Component({
  selector: 'app-community-department-hero',
  standalone: true,
  imports: [CommonModule, RouterModule, VerificationModalComponent, CommunityLeaderApplicationModalComponent],
  templateUrl: './community-department-hero.component.html',
  styleUrls: ['./community-department-hero.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommunityDepartmentHeroComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly communityService = inject(CommunityService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  @Input() title = 'Community';
  @Input() description = 'Where New Yorkers can share ideas, discussions, and local conversations';
  @Input() searchPlaceholder = 'Search groups, topics, or neighborhoods...';
  @Input() showDefaultSearch = true;

  isActivityDropdownOpen = false;
  private activityDropdownCloseTimer: ReturnType<typeof setTimeout> | null = null;

  currentUserInfo: any | null = null;
  communityPublicBadgeTags: any[] = buildCommunityD01BadgeOptions([]);
  verificationModalOccupations: any[] = [];
  isVerificationModalOpen = false;
  isLeaderApplicationModalOpen = false;
  isSubmittingLeaderApplication = false;

  ngOnInit(): void {
    this.authService.fullUserInfo$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((info) => {
        this.currentUserInfo = info;
        this.cdr.markForCheck();
      });

    this.communityService.getCommunityHome(1, 1).subscribe({
      next: (res: any) => {
        this.communityPublicBadgeTags = buildCommunityD01BadgeOptions(res?.data?.tags || []);
        this.cdr.markForCheck();
      },
      error: () => {
        this.communityPublicBadgeTags = buildCommunityD01BadgeOptions([]);
        this.cdr.markForCheck();
      }
    });
  }

  get hasCommunityLeaderAccess(): boolean {
    if (this.authService.hasRole('SuperAdmin')) return true;

    if (this.currentUserInfo?.tags) {
      return this.currentUserInfo.tags.some((tag: any) => isCommunityLeaderTag(tag));
    }

    return false;
  }

  get leaderApplicationFullName(): string {
    const firstName = String(this.currentUserInfo?.firstName || '').trim();
    const lastName = String(this.currentUserInfo?.lastName || '').trim();
    return `${firstName} ${lastName}`.trim();
  }

  get leaderApplicationEmail(): string {
    return String(this.currentUserInfo?.email || '').trim();
  }

  get leaderApplicationPhoneNumber(): string {
    return String(this.currentUserInfo?.phoneNumber || '').trim();
  }

  onSearch(query: string): void {
    const search = query.trim();
    this.router.navigate([getDepartmentExploreRoute('community')], {
      queryParams: search ? { search } : {}
    });
  }

  openVerificationModal(preferredOccupationName: string | null = null): void {
    this.verificationModalOccupations = this.prioritizeVerificationOccupations(preferredOccupationName);
    if (!this.verificationModalOccupations.length) {
      this.toastService.error('Community verification roles are not configured on the backend yet.');
      this.cdr.markForCheck();
      return;
    }
    this.isVerificationModalOpen = true;
    this.isActivityDropdownOpen = false;
  }

  openLeaderApplicationModal(): void {
    this.isVerificationModalOpen = false;
    this.verificationModalOccupations = [];
    this.isSubmittingLeaderApplication = false;
    this.isLeaderApplicationModalOpen = true;
    this.isActivityDropdownOpen = false;
  }

  openVerificationFromDropdown(preferredOccupationName: string | null = null): void {
    const normalized = this.normalizeOccupationNameForMatch(preferredOccupationName);
    if (!normalized || normalized.includes('leader')) {
      this.openLeaderApplicationModal();
      return;
    }

    this.openVerificationModal(preferredOccupationName);
  }

  closeVerificationModal(): void {
    this.isVerificationModalOpen = false;
    this.verificationModalOccupations = [];
    this.cdr.markForCheck();
  }

  onVerified(): void {
    this.authService.fetchFullUserInfo().subscribe();
    this.closeVerificationModal();
  }

  closeLeaderApplicationModal(): void {
    this.isSubmittingLeaderApplication = false;
    this.isLeaderApplicationModalOpen = false;
    this.cdr.markForCheck();
  }

  onLeaderApplicationSubmitted(payload: CommunityLeaderApplicationPayload): void {
    if (this.isSubmittingLeaderApplication) return;

    this.isSubmittingLeaderApplication = true;
    this.cdr.markForCheck();

    this.communityService.submitCommunityLeaderApplication(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.isSubmittingLeaderApplication = false;

          if (res?.isSuccess || res?.IsSuccess) {
            const status = String(res?.data?.status || 'Pending').trim();
            this.toastService.success(`Community leader application submitted. Status: ${status}.`);
            this.closeLeaderApplicationModal();
            return;
          }

          this.toastService.error(this.getLeaderApplicationErrorMessage(res));
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          this.isSubmittingLeaderApplication = false;
          this.toastService.error(this.getLeaderApplicationErrorMessage(error));
          this.cdr.markForCheck();
        }
      });
  }

  toggleActivityDropdown(event: Event): void {
    event.stopPropagation();
    this.clearActivityDropdownCloseTimer();
    this.isActivityDropdownOpen = !this.isActivityDropdownOpen;
  }

  openActivityDropdown(): void {
    this.clearActivityDropdownCloseTimer();
    this.isActivityDropdownOpen = true;
  }

  scheduleCloseActivityDropdown(): void {
    this.clearActivityDropdownCloseTimer();
    this.activityDropdownCloseTimer = setTimeout(() => {
      this.closeActivityDropdown();
    }, 120);
  }

  closeActivityDropdown(): void {
    this.clearActivityDropdownCloseTimer();
    this.isActivityDropdownOpen = false;
    this.cdr.markForCheck();
  }

  @HostListener('document:click')
  closeDropdownHandler(): void {
    this.closeActivityDropdown();
  }

  private clearActivityDropdownCloseTimer(): void {
    if (this.activityDropdownCloseTimer) {
      clearTimeout(this.activityDropdownCloseTimer);
      this.activityDropdownCloseTimer = null;
    }
  }

  private prioritizeVerificationOccupations(preferredOccupationName: string | null): any[] {
    const source = Array.isArray(this.communityPublicBadgeTags) ? [...this.communityPublicBadgeTags] : [];
    if (!source.length) return source;

    const preferred = this.normalizeOccupationNameForMatch(preferredOccupationName);
    if (!preferred) return source;

    const preferredTokens = preferred.split(' ').filter((token) => token.length > 2);
    if (!preferredTokens.length) return source;

    let bestIndex = -1;
    let bestScore = 0;

    source.forEach((occupation, index) => {
      const normalizedName = this.normalizeOccupationNameForMatch(occupation?.name ?? occupation?.Name);
      const score = preferredTokens.reduce((sum, token) => (
        normalizedName.includes(token) ? sum + 1 : sum
      ), 0);

      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    if (bestIndex <= 0) return source;

    const [preferredItem] = source.splice(bestIndex, 1);
    source.unshift(preferredItem);
    return source;
  }

  private normalizeOccupationNameForMatch(value: string | null | undefined): string {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private getLeaderApplicationErrorMessage(source: any): string {
    if (source?.status === 401) {
      return 'Please log in to submit a community leader application.';
    }

    if (source?.status === 403) {
      return 'Your account is not allowed to submit a community leader application.';
    }

    return source?.error?.error?.Message
      || source?.error?.Error?.Message
      || source?.error?.message
      || source?.error?.Message
      || source?.Error?.Message
      || source?.message
      || 'Unable to submit the community leader application.';
  }
}
