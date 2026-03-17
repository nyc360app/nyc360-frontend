import { Component, OnInit, ElementRef, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostsService } from '../services/posts';
import { environment } from '../../../../../environments/environment';
import { ImageService } from '../../../../../shared/services/image.service';
import { ImgFallbackDirective } from '../../../../../shared/directives/img-fallback.directive';

import { CategoryEnum, CATEGORY_THEMES } from '../models/categories';

@Component({
  selector: 'app-feed-layout',
  templateUrl: './feed-layout.html',
  styleUrls: ['./feed-layout.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ImgFallbackDirective],
  // ⚡ PERFORMANCE BOOST: استراتيجية التحديث اليدوي
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeedLayoutComponent implements OnInit, OnDestroy {
  posts: any[] = [];
  locations: any[] = [];
  loading = true;

  // Pagination & Filters
  totalCount: number = 0;
  totalPages: number = 0;
  pagesArray: number[] = [];
  currentCategory: number = 0;
  pageTitle: string = '';
  searchQuery: string = '';
  selectedLocationId: number | null = null;
  currentPage: number = 1;
  pageSize: number = 9;
  protected readonly environment = environment;

  private searchSubject = new Subject<string>();
  private locationSearch$ = new Subject<string>();
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private postsService: PostsService,
    private el: ElementRef,
    private cdr: ChangeDetectorRef, // لتحديث الواجهة يدوياً
    private imageService: ImageService
  ) {
    // إعداد البحث المباشر
    this.subscriptions.push(
      this.searchSubject.pipe(debounceTime(400), distinctUntilChanged()).subscribe(txt => {
        this.searchQuery = txt;
        this.currentPage = 1;
        this.loadPosts();
      }),
      this.locationSearch$.pipe(debounceTime(400), distinctUntilChanged()).subscribe(term => this.fetchLocations(term))
    );
  }

  isHousingCategory = false;

  ngOnInit(): void {
    this.subscriptions.push(
      this.route.data.subscribe(data => {
        this.currentCategory = data['categoryEnum'];
        this.pageTitle = data['title'];
        this.isHousingCategory = this.currentCategory === CategoryEnum.Housing;

        const theme = CATEGORY_THEMES[this.currentCategory] || { color: '#333' };
        this.applyTheme(theme.color);
        this.resetFilters();
        this.loadPosts();
      })
    );
  }

  ngOnDestroy(): void { this.subscriptions.forEach(sub => sub.unsubscribe()); }

  // ⚡ دالة التتبع لتحسين أداء ngFor (الحل للمشكلة السابقة)
  trackByPostId(index: number, item: any): number {
    return item.id;
  }

  applyTheme(color: string) {
    if (this.el?.nativeElement) this.el.nativeElement.style.setProperty('--primary-color', color);
  }

  loadPosts() {
    if (this.posts.length === 0) {
      this.loading = true;
      this.cdr.markForCheck(); // إظهار السكيلتون فقط لو مفيش داتا
    }

    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });

    const params = {
      page: this.currentPage,
      pageSize: this.pageSize,
      category: this.currentCategory,
      locationId: this.selectedLocationId,
      search: this.searchQuery
    };

    this.postsService.getFeed(params).subscribe({
      next: (res: any) => {
        if (res.isSuccess) {
          this.totalCount = res.totalCount;
          this.totalPages = res.totalPages;
          this.posts = this.mapAndSortPosts(res.data);
          this.generatePageArray();
        }
        this.loading = false;
        this.cdr.detectChanges(); // Force immediate update
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- معالجة البيانات ---
  private mapAndSortPosts(rawPosts: any[]): any[] {
    const mapped = rawPosts.map(post => {
      const isShared = !!post.parentPost;
      const catTheme = CATEGORY_THEMES[post.category] || { label: 'General', color: '#999' };

      return {
        ...post,
        ui: {
          isShared,
          displayImage: this.resolvePostImage(post),
          authorImg: this.imageService.resolveAvatar(post.author),
          authorName: post.author?.fullName || post.author?.username || 'Member',
          title: post.title || post.parentPost?.title,
          content: this.stripHtml(post.content),
          sharedTitle: isShared ? post.parentPost.title : null,
          sharedContent: isShared ? this.stripHtml(post.parentPost.content) : null,
          locationName: post.location?.neighborhood || post.location?.city,
          categoryName: catTheme.label,
          categoryColor: catTheme.color,
          categoryIcon: catTheme.icon,
          postTypeName: this.getPostTypeName(post.postType, post.sourceType)
        }
      };
    });

    // ترتيب الصور أولاً
    return mapped.sort((a, b) => (b.ui.displayImage ? 1 : 0) - (a.ui.displayImage ? 1 : 0));
  }

  getPostTypeName(postType: number, sourceType: number): string {
    return sourceType === 2 ? 'Article' : (postType === 1 ? 'News' : 'Post');
  }

  /** Strip HTML tags and decode HTML entities from a string (e.g. RSS content) */
  private stripHtml(html: string | null | undefined): string {
    if (!html) return '';
    // Use DOMParser to safely parse and extract text
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
    } catch {
      // Fallback: simple regex strip
      return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    }
  }

  generatePageArray() {
    let start = Math.max(1, this.currentPage - 1);
    let end = Math.min(this.totalPages, this.currentPage + 1);
    if (this.totalPages >= 3) {
      if (this.currentPage === 1) end = 3;
      else if (this.currentPage === this.totalPages) start = this.totalPages - 2;
    } else { start = 1; end = this.totalPages; }
    this.pagesArray = Array.from({ length: (end - start) + 1 }, (_, i) => start + i);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadPosts();
    }
  }

  // Actions
  onSearchInput(event: any) { this.searchSubject.next(event.target.value); }
  onLocationType(term: string) { if (term.length > 2) this.locationSearch$.next(term); }
  fetchLocations(term: string) {
    this.postsService.searchLocations(term).subscribe((res: any) => {
      if (res.isSuccess) { this.locations = res.data; this.cdr.markForCheck(); }
    });
  }
  selectLocation(locId: number) {
    this.selectedLocationId = locId;
    this.locations = [];
    this.currentPage = 1;
    this.loadPosts();
  }
  resetFilters() { this.searchQuery = ''; this.selectedLocationId = null; this.currentPage = 1; }

  // --- Image Resolvers ---
  resolvePostImage(post: any): string | null {
    if (!this.imageService.hasImage(post)) return null;
    return this.imageService.resolvePostImage(post);
  }

  resolveAuthorImage(author: any): string {
    let url = author?.imageUrl;
    if (!url || url.trim() === '') return 'assets/images/default-avatar.png';
    url = url.replace('@local://', '');
    if (url.startsWith('http')) return url;
    return `${this.environment.apiBaseUrl3}/${url}`;
  }
}