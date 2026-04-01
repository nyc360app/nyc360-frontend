import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, Input, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../Authentication/Service/auth';
import { VerificationModalComponent } from '../../../../shared/components/verification-modal/verification-modal';
import { CATEGORY_THEMES, CategoryEnum, getDepartmentDiscussionsRoute, getDepartmentExploreRoute } from '../feeds/models/categories';
import { EMPTY_NEWS_ACCESS, NewsAccess, NewsService } from '../../../../shared/services/news.service';

interface HeroButtonChild {
  label: string;
  link: any[];
  icon?: string;
  isAction?: boolean;
  opensVerification?: boolean;
  queryParams?: any;
}

interface HeroButton {
  label: string;
  link?: any[];
  icon?: string;
  queryParams?: any;
  isDropdown?: boolean;
  children?: HeroButtonChild[];
}

@Component({
  selector: 'app-news-department-hero',
  standalone: true,
  imports: [CommonModule, RouterModule, VerificationModalComponent],
  templateUrl: './news-department-hero.component.html',
  styleUrls: ['./news-department-hero.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewsDepartmentHeroComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly newsService = inject(NewsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  @Input() title = 'News';
  @Input() description = 'Discover the latest updates, opportunities, and insights in News.';
  @Input() searchPlaceholder = 'Search in News...';
  
  readonly categoryId = CategoryEnum.News;
  readonly theme = CATEGORY_THEMES[CategoryEnum.News];
  readonly headerButtons: HeroButton[] = this.buildHeaderButtons();
  readonly newsCreateRoute: any[] = ['/news/create'];
  readonly newsRssRoute: any[] = ['/news/rss/connect'];
  readonly newsPollRoute: any[] = ['/news/create-poll'];
  readonly newsListingRoute: any[] = ['/news/listings/submit'];

  showVerificationModal = false;
  currentUserInfo: any | null = null;
  newsBadgeTags: any[] = [];
  newsAccess: NewsAccess = EMPTY_NEWS_ACCESS;
  modalOccupations: any[] = [];

  ngOnInit(): void {
    this.authService.fullUserInfo$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((info) => {
        this.currentUserInfo = info;
        this.cdr.markForCheck();
      });
      
    this.newsService.getNewsHome(12).subscribe({
      next: (res: any) => {
        this.newsBadgeTags = res?.isSuccess && Array.isArray(res?.data?.tags) ? res.data.tags : [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.newsBadgeTags = [];
        this.cdr.markForCheck();
      }
    });

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

  onSearch(query: string): void {
    const normalizedQuery = query.trim();
    this.router.navigate([getDepartmentExploreRoute(this.theme?.path || 'news')], {
      queryParams: normalizedQuery ? { search: normalizedQuery } : {}
    });
  }

  hasContributorAccess(): boolean {
    return this.hasUnlockedContributorActions;
  }

  get canSubmitContent(): boolean {
    return this.hasStaffBypass() || this.newsAccess.canSubmitContent;
  }

  get canPublishContent(): boolean {
    return this.hasStaffBypass() || this.newsAccess.canPublishContent;
  }

  get canConnectRss(): boolean {
    return this.hasStaffBypass() || this.newsAccess.canConnectRss;
  }

  get canListNewsOrganization(): boolean {
    return this.hasStaffBypass()
      || this.newsAccess.canListNewsOrganizationsInSpace
      || this.newsAccess.canListNewsOrganizationInSpace;
  }

  get hasNewsStatusBadges(): boolean {
    return this.hasUnlockedContributorActions
      || !!this.newsAccess.trustState
      || this.visibleGrantedBadges.length > 0;
  }

  get visibleGrantedBadges(): Array<{ id: number | string; code: string; name: string }> {
    return this.newsAccess.grantedBadges.slice(0, 3);
  }

  get additionalBadgeCount(): number {
    return Math.max(0, this.newsAccess.grantedBadges.length - this.visibleGrantedBadges.length);
  }

  get newsTrustStateLabel(): string {
    switch (this.newsAccess.trustState) {
      case 'VerifiedPublisher':
        return 'Verified Publisher';
      case 'ProbationaryPublisher':
        return 'Probationary Publisher';
      case 'UnverifiedContributor':
        return 'Unverified Contributor';
      default:
        return '';
    }
  }

  get newsTrustStateClass(): string {
    switch (this.newsAccess.trustState) {
      case 'VerifiedPublisher':
        return 'verified';
      case 'ProbationaryPublisher':
        return 'probationary';
      case 'UnverifiedContributor':
        return 'unverified';
      default:
        return 'subtle';
    }
  }

  get hasUnlockedContributorActions(): boolean {
    return this.hasStaffBypass()
      || this.newsAccess.canSubmitContent
      || this.newsAccess.canPublishContent
      || this.newsAccess.canConnectRss;
  }

  isActionVisible(child: HeroButtonChild): boolean {
    return true;
  }

  canUseAction(child: HeroButtonChild): boolean {
    if (!child?.isAction) return true;
    return this.isRssAction(child) ? this.canConnectRss : this.canSubmitContent;
  }

  handleContributorAction(event: Event, child: HeroButtonChild): void {
    if (this.canUseAction(child)) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.showVerificationModal = true;
    this.cdr.markForCheck();
  }

  openVerificationRequest(): void {
    this.modalOccupations = this.newsBadgeTags;
    this.showVerificationModal = true;
    this.cdr.markForCheck();
  }

  openNewsJourneyRequest(): void {
    this.modalOccupations = this.resolveNewsJourneyOccupations();
    this.showVerificationModal = true;
    this.cdr.markForCheck();
  }

  openNewsOrganizationAccessRequest(): void {
    this.modalOccupations = this.resolveNewsListingOccupations();
    this.showVerificationModal = true;
    this.cdr.markForCheck();
  }

  openNewsOrganizationEntry(): void {
    if (this.canListNewsOrganization) {
      this.router.navigate(this.newsListingRoute);
      return;
    }

    this.openNewsOrganizationAccessRequest();
  }

  onVerified(): void {
    this.authService.fetchFullUserInfo().subscribe();
    this.newsService.refreshNewsAccess().subscribe({
      next: (access) => {
        this.newsAccess = access;
        this.cdr.markForCheck();
      },
      error: () => {
        this.newsAccess = EMPTY_NEWS_ACCESS;
        this.cdr.markForCheck();
      }
    });
    this.closeModal();
  }

  closeModal(): void {
    this.modalOccupations = [];
    this.showVerificationModal = false;
    this.cdr.markForCheck();
  }

  private buildHeaderButtons(): HeroButton[] {
    const buttons = (this.theme?.topLinks || []).map((link: any): HeroButton => {
      const button: HeroButton = {
        label: link.label,
        icon: link.icon,
        isDropdown: !!link.isDropdown
      };

      if (link.isDropdown && link.children) {
        button.children = link.children.map((child: any): HeroButtonChild => ({
          label: child.label,
          link: child.route ? [child.route] : [],
          icon: child.icon,
          isAction: !!child.isAction,
          opensVerification: !!child.opensVerification,
          queryParams: child.route?.includes('/posts/create') || child.route?.includes('/rss/connect')
            ? { category: this.categoryId }
            : (child.queryParams || undefined)
        }));
      } else {
        button.link = [link.route];
        button.queryParams = link.route?.includes('/posts/create')
          ? { category: this.categoryId }
          : (link.queryParams || undefined);
      }

      return button;
    });

    buttons.push({
      label: 'Ask a Question',
      link: [getDepartmentDiscussionsRoute(this.theme?.path || 'news')],
      icon: 'bi-question-circle'
    });

    return buttons;
  }

  private isRssAction(child: HeroButtonChild): boolean {
    const route = Array.isArray(child?.link) ? child.link.join('/') : '';
    return route.includes('/rss/connect');
  }

  private resolveNewsJourneyOccupations(): any[] {
    const preferredRoles = this.newsBadgeTags.filter((tag) => this.isNewsJourneyTag(tag));
    return preferredRoles.length ? preferredRoles : this.newsBadgeTags.filter((tag) => !this.isNewsListingTag(tag));
  }

  private resolveNewsListingOccupations(): any[] {
    const listingRoles = this.newsBadgeTags.filter((tag) => this.isNewsListingTag(tag));
    return listingRoles.length ? listingRoles : this.newsBadgeTags;
  }

  private isNewsListingTag(tag: any): boolean {
    const label = String(tag?.name ?? tag?.Name ?? '').trim().toLowerCase();
    return label.includes('organization')
      || label.includes('space')
      || label.includes('location');
  }

  private isNewsJourneyTag(tag: any): boolean {
    const label = String(tag?.name ?? tag?.Name ?? '').trim().toLowerCase();
    return label.includes('publisher')
      || label.includes('assistant publisher')
      || label.includes('journalist')
      || label.includes('author')
      || label.includes('documentor')
      || label.includes('contributor')
      || label.includes('trainee');
  }

  private hasStaffBypass(): boolean {
    return this.authService.hasRole('Admin')
      || this.authService.hasRole('SuccessAdmin')
      || this.authService.hasRole('SuperAdmin');
  }
}
