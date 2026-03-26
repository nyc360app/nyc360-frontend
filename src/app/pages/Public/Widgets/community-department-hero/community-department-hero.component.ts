import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, HostListener, Input, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../Authentication/Service/auth';
import { CommunityService } from '../../pages/communities/services/community';
import { CommunityLeaderApplicationModalComponent } from '../../../../shared/components/community-leader-application-modal/community-leader-application-modal';
import { ToastService } from '../../../../shared/services/toast.service';
import { BadgeOption, buildCommunityD01BadgeOptions } from '../../../../shared/utils/community-badge-policy';
import {
  hasCommunityStaffBypass,
  hasCommunityContributorAccess as hasCommunityContributorAccessTag,
  hasCommunityCreateAccess as hasCommunityCreateAccessTag,
  hasCommunityLeaderAccess as hasCommunityLeaderAccessTag,
  hasCommunityOrganizationAccess as hasCommunityOrganizationAccessTag,
  isCommunityGate1Eligible
} from '../../../../shared/utils/community-contract';
import { getDepartmentExploreRoute } from '../feeds/models/categories';

@Component({
  selector: 'app-community-department-hero',
  standalone: true,
  imports: [CommonModule, RouterModule, CommunityLeaderApplicationModalComponent],
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

  currentUserInfo: any | null = this.authService.getFullUserInfo();
  communityPublicBadgeTags: BadgeOption[] = buildCommunityD01BadgeOptions([]);
  isLeaderApplicationModalOpen = false;
  preferredApplicationOccupationId: number | null = null;

  ngOnInit(): void {
    this.authService.fullUserInfo$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((info) => {
        this.currentUserInfo = info;
        this.cdr.markForCheck();
      });

    if (this.authService.isLoggedIn() && !this.authService.getFullUserInfo()) {
      this.authService.fetchFullUserInfo().subscribe({ error: () => undefined });
    }

    this.communityService.getCommunityBadgeOptions().subscribe({
      next: (options) => {
        this.communityPublicBadgeTags = options;
        this.cdr.markForCheck();
      },
      error: () => {
        this.communityPublicBadgeTags = buildCommunityD01BadgeOptions([]);
        this.cdr.markForCheck();
      }
    });
  }

  get hasCommunityLeaderAccess(): boolean {
    return this.hasStaffBypass || hasCommunityLeaderAccessTag(this.currentUserInfo?.tags || []);
  }

  get hasCreateCommunityAccess(): boolean {
    return this.hasStaffBypass || hasCommunityCreateAccessTag(this.currentUserInfo?.tags || []);
  }

  get hasOrganizationListingAccess(): boolean {
    return this.hasStaffBypass || hasCommunityOrganizationAccessTag(this.currentUserInfo?.tags || []);
  }

  get hasCommunityContributorAccess(): boolean {
    return this.hasStaffBypass || hasCommunityContributorAccessTag(this.currentUserInfo?.tags || []);
  }

  get hasStaffBypass(): boolean {
    return this.authService.hasRole('Admin')
      || this.authService.hasRole('SuperAdmin')
      || hasCommunityStaffBypass(this.currentUserInfo);
  }

  get hasGate1Eligibility(): boolean {
    return this.hasStaffBypass || isCommunityGate1Eligible(this.currentUserInfo);
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

  openLeaderApplicationModal(): void {
    this.openContributorApplicationModal(null);
  }

  openLeaderPublishingAccessModal(): void {
    this.openContributorApplicationModal('Apply for Community Leader Badges');
  }

  openCreateCommunityAccessModal(): void {
    this.openContributorApplicationModal('Apply for Create a Community');
  }

  openOrganizationListingAccessModal(): void {
    this.openContributorApplicationModal('List Community Organization in Space');
  }

  private openContributorApplicationModal(preferredOccupationName: string | null): void {
    if (!this.hasGate1Eligibility) {
      this.toastService.info('A verified Resident, Organization, or Business account is required before requesting D01 Community contributor access.');
      this.router.navigate(['/public/profile/settings']);
      this.isActivityDropdownOpen = false;
      return;
    }

    if (!this.communityPublicBadgeTags.length) {
      this.toastService.error('Community contributor roles are not configured on the backend yet.');
      this.isActivityDropdownOpen = false;
      return;
    }

    this.preferredApplicationOccupationId = this.resolvePreferredOccupationId(preferredOccupationName);
    this.isLeaderApplicationModalOpen = true;
    this.isActivityDropdownOpen = false;
  }

  onVerified(): void {
    this.authService.fetchFullUserInfo().subscribe();
    this.closeLeaderApplicationModal();
  }

  closeLeaderApplicationModal(): void {
    this.preferredApplicationOccupationId = null;
    this.isLeaderApplicationModalOpen = false;
    this.cdr.markForCheck();
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

  private normalizeOccupationNameForMatch(value: string | null | undefined): string {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private resolvePreferredOccupationId(preferredOccupationName: string | null | undefined): number | null {
    const normalized = this.normalizeOccupationNameForMatch(preferredOccupationName);
    if (!normalized) return null;

    const match = this.communityPublicBadgeTags.find((occupation) =>
      this.normalizeOccupationNameForMatch(occupation?.name).includes(normalized)
      || normalized.includes(this.normalizeOccupationNameForMatch(occupation?.name))
    );

    return match?.id ?? null;
  }
}
