import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Added checks
import { environment } from '../../../../../../environments/environment';
import { AuthService } from '../../../../../Authentication/Service/auth';
import { CommunityRequestsComponent } from '../community-requests/community-requests';
import { CommunityProfileService } from '../../services/community-profile';
import { CommunityDetails, CommunityMember, Post } from '../../models/community-profile';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { PostService } from '../../services/post'; // Added
import { InteractionType, PostComment } from '../../models/post-details'; // Added
import { getCommunityTypeLabel } from '../../models/createcommunty';
import {
  CommunityRole,
  getCommunityErrorMessage,
  getCommunityRoleLabel,
  normalizeCommunityRole
} from '../../../../../../shared/utils/community-contract';
import { resolveCommunityMediaUrl } from '../../../../../../shared/utils/community-media';

// Extends Post locally to support UI states
interface ExtendedPost extends Omit<Post, 'stats'> {
  stats: { likes: number; comments: number; shares: number; dislikes?: number };
  comments?: PostComment[];
  currentUserInteraction?: number;
  showComments?: boolean;
  newCommentContent?: string;
  activeReplyId?: number | null;
}

@Component({
  selector: 'app-community-profile',
  standalone: true,
  imports: [CommonModule, CommunityRequestsComponent, RouterLink, FormsModule],
  templateUrl: './community-profile.html',
  styleUrls: ['./community-profile.scss']
})
export class CommunityProfileComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private profileService = inject(CommunityProfileService);
  private postService = inject(PostService); // Added
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private location = inject(Location);
  private toastService = inject(ToastService);
  protected readonly environment = environment;
  protected readonly InteractionType = InteractionType; // Expose enum

  // Data
  community: CommunityDetails | null = null;
  posts: ExtendedPost[] = [];
  members: CommunityMember[] = [];

  // Roles & Permissions
  ownerId: number = 0;
  memberRole: number | null = null;
  hasPendingJoinRequest = false;
  currentUserId: string | null = null; // Added

  // UI State
  activeTab: string = 'feed';
  isLoading = false;
  isMembersLoading = false;
  isJoinLoading = false;
  shareSuccess = false;
  brokenCommunityLogo = false;
  brokenCommunityCover = false;

  // Getters for Logic
  get isJoined(): boolean {
    return this.normalizedMemberRole !== null;
  }

  get normalizedMemberRole(): CommunityRole | null {
    return normalizeCommunityRole(this.memberRole);
  }

  get isLeader(): boolean {
    return this.normalizedMemberRole === CommunityRole.Leader;
  }

  get isModerator(): boolean {
    return this.normalizedMemberRole === CommunityRole.Moderator;
  }

  get isVolunteer(): boolean {
    return this.normalizedMemberRole === CommunityRole.Volunteer;
  }

  get canManageCommunity(): boolean {
    return this.isLeader;
  }

  get canManageRequests(): boolean {
    return this.isLeader;
  }

  get canModerateCommunity(): boolean {
    return this.isLeader || this.isModerator;
  }

  get canPublishInCommunity(): boolean {
    if (!this.isJoined || !this.community) return false;

    if (this.community.anyoneCanPost !== false) {
      return true;
    }

    return this.isLeader || this.isVolunteer;
  }

  get publishAccessHint(): string {
    if (this.isModerator) {
      return 'Moderators can moderate discussions, but they cannot publish in this community.';
    }

    return 'Only the community leader or approved volunteers can publish in this community.';
  }

  get currentRoleLabel(): string {
    return getCommunityRoleLabel(this.memberRole);
  }

  get communityTypeLabel(): string {
    return getCommunityTypeLabel(this.community?.type);
  }

  get isFeedRestricted(): boolean {
    return !!this.community?.isPrivate && !this.isJoined;
  }

  get isMembersRestricted(): boolean {
    return !!this.community?.isPrivate && !this.isJoined;
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) this.currentUserId = user.id || user.userId;
    });

    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) this.loadData(slug);
    });
  }

  loadData(slug: string) {
    this.isLoading = true;
    this.profileService.getCommunityBySlug(slug).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const data = res.data || res.Data;
        if ((res.isSuccess || res.IsSuccess) && data) {
          this.brokenCommunityLogo = false;
          this.brokenCommunityCover = false;
          this.community = data.community;
          this.ownerId = data.ownerId;
          this.memberRole = data.memberRole ? Number(data.memberRole) : null;
          this.hasPendingJoinRequest = !!(data.pendingJoinRequest || data.hasPendingJoinRequest);

          if (data.posts && Array.isArray(data.posts.data)) {
            // Map to ExtendedPost
            this.posts = data.posts.data.map((p: any) => ({
              ...p,
              content: this.stripHtml(p.content),
              comments: [], // Init empty
              currentUserInteraction: p.currentUserInteraction || InteractionType.None,
              showComments: false,
              newCommentContent: ''
            }));
          } else {
            this.posts = [];
          }
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadMembers() {
    if (!this.community) return;
    this.activeTab = 'members';
    this.isMembersLoading = true;
    this.profileService.getCommunityMembers(this.community.id).subscribe({
      next: (res) => {
        this.isMembersLoading = false;
        if (res.isSuccess && Array.isArray(res.data)) {
          this.members = res.data;
        } else if (res.isSuccess && Array.isArray((res as any).data)) {
          this.members = (res as any).data;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isMembersLoading = false;
        this.toastService.error(getCommunityErrorMessage(error, 'Unable to load community members.'));
        this.cdr.detectChanges();
      }
    });
  }

  showFeedTab(): void {
    this.activeTab = 'feed';
  }

  showAboutTab(): void {
    this.activeTab = 'about';
  }

  // --- Actions ---

  onJoinCommunity() {
    if (!this.community || this.isJoined || this.hasPendingJoinRequest) return;

    this.isJoinLoading = true;
    this.profileService.joinCommunity(this.community.id).subscribe({
      next: (res) => {
        this.isJoinLoading = false;
        if (res.isSuccess) {
          this.hasPendingJoinRequest = true;
          this.toastService.success('Your join request was sent to the community leader.');
        } else {
          this.toastService.error(getCommunityErrorMessage(res, 'Failed to send the join request.'));
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isJoinLoading = false;
        this.toastService.error(getCommunityErrorMessage(error, 'An error occurred while joining the community.'));
      }
    });
  }

  onLeaveCommunity() {
    if (!this.community || !confirm('Are you sure you want to leave this community?')) return;

    this.isJoinLoading = true;
    this.profileService.leaveCommunity(this.community.id).subscribe({
      next: (res) => {
        this.isJoinLoading = false;
        if (res.isSuccess) {
          this.memberRole = null;
          this.hasPendingJoinRequest = false;
          this.toastService.success('Your community request was removed.');
        } else {
          this.toastService.error(getCommunityErrorMessage(res, 'Failed to leave the community.'));
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isJoinLoading = false;
        this.toastService.error(getCommunityErrorMessage(error, 'Unable to leave the community.'));
        this.cdr.detectChanges();
      }
    });
  }

  onRemoveMember(memberId: number) {
    if (!this.community || !this.isLeader || !confirm('Are you sure you want to remove this member?')) return;

    this.profileService.removeMember(this.community.id, memberId).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.members = this.members.filter(m => m.userId !== memberId);
          this.toastService.success('Member removed successfully.');
        } else {
          this.toastService.error(getCommunityErrorMessage(res, 'Failed to remove the member.'));
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.toastService.error(getCommunityErrorMessage(error, 'Error removing member.'));
        this.cdr.detectChanges();
      }
    });
  }

  // --- Interaction Logic (Likes/Comments) ---

  toggleInteraction(post: ExtendedPost, type: InteractionType) {
    if (!this.currentUserId) {
      alert('Please login to interact');
      return;
    }

    const oldInteraction = post.currentUserInteraction;

    // Optimistic Update
    if (post.currentUserInteraction === type) {
      post.currentUserInteraction = InteractionType.None;
      if (post.stats) {
        if (type === InteractionType.Like) {
          post.stats.likes--;
        } else {
          post.stats.dislikes = (post.stats.dislikes || 0) - 1;
        }
      }
    } else {
      if (post.stats) {
        if (post.currentUserInteraction === InteractionType.Like) post.stats.likes--;
        if (post.currentUserInteraction === InteractionType.Dislike) {
          post.stats.dislikes = (post.stats.dislikes || 0) - 1;
        }

        if (type === InteractionType.Like) {
          post.stats.likes++;
        } else {
          post.stats.dislikes = (post.stats.dislikes || 0) + 1;
        }
      }
      post.currentUserInteraction = type;
    }

    this.postService.interact(post.id, type).subscribe({
      error: () => {
        post.currentUserInteraction = oldInteraction;
        this.cdr.detectChanges();
      }
    });
  }

  toggleComments(post: ExtendedPost) {
    post.showComments = !post.showComments;
    // Optionally load comments here if they were missing or empty?
    if (post.showComments && (!post.comments || post.comments.length === 0)) {
      this.loadCommentsForPost(post);
    }
  }

  loadCommentsForPost(post: ExtendedPost) {
    // Note: Assuming PostService has logic to get comments for a post
    // If not, we might reuse getPostDetails but that's heavy.
    // Ideally we assume an endpoint or we just load details.
    // For now, let's try to get details just to extract comments
    this.postService.getPostDetails(post.id).subscribe((res) => {
      if (res.isSuccess && res.data && res.data.comments) {
        post.comments = res.data.comments;
        this.cdr.detectChanges();
      }
    });
  }

  submitComment(post: ExtendedPost) {
    if (!post.newCommentContent?.trim()) return;

    this.postService.addComment(post.id, post.newCommentContent).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          if (!post.comments) post.comments = [];
          post.comments.unshift(res.data);
          if (post.stats) post.stats.comments++;
          post.newCommentContent = '';
          post.showComments = true;
          this.cdr.detectChanges();
        }
      }
    });
  }

  openReplyInput(post: ExtendedPost, commentId: number) {
    post.activeReplyId = post.activeReplyId === commentId ? null : commentId;
  }

  submitReply(post: ExtendedPost, parentComment: PostComment, content: string) {
    if (!content.trim()) return;

    this.postService.addComment(post.id, content, parentComment.id).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          if (!parentComment.replies) parentComment.replies = [];
          parentComment.replies.push(res.data);
          if (post.stats) post.stats.comments++;
          post.activeReplyId = null;
          this.cdr.detectChanges();
        }
      }
    });
  }


  // --- Professional Share Function ---
  onShare() {
    const url = window.location.href;
    const title = this.community?.name || 'Join this Community on NYC360';
    const text = this.community?.description || 'Check out this amazing community!';

    // 1. Try Native Share (Mobile)
    if (navigator.share) {
      navigator.share({
        title: title,
        text: text,
        url: url
      }).catch(err => console.log('Error sharing', err));
    } else {
      // 2. Fallback: Copy to Clipboard (Desktop)
      this.copyToClipboard(url);
    }
  }

  private copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.shareSuccess = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.shareSuccess = false;
        this.cdr.detectChanges();
      }, 2000);
    });
  }

  // --- Helpers ---
  hasCommunityLogo(): boolean {
    return !!this.cleanText(this.community?.imageUrl) && !this.brokenCommunityLogo;
  }

  hasCommunityCover(): boolean {
    return !!this.cleanText(this.community?.coverUrl) && !this.brokenCommunityCover;
  }

  markCommunityLogoBroken(): void {
    this.brokenCommunityLogo = true;
  }

  markCommunityCoverBroken(): void {
    this.brokenCommunityCover = true;
  }

  getCommunityInitials(name?: string | null): string {
    const parts = this.cleanText(name)
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return (parts[0] || 'NY').slice(0, 2).toUpperCase();
  }

  resolveCommunityImage(url?: string): string {
    return resolveCommunityMediaUrl(url, 'assets/images/placeholder-cover.jpg');
  }

  resolvePostImage(url?: string): string {
    if (!url || url.trim() === '') return '';

    // تنظيف المسار
    const cleanUrl = url.replace('@local://', '');

    // لو لينك خارجي
    if (cleanUrl.startsWith('http')) return cleanUrl;

    // لو صورة من السيرفر (posts)
    return `${this.environment.apiBaseUrl3}/${cleanUrl}`;
  }

  resolveUserAvatar(url?: string | null): string {
    if (!url) return 'assets/images/default-avatar.png';
    if (url.includes('http')) return url;
    return `${environment.apiBaseUrl2}/avatars/${url}`;
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

  getAuthorName(author: any): string {
    if (!author) return 'NYC360 Member';
    return typeof author === 'string' ? author : author.name;
  }

  getMemberRoleLabel(member: CommunityMember): string {
    return getCommunityRoleLabel(member.role);
  }

  private cleanText(value: string | null | undefined): string {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
