import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, Input, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../Authentication/Service/auth';
import { VerificationModalComponent } from '../../../../shared/components/verification-modal/verification-modal';
import { CategoryHomeService } from '../category-home/service/category-home.service';
import { CATEGORY_THEMES, CategoryEnum } from '../feeds/models/categories';

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
  private readonly homeService = inject(CategoryHomeService);
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
  categoryTags: any[] = [];

  ngOnInit(): void {
    this.authService.fullUserInfo$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((info) => {
        this.currentUserInfo = info;
        this.cdr.markForCheck();
      });

    this.homeService.getCategoryHomeData(this.categoryId, 1).subscribe({
      next: (res: any) => {
        this.categoryTags = res?.isSuccess && Array.isArray(res?.data?.tags) ? res.data.tags : [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.categoryTags = [];
        this.cdr.markForCheck();
      }
    });
  }

  onSearch(query: string): void {
    const normalizedQuery = query.trim();
    this.router.navigate(['/public/feed', this.theme?.path || 'news'], {
      queryParams: normalizedQuery ? { search: normalizedQuery } : {}
    });
  }

  hasContributorAccess(): boolean {
    if (this.authService.hasRole('SuperAdmin')) return true;

    if (this.categoryTags.length > 0 && this.currentUserInfo?.tags) {
      const userTagIds = this.currentUserInfo.tags.map((tag: any) => tag.id);
      return this.categoryTags.some((tag) => userTagIds.includes(tag.id));
    }

    return false;
  }

  handleContributorAction(event: Event): void {
    if (this.hasContributorAccess()) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.showVerificationModal = true;
    this.cdr.markForCheck();
  }

  onVerified(): void {
    this.authService.fetchFullUserInfo().subscribe();
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
      link: ['/public/forums', this.theme?.path || 'news'],
      icon: 'bi-question-circle'
    });

    return buttons;
  }
}
