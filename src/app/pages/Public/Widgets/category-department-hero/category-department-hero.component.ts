import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, Input, OnChanges, OnInit, SimpleChanges, inject } from '@angular/core';
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
  selector: 'app-category-department-hero',
  standalone: true,
  imports: [CommonModule, RouterModule, VerificationModalComponent],
  templateUrl: './category-department-hero.component.html',
  styleUrls: ['./category-department-hero.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryDepartmentHeroComponent implements OnInit, OnChanges {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly homeService = inject(CategoryHomeService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  @Input() categoryPath = 'culture';
  @Input() title = '';
  @Input() description = '';
  @Input() searchPlaceholder = '';
  @Input() showSearch = true;

  theme = CATEGORY_THEMES[CategoryEnum.Culture];
  categoryId = CategoryEnum.Culture;
  headerButtons: HeroButton[] = [];

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

    this.resolveCategoryConfig();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categoryPath'] && !changes['categoryPath'].firstChange) {
      this.resolveCategoryConfig();
    }
  }

  get resolvedTitle(): string {
    return this.title || this.theme?.label || 'Department';
  }

  get resolvedDescription(): string {
    return this.description || `Discover the latest updates, opportunities, and insights in ${this.theme?.label || 'NYC360'}.`;
  }

  get resolvedSearchPlaceholder(): string {
    return this.searchPlaceholder || `Search in ${this.theme?.label || 'NYC360'}...`;
  }

  onSearch(query: string): void {
    const normalizedQuery = query.trim();
    this.router.navigate(['/public/feed', this.theme?.path || this.categoryPath || 'culture'], {
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

  private resolveCategoryConfig(): void {
    const categoryEntry = Object.entries(CATEGORY_THEMES).find(([, value]: any) => value.path === this.categoryPath);
    const fallback = CATEGORY_THEMES[CategoryEnum.Culture];

    if (categoryEntry) {
      this.categoryId = Number(categoryEntry[0]);
      this.theme = categoryEntry[1] as any;
    } else {
      this.categoryId = CategoryEnum.Culture;
      this.theme = fallback;
    }

    this.headerButtons = this.buildHeaderButtons();
    this.fetchCategoryTags();
    this.cdr.markForCheck();
  }

  private fetchCategoryTags(): void {
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
      link: ['/public/forums', this.theme?.path || this.categoryPath || 'culture'],
      icon: 'bi-question-circle'
    });

    return buttons;
  }
}
