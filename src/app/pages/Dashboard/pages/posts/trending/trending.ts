import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TrendingService } from '../services/trending';
import { environment } from '../../../../../environments/environment';
import { CategoryMap, PostAuthor, TrendingPost, PostStats } from '../models/trending';
import { PostsService } from '../services/posts';
import { InteractionType } from '../../posts/models/posts';
import { AuthService } from '../../../../Authentication/Service/auth';

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

  protected readonly environment = environment;
  protected readonly InteractionType = InteractionType; // For Template access

  // State
  posts: TrendingPost[] = [];
  isLoading = true;
  hasMore = true;
  currentPage = 1;
  readonly pageSize = 10;

  currentUserId: string | null = null;

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
          this.posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          if (this.currentPage >= res.totalPages) this.hasMore = false;
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading trending:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadMore() {
    if (this.hasMore && !this.isLoading) {
      this.currentPage++;
      this.loadPosts();
    }
  }

  // --- Interaction Logic ---
  toggleLike(post: TrendingPost) {
    if (!this.currentUserId) return alert('Please login.');
    if (!post.stats) post.stats = { likes: 0, comments: 0, views: 0, dislikes: 0, shares: 0 };

    const isLiked = post.currentUserInteraction === InteractionType.Like;
    const oldState = post.currentUserInteraction;

    // Optimistic Update
    if (isLiked) {
      post.currentUserInteraction = 0;
      post.stats.likes--;
    } else {
      post.currentUserInteraction = InteractionType.Like;
      post.stats.likes++;
      if (oldState === InteractionType.Dislike) post.stats.dislikes--;
    }

    this.postsService.interact(post.id, InteractionType.Like).subscribe({
      error: () => {
        post.currentUserInteraction = oldState;
        if (isLiked) post.stats!.likes++; else post.stats!.likes--;
      }
    });
  }

  // FIXED: Added this function
  goToDetails(id: number, fragment?: string) {
    this.router.navigate(['/admin/posts/details', id], { fragment });
  }

  // --- Helpers ---
  getCategoryName(id: number): string { return CategoryMap[id] || 'General'; }

  getPostImage(post: TrendingPost): string {
    if (post.attachments && post.attachments.length > 0) {
      let url = post.attachments[0].url;
      if (url.includes('@local://')) return `${this.environment.apiBaseUrl3}/${url.replace('@local://', '')}`;
      return url;
    }
    return 'assets/images/news-placeholder.jpg';
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