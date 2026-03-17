import { Component, Input, Output, EventEmitter, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Post, InteractionType, PostComment } from '../../models/posts';
import { PostsService } from '../../services/posts';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { environment } from '../../../../../../environments/environment';
import { StripHtmlPipe } from '../../../../../../shared/pipes/strip-html.pipe';

@Component({
    selector: 'app-post-card',
    standalone: true,
    imports: [CommonModule, FormsModule, StripHtmlPipe],
    templateUrl: './post-card.component.html',
    styleUrls: ['./post-card.component.scss']
})
export class PostCardComponent {
    @Input() post!: any;
    @Input() isOwner: boolean = false;
    @Input() currentUserId: string | null = null;
    @Input() displayName: string = '';
    @Input() authorImageUrl: string | null | undefined = '';

    @Output() share = new EventEmitter<any>();

    protected readonly InteractionType = InteractionType;
    protected readonly environment = environment;

    private postsService = inject(PostsService);
    private router = inject(Router);
    private toastService = inject(ToastService);
    private cdr = inject(ChangeDetectorRef);

    toggleInteraction(post: any, type: InteractionType, event?: Event) {
        if (event) event.stopPropagation();
        if (!this.currentUserId) {
            this.toastService.warning('Please login to interact with posts.');
            return;
        }

        const oldInteraction = post.userInteraction;

        if (post.userInteraction === type) {
            post.userInteraction = null;
            if (post.stats) {
                if (type === InteractionType.Like) post.stats.likes--;
                else post.stats.dislikes--;
            }
        } else {
            if (post.stats) {
                if (post.userInteraction === InteractionType.Like) post.stats.likes--;
                if (post.userInteraction === InteractionType.Dislike) post.stats.dislikes--;
                if (type === InteractionType.Like) post.stats.likes++;
                else post.stats.dislikes++;
            }
            post.userInteraction = type;
        }

        this.postsService.interact(post.id, type).subscribe({
            error: () => {
                post.userInteraction = oldInteraction;
                this.cdr.detectChanges();
            }
        });

        this.cdr.detectChanges();
    }

    toggleComments(post: any, event?: Event) {
        if (event) event.stopPropagation();
        post.showComments = !post.showComments;
        if (post.showComments && (!post.comments || post.comments.length === 0)) {
            this.loadCommentsForPost(post);
        }
    }

    loadCommentsForPost(post: any) {
        this.postsService.getPostById(post.id).subscribe((res: any) => {
            if (res.isSuccess && res.data) {
                const fullData = res.data.post || res.data;
                post.comments = fullData.comments || res.data.comments || [];
                this.cdr.detectChanges();
            }
        });
    }

    submitComment(post: any, event?: Event) {
        if (event) event.stopPropagation();
        if (!post.newCommentContent?.trim() || !this.currentUserId) return;

        this.postsService.addComment(post.id, post.newCommentContent).subscribe({
            next: (res: any) => {
                if (res.isSuccess) {
                    if (!post.comments) post.comments = [];
                    post.comments.unshift(res.data);
                    if (post.stats) post.stats.comments++;
                    post.newCommentContent = '';
                    this.cdr.detectChanges();
                }
            }
        });
    }

    viewPostDetails(postId: any, event?: Event) {
        if (event) event.stopPropagation();
        if (postId === 'create') {
            this.router.navigate(['/public/posts/create']);
            return;
        }
        this.router.navigate(['/public/posts/details', postId]);
    }

    openShareModal(post: any, event?: Event) {
        if (event) event.stopPropagation();
        this.share.emit(post);
    }

    resolveImageUrl(url: string | undefined | null): string {
        if (!url || url.trim() === '') return 'assets/images/default-post.jpg';
        let cleanUrl = url.replace('@local://', '');
        if (cleanUrl.startsWith('http') || cleanUrl.startsWith('https') || cleanUrl.startsWith('data:')) return cleanUrl;
        if (cleanUrl.startsWith('posts/')) return `${environment.apiBaseUrl2}/${cleanUrl}`;
        return `${environment.apiBaseUrl3}/${cleanUrl}`;
    }

    getAuthorImage(author: any): string {
        if (author && author.imageUrl) {
            if (author.imageUrl.includes('http')) return author.imageUrl;
            return `${environment.apiBaseUrl2}/avatars/${author.imageUrl}`;
        }
        return 'assets/images/default-avatar.png';
    }

    getAuthorName(author: any): string {
        return author?.name || author?.username || 'User';
    }

    resolveImage(url: string | null | undefined): string {
        if (!url) return 'assets/images/default-avatar.png';
        if (url.includes('http') || url.startsWith('data:')) return url;
        return `${environment.apiBaseUrl2}/avatars/${url}`;
    }
}
