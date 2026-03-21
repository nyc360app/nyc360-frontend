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

  showVerificationModal = false;
  currentUserInfo: any | null = null;
  newsBadgeTags: any[] = [];
  newsAccess: NewsAccess = EMPTY_NEWS_ACCESS;

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
    return this.canSubmitContent;
  }

  get canSubmitContent(): boolean {
    return this.authService.hasRole('SuperAdmin') || this.newsAccess.canSubmitContent;
  }

  get canPublishContent(): boolean {
    return this.authService.hasRole('SuperAdmin') || this.newsAccess.canPublishContent;
  }

  get canConnectRss(): boolean {
    return this.authService.hasRole('SuperAdmin') || this.newsAccess.canConnectRss;
  }

  isActionVisible(child: HeroButtonChild): boolean {
    if (!child?.isAction) return true;

    if (this.isRssAction(child)) {
      return this.canConnectRss;
    }

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
          link: [child.route],
          icon: child.icon,
          isAction: !!child.isAction,
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
}
