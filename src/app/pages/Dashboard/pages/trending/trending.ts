import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TrendingService } from '../posts/services/trending';
import { environment } from '../../../../environments/environment';
import { CategoryMap, PostAuthor, TrendingPost, PostStats } from '../posts/models/trending';
import { PostsService } from '../posts/services/posts';
import { InteractionType } from '../posts/models/posts';
import { AuthService } from '../../../Authentication/Service/auth';
import { ToastService } from '../../../../shared/services/toast.service';
import { CATEGORY_THEMES, CategoryEnum } from '../../../Public/Widgets/feeds/models/categories';

@Component({
  selector: 'app-trending',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trending.html',
  styleUrls: ['./trending.scss']
})
export class TrendingComponent implements OnInit {

  private trendingService = inject(TrendingService);
  private postsService = inject(PostsService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);

  protected readonly environment = environment;
  protected readonly InteractionType = InteractionType;

  // Data
  posts: TrendingPost[] = [];
  isLoading = true;
  hasMore = true;
  currentPage = 1;
  readonly pageSize = 20; // Increased for admin overview

  currentUserId: string | null = null;

  // Dashboard Metrics
  stats = {
    totalTrending: 0,
    topCategory: 'General',
    avgEngagement: '0%'
  };

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) this.currentUserId = user.id || user.userId;
    });
    this.loadPosts();
  }

  loadPosts() {
    if (this.currentPage === 1) this.isLoading = true;

    this.trendingService.getTrendingPosts(this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          const newPosts = res.data.map(p => ({
            ...p,
            stats: p.stats || { likes: 0, comments: 0, views: 0, dislikes: 0, shares: 0 } as PostStats
          }));

          this.posts = [...this.posts, ...newPosts];
          // Admin likes to see highest engagement first
          this.posts.sort((a, b) => {
            const scoreA = (a.stats?.likes || 0) + (a.stats?.comments || 0) * 2;
            const scoreB = (b.stats?.likes || 0) + (b.stats?.comments || 0) * 2;
            return scoreB - scoreA;
          });

          if (this.currentPage >= res.totalPages) this.hasMore = false;

          this.calculateDashboardStats();
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading trending:', err);
        this.toastService.error('Failed to load trending posts.');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  calculateDashboardStats() {
    // 1. Total
    this.stats.totalTrending = this.posts.length;

    // 2. Top Category
    const catCounts: Record<number, number> = {};
    let maxCount = 0;
    let maxCatId = 0;

    let totalInteractions = 0;
    let totalViews = 0;

    this.posts.forEach(p => {
      catCounts[p.category] = (catCounts[p.category] || 0) + 1;
      if (catCounts[p.category] > maxCount) {
        maxCount = catCounts[p.category];
        maxCatId = p.category;
      }
      totalInteractions += (p.stats.likes || 0) + (p.stats.comments || 0);
      totalViews += (p.stats.views || 0);
    });

    this.stats.topCategory = this.getCategoryTheme(maxCatId).label;

    // 3. Avg Engagement (Simple proxy: interactions / (unique posts * 100) or just total)
    // Let's just show total interactions nicely formatted
    this.stats.avgEngagement = totalInteractions > 1000 ? (totalInteractions / 1000).toFixed(1) + 'k' : totalInteractions.toString();
  }

  loadMore() {
    if (this.hasMore && !this.isLoading) {
      this.currentPage++;
      this.loadPosts();
    }
  }

  // --- Management Actions ---
  removeFromTrending(id: number) {
    if (!confirm('Force remove this post from Trending list?')) return;

    // Optimistic remove
    this.posts = this.posts.filter(p => p.id !== id);
    this.calculateDashboardStats();
    // In real app, call API: this.trendingService.removeFromTrending(id)...
    this.toastService.success('Post removed from trending (Simulation).');
  }

  boostPost(id: number) {
    // Simulation of "Boosting" a post to stay trending longer
    this.toastService.success(`Post #${id} boosted for 24 hours! 🚀`);
  }

  goToDetails(id: number, fragment?: string) {
    this.router.navigate(['/admin/posts/details', id], { fragment });
  }

  // --- Helpers ---
  getCategoryTheme(id: number) {
    return CATEGORY_THEMES[id as CategoryEnum] || { color: '#333', label: 'Unknown', path: '' };
  }

  getPostImage(post: TrendingPost): string {
    if (post.attachments && post.attachments.length > 0) {
      let url = post.attachments[0].url;
      if (url.includes('@local://')) return `${this.environment.apiBaseUrl3}/${url.replace('@local://', '')}`;
      return url;
    }
    return ''; // Return empty to handle in template
  }

  getAuthorName(author: PostAuthor): string {
    if (!author) return 'NYC360 Editor';
    return author.name || author.fullName || author.username || 'Unknown';
  }

  getAuthorImage(url: string | null | undefined): string {
    if (!url) return 'assets/images/avatar-placeholder.png';
    if (url.includes('@local://')) return `${this.environment.apiBaseUrl3}/${url.replace('@local://', '')}`;
    return url;
  }
}