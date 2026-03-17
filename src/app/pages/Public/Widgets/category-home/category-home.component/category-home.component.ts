import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { CategoryPost } from '../models/category-home.models';
import { CategoryHomeService } from '../service/category-home.service';
import { CATEGORY_THEMES } from '../../feeds/models/categories';
import { environment } from '../../../../../environments/environment';
import { ImageService } from '../../../../../shared/services/image.service';
import { ImgFallbackDirective } from '../../../../../shared/directives/img-fallback.directive';
import { CategoryContextService } from '../../../../../shared/services/category-context.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../../Authentication/Service/auth';
import { VerificationService } from '../../../pages/settings/services/verification.service';
import { ToastService } from '../../../../../shared/services/toast.service';

export interface HeaderButtonChild {
  label: string;
  link: any[];
  icon?: string;
  isAction?: boolean;
  queryParams?: any;
}

export interface HeaderButton {
  label: string;
  link?: any[];
  icon?: string;
  queryParams?: any;
  isDropdown?: boolean;
  children?: HeaderButtonChild[];
}

import { VerificationModalComponent } from '../../../../../shared/components/verification-modal/verification-modal';
import { ArticleHeroComponent } from '../../article-hero.component/article-hero.component';


@Component({
  selector: 'app-category-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, ImgFallbackDirective, VerificationModalComponent, ArticleHeroComponent],
  templateUrl: './category-home.component.html',
  styleUrls: ['./category-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryHomeComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private homeService = inject(CategoryHomeService);
  private cdr = inject(ChangeDetectorRef);
  private categoryContext = inject(CategoryContextService);
  protected readonly environment = environment;
  protected imageService = inject(ImageService);
  protected authService = inject(AuthService);
  private verificationService = inject(VerificationService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  // --- Data Buckets ---
  heroPost: CategoryPost | null = null;       // 1. الصورة الكبيرة (Hero)
  topSidePosts: CategoryPost[] = [];          // 2. القائمة الجانبية العلوية
  gridPosts: CategoryPost[] = [];             // 3. شبكة الصور (Latest Grid)
  moreNewsPosts: CategoryPost[] = [];         // 4. القائمة السفلية (More News)
  textOnlyPosts: CategoryPost[] = [];         // 5. بوستات بدون صور (التصميم الجديد في الأسفل)
  trendingPosts: CategoryPost[] = [];         // 6. التريند (Sidebar)

  // --- Theme ---
  activeTheme: any = null;
  isLoading = true;
  isHousingCategory = false;
  activeCategoryId: number = 0;

  // Data Buckets
  structuredPosts: CategoryPost[] = []; // JSON metadata posts
  homesForSale: CategoryPost[] = [];
  homesForRent: CategoryPost[] = [];
  officialPosts: CategoryPost[] = [];

  // --- Dynamic Buttons ---
  headerButtons: HeaderButton[] = [];

  // --- Permissions & Verification ---
  showVerificationModal = false;
  // Removed local verification form variables as we use the shared component now

  // Tag-based Permissions
  currentUserInfo: any | null = null;
  categoryTags: any[] = [];

  ngOnInit(): void {
    // Removed initVerificationForm();
    this.setupAuthSubscription();
    this.route.params.subscribe(params => {
      const path = params['categoryPath'];
      this.resolveCategory(path);
    });
  }

  // ... existing methods ...

  resolveCategory(path: string) {
    this.isLoading = true;
    const categoryEntry = Object.entries(CATEGORY_THEMES).find(([key, val]: any) => val.path === path);

    if (categoryEntry) {
      this.activeTheme = categoryEntry[1];
      const divisionId = Number(categoryEntry[0]);
      this.activeCategoryId = divisionId;
      this.isHousingCategory = (divisionId === 4); // CategoryEnum.Housing

      // Update global context
      this.categoryContext.setCategory(divisionId);

      this.resolveHeaderButtons(divisionId, path);
      // Removed updateModalOccupations();
      this.fetchData(divisionId);
    } else {
      this.activeTheme = { label: 'News', color: '#333' }; // Fallback
      this.isHousingCategory = false;
      this.isLoading = false;
      this.resolveHeaderButtons(0, 'news');
      // Removed updateModalOccupations();
    }
  }

  resolveHeaderButtons(divisionId: number, path: string) {
    let buttons: HeaderButton[] = [];

    if (this.activeTheme && this.activeTheme.topLinks && this.activeTheme.topLinks.length > 0) {
      buttons = this.activeTheme.topLinks.map((link: any): HeaderButton => {
        const btn: HeaderButton = {
          label: link.label,
          icon: link.icon,
          isDropdown: link.isDropdown || false
        };

        if (link.isDropdown && link.children) {
          btn.children = link.children.map((child: any): HeaderButtonChild => {
            let queryParams: any = undefined;

            if (child.route?.includes('/posts/create')) {
              queryParams = { category: divisionId };
            } else if (child.route?.includes('/rss/connect')) {
              queryParams = { category: divisionId };
            } else {
              queryParams = child.queryParams || undefined;
            }

            return {
              label: child.label,
              link: [child.route],
              icon: child.icon,
              isAction: child.isAction || false,
              queryParams
            };
          });
        } else {
          btn.link = [link.route];

          if (link.route?.includes('/posts/create')) {
            btn.queryParams = { category: divisionId };
          } else {
            btn.queryParams = link.queryParams || undefined;
          }
        }

        return btn;
      });
    } else {
      // Default fallbacks
      buttons = [
        { label: 'Feed', link: ['/public/feed', path], icon: 'bi-rss' }
      ];
    }

    // Contributor Activity dropdown removed to avoid duplication (it comes from theme settings)

    // Add 'Ask a Question' Button at the end
    buttons.push({
      label: 'Ask a Question',
      link: ['/public/forums', path || 'news'],
      icon: 'bi-question-circle'
    });

    this.headerButtons = buttons;
  }

  fetchData(divisionId: number) {
    this.homeService.getCategoryHomeData(divisionId, 25).subscribe({
      next: (res: any) => {
        if (res.isSuccess && res.data) {
          // Capture tags for permission check
          if (res.data.tags) {
            this.categoryTags = res.data.tags;
          }

          // دمج المصادر لعمل الفرز اليدوي
          const allIncoming = [...(res.data.featured || []), ...(res.data.latest || [])];

          // 1. فصل البوستات: "بصور" vs "بدون صور"
          let allPosts: any[] = allIncoming.map(p => this.parsePostData(p));

          // Separate structured posts (those with JSON metadata)
          this.structuredPosts = allPosts.filter((p: any) => p.housingMetadata);
          const remainingPosts = allPosts.filter((p: any) => !p.housingMetadata);

          const withImages = remainingPosts.filter((p: any) => this.hasImage(p));
          const noImages = remainingPosts.filter((p: any) => !this.hasImage(p));

          if (this.isHousingCategory) {
            this.heroPost = withImages[0] || this.structuredPosts[0] || null;
            this.homesForSale = this.structuredPosts.filter(p => p.housingMetadata && !p.housingMetadata.IsRenting);
            this.homesForRent = this.structuredPosts.filter(p => p.housingMetadata && p.housingMetadata.IsRenting);
            this.officialPosts = allPosts.filter(p => p.author?.type === 2); // Official posts
          } else {
            // Standard layout
            this.heroPost = withImages[0] || null;
            this.topSidePosts = withImages.slice(1, 5);
            this.gridPosts = withImages.slice(5, 8);
            this.moreNewsPosts = withImages.slice(8, 12);
          }

          // 3. وضع البوستات النصية في القسم الجديد بالأسفل
          this.textOnlyPosts = noImages;

          // 4. التريند
          this.trendingPosts = res.data.trending?.map((p: any) => this.parsePostData(p)) || [];
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ... helpers ...

  private setupAuthSubscription() {
    this.authService.fullUserInfo$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((info) => {
        this.currentUserInfo = info;
        this.cdr.markForCheck();
      });
  }

  // Check permission for current category based on tags
  hasContributorAccess(): boolean {
    // 1. SuperAdmin always access
    if (this.authService.hasRole('SuperAdmin')) return true;

    // 2. Check if we have page tags and user info
    if (this.categoryTags.length > 0 && this.currentUserInfo?.tags) {
      const userTagIds = this.currentUserInfo.tags.map((t: any) => t.id);
      // Check if any category tag ID exists in user tags
      const hasTag = this.categoryTags.some(catTag => userTagIds.includes(catTag.id));
      if (hasTag) return true;
    }

    // Fallback? If no tags defined for category, maybe allow? 
    // Or if user data not loaded yet?
    // User request implies strict check against my-info.

    return false;
  }

  handleContributorAction(event: Event) {
    if (!this.hasContributorAccess()) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      this.showVerificationModal = true;
      this.cdr.detectChanges();
    }
  }

  onVerified() {
    // Reload User Info to get the new tag immediately
    this.authService.fetchFullUserInfo().subscribe();
    this.closeModal();
  }

  closeModal() {
    this.showVerificationModal = false;
    this.cdr.markForCheck();
  }

  // التحقق من وجود صورة
  hasImage(post: CategoryPost): boolean {
    const direct = !!(post.attachments && post.attachments.length > 0);
    const parent = !!(post.parentPost?.attachments && post.parentPost.attachments.length > 0);
    // Safety check for imageUrl property if it exists on the data but not in interface
    const hasUrl = !!((post as any).imageUrl && (post as any).imageUrl.trim() !== '');
    return direct || parent || hasUrl;
  }

  // جلب رابط الصورة
  getImg(post: any): string {
    return this.imageService.resolvePostImage(post);
  }

  // Navigate to Feed with optional filters
  navigateToFeed(options: { search?: string, filter?: string, tab?: string } = {}) {
    const queryParams: any = {};

    if (options.search) queryParams.search = options.search;
    if (options.filter) queryParams.filter = options.filter;
    if (options.tab) queryParams.tab = options.tab;
    this.router.navigate(['/public/feed', this.activeTheme?.path || 'news'], { queryParams });
  }

  onSearch(event: any) {
    const query = event.target.value;
    if (query && query.length > 2) {
      this.navigateToFeed({ search: query });
    }
  }

  get dynamicDescription(): string {
    return `Discover the latest updates, opportunities, and insights in ${this.activeTheme?.label || 'NYC'}.`;
  }

  getAuthorImg(author: any): string {
    return this.imageService.resolveAvatar(author);
  }

  private stripHtml(html: string | null | undefined): string {
    if (!html) return '';
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
    } catch {
      return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    }
  }

  private parsePostData(post: any): any {
    if (!post.content) return post;

    // Check for JSON in content (Housing metadata format)
    if (post.content.includes('{') && post.content.includes('}')) {
      try {
        const parts = post.content.split('\n\n\n');
        const jsonPart = parts.find((p: string) => p.trim().startsWith('{'));
        if (jsonPart) {
          post.housingMetadata = JSON.parse(jsonPart.trim());
          const rawDesc = parts.find((p: string) => !p.trim().startsWith('{')) || '';
          post.cleanDescription = this.stripHtml(rawDesc);
          return post; // Housing posts: don't overwrite content
        }
      } catch (e) {
        console.error('Failed to parse post metadata', e);
      }
    }

    // Strip HTML from RSS/blog content for display in card excerpts
    post.content = this.stripHtml(post.content);
    return post;
  }
}