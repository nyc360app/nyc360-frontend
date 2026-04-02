import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { CategoryPost, LatestRssFeedItemDto, StandardApiResponse } from '../models/category-home.models';
import { CategoryHomeService } from '../service/category-home.service';
import { CATEGORY_THEMES, CategoryEnum, getDepartmentDiscussionsRoute, getDepartmentExploreRoute } from '../../feeds/models/categories';
import { environment } from '../../../../../environments/environment';
import { ImageService } from '../../../../../shared/services/image.service';
import { ImgFallbackDirective } from '../../../../../shared/directives/img-fallback.directive';
import { CategoryContextService } from '../../../../../shared/services/category-context.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../Authentication/Service/auth';
import { ToastService } from '../../../../../shared/services/toast.service';
import { PostsService } from '../../../pages/posts/services/posts';
import { FeedData, InterestGroup, Post } from '../../../pages/posts/models/posts';
import { NewsFeaturedFeedResponse, NewsPollSummary, NewsService } from '../../../../../shared/services/news.service';
export interface HeaderButtonChild {
  label: string;
  link: any[];
  icon?: string;
  isAction?: boolean;
  opensVerification?: boolean;
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
import { NewsDepartmentHeroComponent } from '../../news-department-hero/news-department-hero.component';
import { CategoryDepartmentHeroComponent } from '../../category-department-hero/category-department-hero.component';


@Component({
  selector: 'app-category-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, ImgFallbackDirective, VerificationModalComponent, ArticleHeroComponent, NewsDepartmentHeroComponent, CategoryDepartmentHeroComponent],
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
  private toastService = inject(ToastService);
  private postsService = inject(PostsService);
  private newsService = inject(NewsService);
  private destroyRef = inject(DestroyRef);

  // Explicit palette for News cross-department rows (matches product spec exactly).
  private readonly departmentPalette: Record<number, string> = {
    [CategoryEnum.Community]: '#FB7D3F',
    [CategoryEnum.Culture]: '#DD363A',
    [CategoryEnum.Education]: '#0056B3',
    [CategoryEnum.Health]: '#00C3FF',
    [CategoryEnum.Housing]: '#B59B62',
    [CategoryEnum.Lifestyle]: '#8BC34A',
    [CategoryEnum.Legal]: '#102A43',
    [CategoryEnum.News]: '#333333',
    [CategoryEnum.Professions]: '#2ECC71',
    [CategoryEnum.Social]: '#17A2B8',
    [CategoryEnum.Transportation]: '#F1C40F',
    [CategoryEnum.Tv]: '#0D47A1'
  };

  // --- Data Buckets ---
  heroPost: CategoryPost | null = null;       // 1. الصورة الكبيرة (Hero)
  topSidePosts: CategoryPost[] = [];          // 2. القائمة الجانبية العلوية
  gridPosts: CategoryPost[] = [];             // 3. شبكة الصور (Latest Grid)
  moreNewsPosts: CategoryPost[] = [];         // 4. القائمة السفلية (More News)
  textOnlyPosts: CategoryPost[] = [];         // 5. بوستات بدون صور (التصميم الجديد في الأسفل)
  trendingPosts: CategoryPost[] = [];         // 6. التريند (Sidebar)
  rssFeedPosts: CategoryPost[] = [];          // Backend RSS feed items
  newsHeroIndex = 0;
  newsFeaturedSlidesStore: CategoryPost[] = [];
  newsFeaturedCursor: string | null = null;
  isLoadingMoreNewsFeatured = false;
  hasMoreNewsFeatured = true;
  newsFeaturedFeedEmpty = false;

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
  crossDepartmentGroups: InterestGroup[] = [];
  isLoadingCrossDepartmentGroups = false;
  newsPolls: NewsPollSummary[] = [];
  isLoadingNewsPolls = false;

  // --- Dynamic Buttons ---
  headerButtons: HeaderButton[] = [];

  // --- Permissions & Verification ---
  showVerificationModal = false;
  // Removed local verification form variables as we use the shared component now

  // Tag-based Permissions
  currentUserInfo: any | null = null;
  categoryTags: any[] = [];
  private resolvedCategoryPath = '';

  ngOnInit(): void {
    // Removed initVerificationForm();
    this.setupAuthSubscription();
    this.route.params.subscribe(() => this.resolveCategoryFromRoute());
    this.route.data.subscribe(() => this.resolveCategoryFromRoute());
  }

  // ... existing methods ...

  private resolveCategoryFromRoute(): void {
    const path = this.route.snapshot.params['categoryPath'] || this.route.snapshot.data['categoryPath'];
    if (!path || path === this.resolvedCategoryPath) {
      return;
    }
    this.resolvedCategoryPath = path;
    this.resolveCategory(path);
  }

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
      if (divisionId === 7) {
        this.loadCrossDepartmentGroups();
        this.loadPublishedNewsPolls();
      } else {
        this.crossDepartmentGroups = [];
        this.isLoadingCrossDepartmentGroups = false;
        this.newsPolls = [];
        this.isLoadingNewsPolls = false;
      }
    } else {
      this.activeTheme = { label: 'News', color: '#333' }; // Fallback
      this.isHousingCategory = false;
      this.isLoading = false;
      this.resolveHeaderButtons(0, 'news');
      this.crossDepartmentGroups = [];
      this.isLoadingCrossDepartmentGroups = false;
      this.newsPolls = [];
      this.isLoadingNewsPolls = false;
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
              link: child.route ? [child.route] : [],
              icon: child.icon,
              isAction: child.isAction || false,
              opensVerification: !!child.opensVerification,
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
        { label: 'Explore', link: [getDepartmentExploreRoute(path)], icon: 'bi-rss' }
      ];
    }

