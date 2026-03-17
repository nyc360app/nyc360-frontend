import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment';
import { Post, InteractionType, Comment, FlagReasonType } from '../models/posts';
import { PostsService } from '../services/posts';
import { AuthService } from '../../../../Authentication/Service/auth';
import { CATEGORY_THEMES, CategoryEnum } from '../../../../Public/Widgets/feeds/models/categories';
import { ToastService } from '../../../../../shared/services/toast.service';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './post-list.html',
  styleUrls: ['./post-list.scss']
})
export class PostListComponent implements OnInit {

  protected readonly environment = environment;
  protected readonly InteractionType = InteractionType;

  private postsService = inject(PostsService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastService = inject(ToastService);

  // --- Data ---
  allPosts: Post[] = []; // Store all fetched posts
  filteredPosts: Post[] = []; // Store posts after filter/search
  categories = Object.entries(CATEGORY_THEMES).map(([key, value]) => ({
    id: Number(key),
    ...value
  }));

  isLoading = true;
  errorMessage = '';

  // --- Admin State ---
  currentUserId: string | null = null;
  currentUserData: any = null;
  isAdmin = false;
  viewMode: 'table' | 'grid' = 'table'; // Admin view mode

  // --- Filters & Sort ---
  searchTerm = '';
  selectedCategoryId: number = -1; // -1 for All
  sortBy: 'latest' | 'oldest' | 'popular' = 'latest';

  // --- Stats ---
  dashboardStats = [
    { title: 'Total Posts', value: 0, icon: 'bi-grid-fill', color: 'gold' },
    { title: 'Most Active', value: 'General', icon: 'bi-activity', color: 'blue' },
    { title: 'Engagement', value: '0', icon: 'bi-graph-up-arrow', color: 'green' }
  ];

  // --- UI State Maps (Legacy support for simple interactions if needed) ---
  openMenuId: number | null = null;

  // --- Report Modal (Admin Action) ---
  isReportModalOpen = false;
  reportPostId: number | null = null;
  reportReason: number | null = null;
  reportDetails: string = '';
  isReporting = false;

  reportReasonsList = [
    { id: FlagReasonType.Spam, label: 'Spam' },
    { id: FlagReasonType.HateSpeech, label: 'Hate Speech' },
    { id: FlagReasonType.Harassment, label: 'Harassment' },
    { id: FlagReasonType.InappropriateContent, label: 'Inappropriate Content' },
    { id: FlagReasonType.ScamOrFraud, label: 'Scam or Fraud' },
    { id: FlagReasonType.ViolationOfPolicy, label: 'Violation of Policy' },
    { id: FlagReasonType.Other, label: 'Other' }
  ];

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUserId = user.id || user.userId;
        this.currentUserData = user;
        this.isAdmin = Array.isArray(user.roles) ? user.roles.includes('Admin') : user.roles === 'Admin';
      }
    });

    this.route.queryParams.subscribe(params => {
      const catId = params['category'];
      this.selectedCategoryId = catId ? Number(catId) : -1;
      this.loadPosts();
    });
  }

  loadPosts() {
    this.isLoading = true;
    this.errorMessage = '';

    // Fetch ALL posts to handle filtering client-side for smoother Admin experience
    // Or fetch by category if selected. For Admin Dashboard, fetching all (paginated) is usually better, 
    // but here we stick to the service structure.
    const categoryParam = this.selectedCategoryId !== -1 ? this.selectedCategoryId : undefined;

    this.postsService.getAllPosts(categoryParam).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res?.isSuccess && Array.isArray(res.data)) {
          this.allPosts = res.data.map(p => ({
            ...p,
            stats: p.stats || { likes: 0, comments: 0, views: 0, dislikes: 0, shares: 0 },
            comments: p.comments || []
          }));
          this.applyFilters();
          this.calculateStats();
        } else {
          this.allPosts = [];
          this.filteredPosts = [];
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Could not load feed.';
        this.toastService.error('Failed to load posts data.');
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters() {
    let temp = [...this.allPosts];

    // 1. Category Filter (already handled by API mostly, but good for client-side search)
    if (this.selectedCategoryId !== -1) {
      temp = temp.filter(p => p.category === this.selectedCategoryId);
    }

    // 2. Search
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      temp = temp.filter(p =>
        p.title?.toLowerCase().includes(term) ||
        p.content?.toLowerCase().includes(term) ||
        (p.author as any)?.fullName?.toLowerCase().includes(term)
      );
    }

    // 3. Sort
    if (this.sortBy === 'latest') {
      temp.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (this.sortBy === 'oldest') {
      temp.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (this.sortBy === 'popular') {
      temp.sort((a, b) => (b.stats?.likes || 0) - (a.stats?.likes || 0));
    }

    this.filteredPosts = temp;
  }

  calculateStats() {
    const total = this.allPosts.length;

    // Most Active Category
    const catCounts: Record<number, number> = {};
    let maxCount = 0;
    let maxCatId = -1;
    let totalEngagement = 0;

    this.allPosts.forEach(p => {
      catCounts[p.category] = (catCounts[p.category] || 0) + 1;
      if (catCounts[p.category] > maxCount) {
        maxCount = catCounts[p.category];
        maxCatId = p.category;
      }
      totalEngagement += (p.stats?.likes || 0) + (p.stats?.comments || 0);
    });

    const activeCatName = maxCatId !== -1 ? this.getCategoryTheme(maxCatId).label : 'N/A';

    this.dashboardStats = [
      { title: 'Total Posts', value: total, icon: 'bi-grid-fill', color: 'gold' },
      { title: 'Trending Category', value: activeCatName, icon: 'bi-activity', color: 'blue' },
      { title: 'Total Engagement', value: totalEngagement.toLocaleString(), icon: 'bi-graph-up-arrow', color: 'green' }
    ];
  }

  // --- Interaction Logic (Admin shortcuts) ---
  toggleMenu(postId: number, event: Event) {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === postId ? null : postId;
  }

  openReportModal(post: Post) {
    this.reportPostId = post.id;
    this.reportReason = null;
    this.reportDetails = '';
    this.isReportModalOpen = true;
    this.openMenuId = null;
  }

  closeReportModal() { this.isReportModalOpen = false; this.reportPostId = null; }

  submitReport() {
    if (!this.reportPostId || !this.reportReason) return;
    this.isReporting = true;
    this.postsService.reportPost(this.reportPostId, this.reportReason, this.reportDetails).subscribe({
      next: (res) => {
        this.isReporting = false;
        if (res.isSuccess) {
          this.toastService.success('Report submitted successfully.');
          this.closeReportModal();
        } else {
          this.toastService.error(res.error?.message || 'Failed to submit.');
        }
      },
      error: () => {
        this.isReporting = false;
        this.toastService.error('Network error during report submission.');
      }
    });
  }

  onDelete(id: number) {
    if (confirm('Are you sure you want to permanently delete this post? This action cannot be undone.')) {
      this.postsService.deletePost(id).subscribe({
        next: (res) => { // Assuming response might have success flag
          this.toastService.success('Post deleted successfully');
          this.allPosts = this.allPosts.filter(p => p.id !== id);
          this.applyFilters();
          this.calculateStats();
        },
        error: () => {
          this.toastService.error('Failed to delete post');
        }
      });
    }
  }

  // --- Helpers ---
  resolveImageUrl(url: string | undefined | null): string {
    if (!url) return '';
    if (url.includes('@local://')) return `${this.environment.apiBaseUrl3}/${url.replace('@local://', '')}`;
    if (!url.startsWith('http') && !url.startsWith('data:')) return `${this.environment.apiBaseUrl}/${url}`;
    return url;
  }

  getAvatar(author: any): string {
    const url = author?.imageUrl;
    return this.resolveImageUrl(url) || 'assets/images/default-avatar.png';
  }

  getMainImage(post: Post): string | null {
    if (post.attachments?.length > 0) return this.resolveImageUrl(post.attachments[0].url);
    if (post.imageUrl) return this.resolveImageUrl(post.imageUrl);
    return null;
  }

  // Dynamic Theme Helper
  getCategoryTheme(id: number) {
    return CATEGORY_THEMES[id as CategoryEnum] || { color: '#333', label: 'Unknown', path: '' };
  }

  toggleViewMode(mode: 'table' | 'grid') {
    this.viewMode = mode;
  }
}