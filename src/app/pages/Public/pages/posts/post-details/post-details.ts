import { Component, OnInit, inject, ChangeDetectorRef, PLATFORM_ID, makeStateKey, TransferState, HostListener } from '@angular/core';
import { CommonModule, isPlatformServer } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FormsModule, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment';
import { InteractionType, Post, PostAuthor, PostComment, FlagReasonType } from '../models/posts';
import { PostsService } from '../services/posts';
import { AuthService } from '../../../../Authentication/Service/auth';
import { ToastService } from '../../../../../shared/services/toast.service';
import { CATEGORY_LIST } from '../../../../models/category-list';
import { CATEGORY_THEMES } from '../../../Widgets/feeds/models/categories';
import { ConfirmationService } from '../../../../../shared/services/confirmation.service';
import { ImageService } from '../../../../../shared/services/image.service';
import { ImgFallbackDirective } from '../../../../../shared/directives/img-fallback.directive';

interface RelatedPost {
  id: number;
  title: string;
  imageUrl: string;
  commentsCount: number;
}

@Component({
  selector: 'app-post-details',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule, ImgFallbackDirective],
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
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);
  private cdr = inject(ChangeDetectorRef);
  protected imageService = inject(ImageService);
  private fb = inject(FormBuilder);

  // ✅ SSR Optimization Injections
  private transferState = inject(TransferState);
  private platformId = inject(PLATFORM_ID);

  post: Post | null = null;
  isLoading = true;
  errorMessage = '';

  categories = CATEGORY_LIST;
  currentUserId: string | null = null;
  isAdmin = false;

  relatedPosts: RelatedPost[] = [];

  newCommentContent = '';
  replyInputs: { [key: number]: string } = {};
  activeReplyId: number | null = null;

  showMenu = false;
  showReportModal = false;
  reportReason: number | null = null;
  reportDetails = '';
  isReporting = false;
  reportSuccess = false;
  isReportingAttempted = false;

  // Extension Data for structured posts (Real Estate, Jobs, etc.)
  structuredExtension: any = null;
  sanitizedContent: string = '';

  reportReasonsList = [
    { id: FlagReasonType.Spam, label: 'Spam', icon: 'bi-mailbox' },
    { id: FlagReasonType.HateSpeech, label: 'Hate Speech', icon: 'bi-megaphone' },
    { id: FlagReasonType.Harassment, label: 'Harassment', icon: 'bi-person-x' },
    { id: FlagReasonType.InappropriateContent, label: 'Inappropriate Content', icon: 'bi-image' },
    { id: FlagReasonType.ScamOrFraud, label: 'Scam or Fraud', icon: 'bi-shield-exclamation' },
    { id: FlagReasonType.ViolationOfPolicy, label: 'Violation of Policy', icon: 'bi-file-earmark-restricted' },
    { id: FlagReasonType.Other, label: 'Other', icon: 'bi-three-dots' }
  ];

  showShareModal = false;
  shareCommentary = '';
  isSharing = false;

  // ✅ Housing Application Modal


  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user && user.id) {
        this.currentUserId = user.id;
        this.isAdmin = Array.isArray(user.roles) ? user.roles.includes('Admin') : user.roles === 'Admin';
      }
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.post = null;
        this.loadPost(+id);
      }
    });
  }

  loadPost(id: number) {
    const stateData = (typeof window !== 'undefined') ? window.history.state?.postData : null;
    if (stateData && stateData.id === id) {
      this.handlePostData({ post: stateData, relatedPosts: [] });
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    const POST_KEY = makeStateKey<any>('post_data_' + id);
    if (this.transferState.hasKey(POST_KEY)) {
      const savedData = this.transferState.get(POST_KEY, null);
      this.transferState.remove(POST_KEY);
      this.handlePostData(savedData);
      this.isLoading = false;
    } else {
      this.isLoading = true;
      this.postsService.getPostById(id).subscribe({
        next: (res: any) => {
          this.isLoading = false;
          if (res.isSuccess && res.data) {
            if (isPlatformServer(this.platformId)) {
              this.transferState.set(POST_KEY, res.data);
            }
            this.handlePostData(res.data);
          } else {
            this.errorMessage = (res.error as any)?.message || 'Post not found.';
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.isLoading = false;
          this.errorMessage = 'Network error.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  handlePostData(apiData: any) {
    const rawPost = apiData.post || apiData;

    // ✅ Redirection Logic: If this is a Job Post (Category 8/Professions), go to Job Profile
    if (rawPost.category === 8 && rawPost.linkedResource) {
      this.router.navigate(['/public/job-profile', rawPost.linkedResource.id]);
      return;
    }

    if (apiData.post) {
      this.post = this.normalizePostData(apiData.post);
    } else {
      this.post = this.normalizePostData(apiData);
    }

    if (apiData.comments) {
      this.post!.comments = apiData.comments;
      if (this.post?.stats) this.post.stats.comments = apiData.comments.length;
    }

    this.parseContent(this.post?.content || '');

    if (apiData.relatedPosts) {
      this.relatedPosts = apiData.relatedPosts;
    } else {
      this.relatedPosts = [];
    }
  }

  private parseContent(content: string) {
    if (!content) return;

    // Split by the triple newline separator
    const parts = content.split('\n\n\n');
    let hasJson = false;
    let jsonIndex = -1;

    for (let i = 0; i < parts.length; i++) {
      const trimmed = parts[i].trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          this.structuredExtension = JSON.parse(trimmed);
          hasJson = true;
          jsonIndex = i;
          break;
        } catch (e) {
          // Not valid JSON, continue
        }
      }
    }

    if (hasJson) {
      // Sanitized content is the part that is NOT JSON
      this.sanitizedContent = parts.filter((_, idx) => idx !== jsonIndex).join('\n\n');
    } else {
      this.structuredExtension = null;
      this.sanitizedContent = '';
      // Wait, original logic: 
      // this.structuredExtension = null;
      // this.sanitizedContent = content; 
      this.sanitizedContent = content;
    }
  }

  normalizePostData(post: Post): Post {
    if (!post.stats) post.stats = { views: 0, likes: 0, dislikes: 0, comments: 0, shares: 0 };
    if (post.currentUserInteraction !== undefined) post.userInteraction = post.currentUserInteraction;
    if (post.isSavedByUser !== undefined) post.isSaved = post.isSavedByUser;
    else post.isSaved = false;

    // Recursively normalize parent post
    if (post.parentPost && typeof post.parentPost === 'object') {
      this.normalizePostData(post.parentPost);
    } else if ((post as any).ParentPost && typeof (post as any).ParentPost === 'object') {
      post.parentPost = (post as any).ParentPost;
      this.normalizePostData(post.parentPost!);
    }

    return post;
  }

  openShareModal() {
    if (!this.currentUserId) {
      this.toastService.warning('Please login to share posts.');
      return;
    }
    this.showShareModal = true;
    this.shareCommentary = '';
  }

  closeShareModal() {
    this.showShareModal = false;
    this.shareCommentary = '';
    this.isSharing = false;
  }

  submitShare() {
    if (!this.post) return;
    this.isSharing = true;
    this.postsService.sharePost(this.post.id, this.shareCommentary).subscribe({
      next: (res: any) => {
        this.isSharing = false;
        if (res.isSuccess) {
          if (this.post?.stats) this.post.stats.shares++;
          this.toastService.success('Post shared successfully on your feed!');
          this.closeShareModal();
        } else {
          this.toastService.error((res.error as any)?.message || 'Failed to share post.');
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSharing = false;
        this.toastService.error('Network error while sharing.');
        this.cdr.detectChanges();
      }
    });
  }

  toggleSave() {
    if (!this.post) return;
    if (!this.currentUserId) { this.toastService.warning('Please login to save posts.'); return; }
    const oldState = this.post.isSaved;
    this.post.isSaved = !this.post.isSaved;
    this.postsService.savePost(this.post.id).subscribe({
      next: (res: any) => { if (!res.isSuccess) this.post!.isSaved = oldState; },
      error: () => { this.post!.isSaved = oldState; }
    });
  }

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.showMenu = !this.showMenu;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    this.showMenu = false;
  }

  openReportModal() {
    if (!this.currentUserId) {
      this.toastService.warning('Please login to report posts.');
      return;
    }
    this.showMenu = false;
    this.showReportModal = true;
    this.reportReason = null;
    this.reportDetails = '';
    this.isReportingAttempted = false;
  }

  closeReportModal() {
    this.showReportModal = false;
    this.reportReason = null;
    this.reportDetails = '';
    this.isReporting = false;
    setTimeout(() => { this.reportSuccess = false; }, 300);
  }

  submitReport() {
    this.isReportingAttempted = true;
    if (!this.reportReason || !this.post || this.reportDetails.length < 10) return;
    this.isReporting = true;

    this.postsService.reportPost(this.post.id, this.reportReason, this.reportDetails).subscribe({
      next: (res: any) => {
        this.isReporting = false;
        if (res.isSuccess) {
          this.reportSuccess = true;
          this.toastService.success('Thank you! Your report has been received.');
          // Auto close after 2 seconds
          setTimeout(() => {
            this.closeReportModal();
          }, 2500);
        } else {
          this.toastService.error((res.error as any)?.message || 'Failed to submit report.');
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isReporting = false;
        this.toastService.error('Network error while reporting.');
        this.cdr.detectChanges();
      }
    });
  }

  getAuthorName(author: PostAuthor | string | undefined): string {
    if (!author) return 'NYC360 User';
    if (typeof author === 'string') return 'User';
    return author.name || author.fullName || author.username || 'User';
  }

  getAuthorAvatar(author: any): string {
    return this.imageService.resolveAvatar(author);
  }

  resolveImageUrl(url: string | undefined | null): string {
    return this.imageService.resolveImageUrl(url, 'post');
  }

  getCategoryName(id: number): string {
    if (id === undefined || id === null) return 'General';
    return this.categories.find(c => c.id === id)?.name || 'General';
  }

  getCategoryColor(id: number | undefined): string {
    if (id === undefined || id === null) return '#d4af37';
    return (CATEGORY_THEMES as any)[id]?.color || '#d4af37';
  }

  getCategoryIcon(id: number | undefined): string {
    if (id === undefined || id === null) return '';
    return (CATEGORY_THEMES as any)[id]?.icon || '';
  }

  submitComment() {
    if (!this.newCommentContent.trim() || !this.post || !this.currentUserId) return;
    this.postsService.addComment(this.post.id, this.newCommentContent).subscribe({
      next: (res: any) => {
        if (res.isSuccess && this.post?.comments) {
          this.post.comments.unshift(res.data as any);
          if (this.post.stats) this.post.stats.comments++;
          this.newCommentContent = '';
          this.cdr.detectChanges();
        }
      }
    });
  }

  openReplyInput(commentId: number) { this.activeReplyId = this.activeReplyId === commentId ? null : commentId; }

  submitReply(parentComment: PostComment, content: string) {
    if (!content.trim() || !this.post || !this.currentUserId) return;
    this.postsService.addComment(this.post.id, content, parentComment.id).subscribe({
      next: (res: any) => {
        if (res.isSuccess) {
          if (!parentComment.replies) parentComment.replies = [];
          parentComment.replies.push(res.data as any);
          if (this.post?.stats) this.post.stats.comments++;
          this.replyInputs[parentComment.id] = '';
          this.activeReplyId = null;
          this.cdr.detectChanges();
        }
      }
    });
  }

  toggleInteraction(type: InteractionType) {
    if (!this.post || !this.currentUserId) return;
    const oldInteraction = this.post.userInteraction;
    if (this.post.userInteraction === type) {
      this.post.userInteraction = null;
      if (this.post.stats) type === InteractionType.Like ? this.post.stats.likes-- : this.post.stats.dislikes--;
    } else {
      if (this.post.stats) {
        if (this.post.userInteraction === InteractionType.Like) this.post.stats.likes--;
        if (this.post.userInteraction === InteractionType.Dislike) this.post.stats.dislikes--;
        type === InteractionType.Like ? this.post.stats.likes++ : this.post.stats.dislikes++;
      }
      this.post.userInteraction = type;
    }
    this.postsService.interact(this.post.id, type).subscribe({
      error: () => { if (this.post) this.post.userInteraction = oldInteraction; }
    });
  }

  get canEdit(): boolean {
    if (!this.post?.author || !this.currentUserId) return false;
    let authorId: any;
    if (typeof this.post.author === 'object') authorId = this.post.author.id;
    else authorId = this.post.author;
    return String(authorId) === String(this.currentUserId) || this.isAdmin;
  }

  get isOwnPost(): boolean {
    if (!this.post?.author || !this.currentUserId) return false;
    let authorId: any;
    if (typeof this.post.author === 'object') authorId = this.post.author.id;
    else authorId = this.post.author;
    return String(authorId) === String(this.currentUserId);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (isPlatformServer(this.platformId)) return;
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    const progress = document.getElementById('readingProgress');
    if (progress) progress.style.width = scrolled + '%';
  }

  goToEdit() {
    if (!this.post) return;
    this.router.navigate(['/public/posts/edit', this.post.id], {
      state: { postData: this.post }
    });
  }

  goToRelatedPost(item: RelatedPost) {
    this.router.navigate(['/public/posts/details', item.id]);
  }

  async onDelete() {
    if (!this.post) return;
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Post?',
      message: 'This action cannot be undone. Are you sure?',
      confirmText: 'DELETE',
      type: 'danger'
    });

    if (confirmed) {
      this.postsService.deletePost(this.post.id).subscribe({
        next: (res: any) => {
          if (res.isSuccess) {
            this.toastService.success('Post deleted successfully');
            this.router.navigate(['/public/home']);
          }
        }
      });
    }
  }

  // ✅ Housing Application Methods
  get isHousingPost(): boolean {
    // Check against PostType 7 (Housing)
    return this.post?.postType === 7;
  }

  navigateToHousingRequest() {
    if (!this.currentUserId) {
      this.toastService.warning('Please login to apply for housing.');
      return;
    }
    this.router.navigate(['/public/housing/agent-request'], {
      queryParams: { postId: this.post?.id }
    });
  }
}