    // Contributor Activity dropdown removed to avoid duplication (it comes from theme settings)

    // Add 'Ask a Question' Button at the end
    buttons.push({
      label: 'Ask a Question',
      link: [getDepartmentDiscussionsRoute(path || 'news')],
      icon: 'bi-question-circle'
    });

    this.headerButtons = buttons;
  }

  fetchData(divisionId: number) {
    this.rssFeedPosts = [];
    this.newsHeroIndex = 0;
    this.newsFeaturedSlidesStore = [];
    this.newsFeaturedCursor = null;
    this.hasMoreNewsFeatured = true;
    this.isLoadingMoreNewsFeatured = false;
    this.newsFeaturedFeedEmpty = false;

    // RSS feed update cards are hidden for News department by product decision.
    if (divisionId !== CategoryEnum.News) {
      // Prefer dedicated latest RSS endpoint; keep home payload RSS as fallback.
      this.loadLatestRssItems(divisionId);
    }

    this.homeService.getCategoryHomeData(divisionId, 25).subscribe({
      next: (res: any) => {
        if (res.isSuccess && res.data) {
          // Capture tags for permission check
          if (res.data.tags) {
            this.categoryTags = res.data.tags;
          }

          const featuredIncoming = Array.isArray(res.data.featured) ? res.data.featured : [];
          const latestIncoming = Array.isArray(res.data.latest) ? res.data.latest : [];
          const rssIncoming = Array.isArray(res.data.rss) ? res.data.rss : [];

          if (divisionId === CategoryEnum.News) {
            this.loadInitialFeaturedNewsFeed();
          }

          // Keep RSS in a dedicated bucket for explicit rendering in UI.
          if (divisionId !== CategoryEnum.News && this.rssFeedPosts.length === 0) {
            this.rssFeedPosts = rssIncoming.map((p: any) => this.parsePostData(p));
          }

          // دمج المصادر لعمل الفرز اليدوي (regular content only)
          const allIncoming = [...featuredIncoming, ...latestIncoming];

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

  private loadLatestRssItems(divisionId: number): void {
    this.homeService.getLatestRssItems(divisionId, 6).subscribe({
      next: (response) => {
        // Prevent stale response writing when user switches departments quickly.
        if (this.activeCategoryId !== divisionId) {
          return;
        }

        const items = this.getStandardResponseData(response);
        if (!Array.isArray(items) || items.length === 0) {
          return;
        }

        this.rssFeedPosts = items.map((item) => this.mapLatestRssItemToPost(item));
        this.cdr.markForCheck();
      },
      error: () => {
        // Keep existing RSS fallback data from category-home response.
      }
    });
  }

  private getStandardResponseData<T>(response: StandardApiResponse<T> | null | undefined): T | undefined {
    return response?.data ?? response?.Data;
  }

  private mapLatestRssItemToPost(item: LatestRssFeedItemDto): CategoryPost {
    return {
      id: item.id,
      title: item.title || 'Untitled',
      content: item.summary || '',
      category: Number(item.category ?? this.activeCategoryId),
      createdAt: item.publishedAt || new Date().toISOString(),
      author: {
        id: item.sourceId || 0,
        name: 'RSS Source',
        imageUrl: ''
      },
      attachments: item.imageUrl ? [{ id: 0, url: item.imageUrl }] : [],
      stats: { views: 0, likes: 0, shares: 0, comments: 0 },
      isSavedByUser: false,
      cleanDescription: this.stripHtml(item.summary || ''),
      externalLink: item.link || ''
    };
  }

  private loadCrossDepartmentGroups(): void {
    this.isLoadingCrossDepartmentGroups = true;

    this.postsService.getPostsFeed().subscribe({
      next: (res) => {
        if (res?.isSuccess && res.data) {
          this.crossDepartmentGroups = this.mapCrossDepartmentGroups(res.data);
        } else {
          this.crossDepartmentGroups = [];
        }

        this.isLoadingCrossDepartmentGroups = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.crossDepartmentGroups = [];
        this.isLoadingCrossDepartmentGroups = false;
        this.cdr.markForCheck();
      }
    });
  }

  private loadPublishedNewsPolls(): void {
    this.isLoadingNewsPolls = true;

    this.newsService.getPublishedNewsPolls(1, 4).subscribe({
      next: (response) => {
        this.newsPolls = response?.isSuccess ? (response.data || []) : [];
        this.isLoadingNewsPolls = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.newsPolls = [];
        this.isLoadingNewsPolls = false;
        this.cdr.markForCheck();
      }
    });
  }

  private mapCrossDepartmentGroups(data: FeedData): InterestGroup[] {
    return (data.interestGroups || [])
      .map((group) => {
        const validGroupPosts: Post[] = [];
        const normalizedGroupPosts: Post[] = [];

        (group.posts || []).forEach((rawPost) => {
          const post = this.parsePostData(rawPost);
          normalizedGroupPosts.push(post);

          if (this.hasImage(post)) {
            validGroupPosts.push(post);
          }
        });

        let groupPosts = validGroupPosts.length > 0 ? validGroupPosts : normalizedGroupPosts;

        // In News department, keep the "News" row focused on general news only.
        if (this.activeCategoryId === CategoryEnum.News && Number(group.category) === CategoryEnum.News) {
          groupPosts = groupPosts.filter((post) => this.isGeneralNewsPost(post));
        }

        return {
          ...group,
          posts: groupPosts
        };
      })
      .filter((group) => (group.posts || []).length > 0)
      .sort((a, b) => Number(a.category) - Number(b.category));
  }

  private isGeneralNewsPost(post: Post): boolean {
    const isNewsCategory = Number(post?.category) === CategoryEnum.News;
    if (!isNewsCategory) {
      return false;
    }

    const parentCategory = Number((post as any)?.parentPost?.category);
    const sharedFromAnotherDepartment =
      !Number.isNaN(parentCategory) &&
      parentCategory !== CategoryEnum.News;

    const isHousingLike =
      !!(post as any)?.housingMetadata ||
      Number((post as any)?.linkedResource?.category) === CategoryEnum.Housing;

    return !sharedFromAnotherDepartment && !isHousingLike;
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

  openVerificationRequest() {
    this.showVerificationModal = true;
    this.cdr.detectChanges();
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
    this.router.navigate([getDepartmentExploreRoute(this.activeTheme?.path || 'news')], { queryParams });
  }

  onSearch(query: string) {
    const normalizedQuery = query.trim();
    if (normalizedQuery) {
      this.navigateToFeed({ search: normalizedQuery });
    }
  }

  get dynamicDescription(): string {
    return `Discover the latest updates, opportunities, and insights in ${this.activeTheme?.label || 'NYC'}.`;
  }

  get featuredNewsPoll(): NewsPollSummary | null {
    return this.newsPolls[0] || null;
  }

  get newsHeroSlides(): CategoryPost[] {
    const slides = this.newsFeaturedSlidesStore.length > 0
      ? this.newsFeaturedSlidesStore
      : [this.heroPost, ...this.topSidePosts].filter((post): post is CategoryPost => !!post);

    return slides;
  }

  get newsHeroDotIndices(): number[] {
    const total = this.newsHeroSlides.length;
    const maxDots = 6;
    if (total <= maxDots) {
      return Array.from({ length: total }, (_, i) => i);
    }

    const half = Math.floor(maxDots / 2);
    let start = Math.max(0, this.newsHeroIndex - half);
    let end = start + maxDots - 1;

    if (end >= total) {
      end = total - 1;
      start = Math.max(0, end - maxDots + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  get activeNewsHeroPost(): CategoryPost | null {
    return this.newsHeroSlides[this.newsHeroIndex] || null;
  }

  nextNewsHero(): void {
    if (this.newsHeroSlides.length <= 1) return;
    this.newsHeroIndex = (this.newsHeroIndex + 1) % this.newsHeroSlides.length;
    this.maybeLoadMoreNewsFeatured();
    this.cdr.markForCheck();
  }

  prevNewsHero(): void {
    if (this.newsHeroSlides.length <= 1) return;
    this.newsHeroIndex = (this.newsHeroIndex - 1 + this.newsHeroSlides.length) % this.newsHeroSlides.length;
    this.cdr.markForCheck();
  }

  setNewsHeroSlide(index: number): void {
    if (index < 0 || index >= this.newsHeroSlides.length) return;
    this.newsHeroIndex = index;
    this.maybeLoadMoreNewsFeatured();
    this.cdr.markForCheck();
  }

  getNewsHeroSourceLabel(post: CategoryPost): string {
    return this.getDepartmentRowLabel(this.resolvePostCategory(post));
  }

  getNewsHeroSourceIcon(post: CategoryPost): string {
    return this.getDepartmentRowIcon(this.resolvePostCategory(post));
  }

  get secondaryNewsPolls(): NewsPollSummary[] {
    return this.newsPolls.slice(1, 4);
  }

  get educationHeroTitle(): string {
    return 'Education';
  }

  get educationHeroDescription(): string {
    return 'Updates, resources, and opportunities for students, families, and educators.';
  }

  get healthHeroTitle(): string {
    return 'Health';
  }

  get healthHeroDescription(): string {
    return 'Health updates, trusted resources, and practical support for New Yorkers.';
  }

  get exploreRoute(): string {
    return getDepartmentExploreRoute(this.activeTheme?.path || 'news');
  }

  get searchPlaceholder(): string {
    return `Search in ${this.activeTheme?.label || 'NYC360'}...`;
  }

  get isNewsCategory(): boolean {
    return this.activeCategoryId === 7;
  }

  get isEducationCategory(): boolean {
    return this.activeTheme?.path === 'education';
  }

  get isCultureCategory(): boolean {
    return this.activeTheme?.path === 'culture';
  }

  get isHealthCategory(): boolean {
    return this.activeTheme?.path === 'health';
  }

  getAuthorImg(author: any): string {
    return this.imageService.resolveAvatar(author);
  }

  getDepartmentRowLabel(categoryId: number): string {
    return (CATEGORY_THEMES as any)[Number(categoryId)]?.label || 'General';
  }

  getDepartmentRowColor(categoryId: number): string {
    return this.departmentPalette[Number(categoryId)]
      || (CATEGORY_THEMES as any)[Number(categoryId)]?.color
      || '#B59B62';
  }

  getDepartmentRowIcon(categoryId: number): string {
    return (CATEGORY_THEMES as any)[Number(categoryId)]?.icon || '';
  }

  getDepartmentRowBiIcon(categoryId: number): string {
    return (CATEGORY_THEMES as any)[Number(categoryId)]?.biIcon || 'bi-circle-fill';
  }

  getDepartmentRowRoute(categoryId: number): string {
    return (CATEGORY_THEMES as any)[Number(categoryId)]?.route || '/public/home';
  }

  getPollCoverImage(poll: NewsPollSummary): string {
    return this.imageService.resolveImageUrl(poll.coverImageUrl || '');
  }

  openNewsPoll(poll: NewsPollSummary): void {
    this.router.navigate(['/news/polls', poll.pollId]);
  }

  isNewsPollClosed(poll: NewsPollSummary): boolean {
    return !!poll.closesAt && new Date(poll.closesAt).getTime() < Date.now();
  }

  getNewsPollStatusLabel(poll: NewsPollSummary): string {
    return this.isNewsPollClosed(poll) ? 'Closed' : 'Live Poll';
  }

  getNewsPollMeta(poll: NewsPollSummary): string {
    if (!poll.closesAt) {
      return 'Open-ended';
    }

    return this.isNewsPollClosed(poll)
      ? `Closed ${new Date(poll.closesAt).toLocaleDateString()}`
      : `Closes ${new Date(poll.closesAt).toLocaleDateString()}`;
  }

  goToDepartmentPost(post: Post): void {
    if (post.category === 8 && (post as any).linkedResource) {
      this.router.navigate(['/professions/jobs', (post as any).linkedResource.id]);
      return;
    }

    this.router.navigate(['/public/posts/details', post.id], {
      state: { postData: post }
    });
  }

  scrollDepartmentGroup(categoryId: number, direction: 'left' | 'right'): void {
    const slider = document.getElementById('news-slider-' + categoryId);
    if (!slider) return;

    const scrollAmount = slider.clientWidth * 0.8;
    slider.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
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

  private maybeLoadMoreNewsFeatured(): void {
    if (!this.isNewsCategory || this.isLoadingMoreNewsFeatured || !this.hasMoreNewsFeatured) {
      return;
    }

    if (this.newsHeroIndex < this.newsHeroSlides.length - 3) {
      return;
    }

    this.loadMoreNewsFeatured();
  }

  private loadMoreNewsFeatured(): void {
    this.isLoadingMoreNewsFeatured = true;
    this.newsService.getFeaturedNewsFeed(10, this.newsFeaturedCursor).subscribe({
      next: (response: NewsFeaturedFeedResponse<any>) => {
        const items = response?.data?.items || [];
        const parsedFeatured = items
          .map((p: any) => this.parsePostData(p))
          .filter((p: CategoryPost) => this.hasImage(p));

        const existingIds = new Set(this.newsFeaturedSlidesStore.map((post) => post.id));
        const newItems = parsedFeatured.filter((post) => !existingIds.has(post.id));

        if (newItems.length > 0) {
          this.newsFeaturedSlidesStore = [...this.newsFeaturedSlidesStore, ...newItems];
        }

        this.newsFeaturedCursor = response?.data?.nextCursor || null;
        this.hasMoreNewsFeatured = !!response?.data?.hasMore && !!this.newsFeaturedCursor;
        this.isLoadingMoreNewsFeatured = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingMoreNewsFeatured = false;
        this.cdr.markForCheck();
      }
    });
  }

  private loadInitialFeaturedNewsFeed(): void {
    this.isLoadingMoreNewsFeatured = true;
    this.newsService.getFeaturedNewsFeed(10).subscribe({
      next: (response: NewsFeaturedFeedResponse<any>) => {
        const items = response?.data?.items || [];
        const parsedFeatured = items
          .map((p: any) => this.parsePostData(p))
          .filter((p: CategoryPost) => this.hasImage(p));

        if (parsedFeatured.length > 0) {
          this.newsFeaturedSlidesStore = parsedFeatured;
          this.newsFeaturedFeedEmpty = false;
        } else {
          this.newsFeaturedFeedEmpty = true;
        }
        this.newsFeaturedCursor = response?.data?.nextCursor || null;
        this.hasMoreNewsFeatured = !!response?.data?.hasMore && !!this.newsFeaturedCursor;
        this.isLoadingMoreNewsFeatured = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingMoreNewsFeatured = false;
        this.cdr.markForCheck();
      }
    });
  }

  resolvePostCategory(post: CategoryPost): number {
    const parent = Number((post as any)?.parentPost?.category);
    if (!Number.isNaN(parent) && parent > 0) {
      return parent;
    }

    const direct = Number(post?.category);
    if (!Number.isNaN(direct) && direct > 0) {
      return direct;
    }

    return CategoryEnum.News;
  }

  private coerceToCategoryPost(post: Post | CategoryPost, groupCategory?: number): CategoryPost {
    const author = (post as any)?.author;
    const safeAuthor = author && typeof author === 'object'
      ? author
      : { id: 0, name: 'NYC360', imageUrl: '' };

    const incomingCategory = Number((post as any)?.category);
    const resolvedCategory = (!Number.isNaN(groupCategory) && groupCategory && (Number.isNaN(incomingCategory) || incomingCategory === CategoryEnum.News))
      ? groupCategory
      : incomingCategory;

    return {
      ...(post as any),
      category: Number.isNaN(resolvedCategory) ? CategoryEnum.News : resolvedCategory,
      author: safeAuthor
    } as CategoryPost;
  }
}
