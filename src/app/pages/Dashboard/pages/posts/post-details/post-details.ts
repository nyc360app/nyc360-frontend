import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment';
import { PostsService } from '../services/posts';
import { Post, PostCategoryList, InteractionType, Comment, FlagReasonType } from '../models/posts';
import { AuthService } from '../../../../Authentication/Service/auth';

@Component({
  selector: 'app-post-details',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './post-details.html',
  styleUrls: ['./post-details.scss']
})
export class PostDetailsComponent implements OnInit {
  
  protected readonly environment = environment;
  protected readonly InteractionType = InteractionType;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private postsService = inject(PostsService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  // Data
  post: Post | null = null;
  isLoading = true;
  errorMessage = '';
  categories = PostCategoryList;
  
  // User
  currentUserId: string | null = null;
  currentUserData: any = null;
  isAdmin = false;
  
  // Interactions
  newCommentContent = '';
  replyInputs: { [key: number]: string } = {};
  activeReplyId: number | null = null;

  // Menu & Report State
  isMenuOpen = false;
  isReportModalOpen = false;
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

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) this.loadPost(+id);
    });
  }

  loadPost(id: number) {
    this.isLoading = true;
    this.postsService.getPostById(id).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.isSuccess && res.data) {
          this.post = res.data;
          // Safe Initialization
          if (!this.post.stats) this.post.stats = { views:0, likes:0, dislikes:0, comments:0, shares:0 };
          if (!this.post.comments) this.post.comments = [];
          this.cdr.detectChanges();
          this.checkFragment();
        } else {
          this.errorMessage = res.error?.message || 'Post not found.';
        }
      },
      error: () => { this.isLoading = false; this.errorMessage = 'Network error.'; this.cdr.detectChanges(); }
    });
  }

  checkFragment() {
    this.route.fragment.subscribe(fragment => {
      if (fragment === 'comments-section') {
        setTimeout(() => {
          const element = document.getElementById('comments-section');
          if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
    });
  }

  // --- Menu & Report ---
  toggleMenu(event: Event) {
    event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;
  }

  openReportModal() {
    this.isReportModalOpen = true;
    this.isMenuOpen = false;
    this.reportReason = null;
    this.reportDetails = '';
  }

  closeReportModal() { this.isReportModalOpen = false; }

  submitReport() {
    if (!this.post || !this.reportReason) return;
    this.isReporting = true;
    this.postsService.reportPost(this.post.id, this.reportReason, this.reportDetails).subscribe({
      next: (res) => {
        this.isReporting = false;
        if (res.isSuccess) { alert('Report submitted successfully.'); this.closeReportModal(); }
        else { alert(res.error?.message || 'Failed.'); }
      },
      error: () => { this.isReporting = false; alert('Network error.'); }
    });
  }

  // --- Helpers ---
  resolveImageUrl(url: string | undefined | null): string {
    if (!url) return '';
    if (url.includes('@local://')) return `${this.environment.apiBaseUrl3}/${url.replace('@local://', '')}`;
    if (!url.startsWith('http') && !url.startsWith('data:')) return `${this.environment.apiBaseUrl}/${url}`;
    return url;
  }

  getAvatar(author: any): string {
    return this.resolveImageUrl(author?.imageUrl) || 'assets/images/default-avatar.png';
  }

  getCategoryName(id: number): string { return this.categories.find(c => c.id === id)?.name || 'General'; }

  // --- Permissions ---
  get isOwnerOrAdmin(): boolean {
    if (this.isAdmin) return true;
    if (!this.post?.author || !this.currentUserId) return false;
    let authorId = (typeof this.post.author === 'object') ? (this.post.author as any).id : this.post.author;
    return String(authorId) === String(this.currentUserId);
  }

  // --- Actions ---
  onDelete() {
    if (this.post && confirm('Delete post?')) {
      this.postsService.deletePost(this.post.id).subscribe({ next: () => this.router.navigate(['/admin/posts']) });
    }
  }

  toggleInteraction(type: InteractionType) {
    if (!this.post) return;
    if (!this.currentUserId) { alert('Login required.'); return; }

    const oldInteraction = this.post.currentUserInteraction;
    if (this.post.currentUserInteraction === type) {
      this.post.currentUserInteraction = 0;
      if (type === InteractionType.Like) this.post.stats!.likes--; else this.post.stats!.dislikes--;
    } else {
      if (this.post.currentUserInteraction === InteractionType.Like) this.post.stats!.likes--;
      if (this.post.currentUserInteraction === InteractionType.Dislike) this.post.stats!.dislikes--;
      this.post.currentUserInteraction = type;
      if (type === InteractionType.Like) this.post.stats!.likes++; else this.post.stats!.dislikes++;
    }

    this.postsService.interact(this.post.id, type).subscribe({
      error: () => { if(this.post) { this.post.currentUserInteraction = oldInteraction; if (type === InteractionType.Like) this.post.stats!.likes--; } }
    });
  }

  // --- Comments ---
  submitComment() {
    if (!this.newCommentContent.trim() || !this.post) return;
    if (!this.currentUserId) { alert('Login required.'); return; }
    
    if (!this.post.comments) this.post.comments = [];
    if (!this.post.stats) this.post.stats = { views:0, likes:0, dislikes:0, comments:0, shares:0 };

    const content = this.newCommentContent;
    const tempComment: any = { 
      id: -Date.now(), 
      content: content, 
      author: { fullName: this.currentUserData?.fullName || 'User', imageUrl: this.currentUserData?.imageUrl }, 
      createdAt: new Date().toISOString(), 
      replies: [] 
    };

    this.post.comments.unshift(tempComment);
    this.post.stats.comments++;
    this.newCommentContent = '';

    this.postsService.addComment(this.post.id, content).subscribe({
      next: (res) => { 
        if (res.isSuccess && this.post?.comments) { 
            this.post.comments.shift(); 
            this.post.comments.unshift(res.data as any); 
        } 
      },
      error: () => { 
        if(this.post?.comments) this.post.comments.shift(); 
        if(this.post?.stats) this.post.stats.comments--; 
        this.newCommentContent = content; 
      }
    });
  }

  openReplyInput(commentId: number) { this.activeReplyId = this.activeReplyId === commentId ? null : commentId; }

  submitReply(parent: Comment) {
    const content = this.replyInputs[parent.id];
    if (!content?.trim() || !this.post) return;
    if (!this.currentUserId) { alert('Login required.'); return; }

    if (!parent.replies) parent.replies = [];
    if (!this.post.stats) this.post.stats = { views:0, likes:0, dislikes:0, comments:0, shares:0 };

    const tempReply: any = { 
      id: -Date.now(), 
      content: content, 
      author: { fullName: this.currentUserData?.fullName || 'User', imageUrl: this.currentUserData?.imageUrl }, 
      createdAt: new Date().toISOString() 
    };
    parent.replies.push(tempReply);
    this.replyInputs[parent.id] = '';
    this.activeReplyId = null;
    this.post.stats.comments++;

    this.postsService.addComment(this.post.id, content, parent.id).subscribe({
      next: (res) => { if (res.isSuccess && parent.replies) { parent.replies.pop(); parent.replies.push(res.data as any); } },
      error: () => { if(parent.replies) parent.replies.pop(); if(this.post?.stats) this.post.stats.comments--; }
    });
  }
}