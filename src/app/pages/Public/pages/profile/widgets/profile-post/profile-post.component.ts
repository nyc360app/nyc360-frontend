import { Component, Input, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Post, InteractionType } from '../../../posts/models/posts';
import { PostsService } from '../../../posts/services/posts';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { environment } from '../../../../../../environments/environment';
import { StripHtmlPipe } from '../../../../../../shared/pipes/strip-html.pipe';

@Component({
    selector: 'app-profile-post',
    standalone: true,
    imports: [CommonModule, FormsModule, StripHtmlPipe],
    templateUrl: './profile-post.component.html',
    styleUrls: ['./profile-post.component.scss']
})
export class ProfilePostComponent {
    @Input() post!: any;
    @Input() isOwner: boolean = false;
    @Input() currentUserId: string | null = null;
    @Input() displayName: string = '';
    @Input() authorImageUrl: string | null | undefined = '';

    protected readonly InteractionType = InteractionType;
    protected readonly environment = environment;

    private postsService = inject(PostsService);
    private router = inject(Router);
    private toastService = inject(ToastService);
    private cdr = inject(ChangeDetectorRef);

    // Sharing state
    showShareModal = false;
    shareCommentary = '';
    isSharing = false;

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

        // ✅ Redirection Logic: If this is a Job Post, go to Job Profile
        if (this.post?.category === 8 && this.post?.linkedResource) {
            this.router.navigate(['/public/job-profile', this.post.linkedResource.id]);
            return;
        }

        this.router.navigate(['/public/posts/details', postId]);
    }

    openShareModal(event?: Event) {
        if (event) event.stopPropagation();
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
        if (!this.post || !this.post.id) return;
        this.isSharing = true;

        this.postsService.sharePost(this.post.id, this.shareCommentary).subscribe({
            next: (res: any) => {
                this.isSharing = false;
                if (res.isSuccess) {
                    if (this.post.stats) this.post.stats.shares++;
                    this.toastService.success('Post shared successfully!');
                    this.closeShareModal();
                } else {
                    this.toastService.error(res.error?.message || 'Failed to share post.');
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

    // ✅ Job Data Helpers
    getArrangement(v: number) { return ['On-Site', 'Remote', 'Hybrid'][v] || 'On-Site'; }
    getType(v: number) { return ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'][v] || 'Full-time'; }
    getLevel(v: number) { return ['N/A', 'Junior', 'Mid', 'Senior', 'Executive'][v] || 'N/A'; }
    formatPrice(price: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(price);
    }

    // ✅ Housing Metadata Helper
    getHousingMetadata(content: string): any {
        if (!content) return null;
        try {
            const parts = content.split('\n\n\n');
            if (parts.length > 1) {
                const jsonStr = parts[parts.length - 1].trim();
                if (jsonStr.startsWith('{') && jsonStr.endsWith('}')) {
                    return JSON.parse(jsonStr);
                }
            }
        } catch (e) { }
        return null;
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

    getCleanContent(content: string): string {
        if (!content) return '';
        const parts = content.split('\n\n\n');
        return this.stripHtml(parts[0]);
    }

    navigateToProfile(username: string, event?: Event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        this.router.navigate(['/public/profile', username]);
    }
}
