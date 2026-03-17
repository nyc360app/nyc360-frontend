import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PostService } from '../../services/post';
import { environment } from '../../../../../../environments/environment';
import { AuthService } from '../../../../../Authentication/Service/auth';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { InteractionType, Post, PostComment, RelatedPost } from '../../models/post-details';

@Component({
  selector: 'app-post-details',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, FormsModule],
  templateUrl: './post-details.html',
  styleUrls: ['./post-details.scss']
})
export class PostDetailsComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private postService = inject(PostService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);

  // البيانات
  post: Post | null = null;
  comments: PostComment[] = []; // التعليقات مفصولة هنا بناءً على الواجهة الجديدة
  relatedPosts: RelatedPost[] = [];

  // حالة الصفحة
  isLoading = true;
  errorMsg = '';

  // متغيرات التفاعل
  currentUserId: string | null = null;
  newCommentContent = '';
  activeReplyId: number | null = null;

  // لكي نستخدم الـ Enum في HTML
  protected readonly InteractionType = InteractionType;

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) this.currentUserId = user.id;
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadPostData(+id);
      }
    });
  }

  loadPostData(id: number) {
    this.isLoading = true;
    this.postService.getPostDetails(id).subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.post = res.data.post;

          // حسب الواجهة: التعليقات تأتي منفصلة في data.comments
          this.comments = res.data.comments || [];

          this.relatedPosts = res.data.relatedPosts || [];
        } else {
          this.errorMsg = 'Could not load post details.';
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'Connection error.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- منطق التعليقات ---

  submitComment() {
    if (!this.newCommentContent.trim() || !this.post || !this.currentUserId) return;

    this.postService.addComment(this.post.id, this.newCommentContent).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          // إضافة التعليق للمصفوفة المحلية
          this.comments.unshift(res.data);

          // تحديث العداد
          if (this.post?.stats) this.post.stats.comments++;

          this.newCommentContent = '';
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error(err)
    });
  }

  openReplyInput(commentId: number) {
    this.activeReplyId = this.activeReplyId === commentId ? null : commentId;
  }

  submitReply(parentComment: PostComment, content: string) {
    if (!content.trim() || !this.post || !this.currentUserId) return;

    this.postService.addComment(this.post.id, content, parentComment.id).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          if (!parentComment.replies) parentComment.replies = [];
          parentComment.replies.push(res.data);

          if (this.post?.stats) this.post.stats.comments++;

          this.activeReplyId = null;
          this.cdr.detectChanges();
        }
      }
    });
  }

  // --- منطق التفاعل (Like/Dislike) ---

  toggleInteraction(type: InteractionType) {
    if (!this.post || !this.currentUserId) {
      alert('Please login to interact with posts');
      return;
    }

    // حفظ الحالة القديمة للتراجع عند الخطأ
    const oldInteraction = this.post.currentUserInteraction;

    // تحديث الواجهة فوراً (Optimistic UI)
    // لاحظ استخدام currentUserInteraction حسب الواجهة الجديدة
    if (this.post.currentUserInteraction === type) {
      // إزالة التفاعل
      this.post.currentUserInteraction = InteractionType.None;
      if (this.post.stats) type === InteractionType.Like ? this.post.stats.likes-- : this.post.stats.dislikes--;
    } else {
      // تغيير التفاعل
      if (this.post.stats) {
        if (this.post.currentUserInteraction === InteractionType.Like) this.post.stats.likes--;
        if (this.post.currentUserInteraction === InteractionType.Dislike) this.post.stats.dislikes--;
        type === InteractionType.Like ? this.post.stats.likes++ : this.post.stats.dislikes++;
      }
      this.post.currentUserInteraction = type;
    }

    this.postService.interact(this.post.id, type).subscribe({
      error: () => {
        if (this.post) this.post.currentUserInteraction = oldInteraction;
        this.cdr.detectChanges();
      }
    });
  }

  openShareModal() {
    alert('Share functionality coming soon!');
  }

  // --- دوال الصور ---

  getMainImage(): string {
    if (this.post && this.post.attachments && this.post.attachments.length > 0) {
      const imgUrl = this.post.attachments[0].url;
      if (imgUrl.startsWith('http')) return imgUrl;
      return `${environment.apiBaseUrl2}/posts/${imgUrl}`;
    }
    return 'assets/images/park-placeholder.jpg';
  }

  getAuthorImage(author: any): string {
    if (author && author.imageUrl) {
      if (author.imageUrl.startsWith('http')) return author.imageUrl;
      return `${environment.apiBaseUrl2}/posts/${author.imageUrl}`;
    }
    return 'assets/images/default-avatar.png';
  }
}