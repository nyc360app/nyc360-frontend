import { Component, OnInit, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../../environments/environment';
import { CommunityService } from '../../services/community';
import { CommunityPost, CommunitySuggestion } from '../../models/community';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../../../Authentication/Service/auth';
import { UserInfo } from '../../../../../Authentication/models/user-info';
import { ToastService } from '../../../../../../shared/services/toast.service';

import { VerificationModalComponent } from '../../../../../../shared/components/verification-modal/verification-modal';
import {
  CommunityLeaderApplicationModalComponent,
  CommunityLeaderApplicationPayload
} from '../../../../../../shared/components/community-leader-application-modal/community-leader-application-modal';
import { buildCommunityD01BadgeOptions, isCommunityLeaderTag } from '../../../../../../shared/utils/community-badge-policy';
import { CommunityDepartmentHeroComponent } from '../../../../Widgets/community-department-hero/community-department-hero.component';


@Component({
  selector: 'app-community',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, VerificationModalComponent, CommunityLeaderApplicationModalComponent, CommunityDepartmentHeroComponent],
  templateUrl: './community.html',
  styleUrls: ['./community.scss']
})
export class CommunityComponent implements OnInit {

  private authService = inject(AuthService);
  private communityService = inject(CommunityService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private toastService = inject(ToastService);
  protected readonly environment = environment;

  // UI State
  isActivityDropdownOpen = false;
  activeSubMenu: string | null = null;
  private activityDropdownCloseTimer: ReturnType<typeof setTimeout> | null = null;

  // Data Containers
  suggestions: CommunitySuggestion[] = [];
  posts: CommunityPost[] = [];
  featuredPost: CommunityPost | null = null;
  userTags: any[] = []; // Tags for permission check
  communityPublicBadgeTags: any[] = buildCommunityD01BadgeOptions([]);
  verificationModalOccupations: any[] = [];
  currentUserInfo: UserInfo | null = null;
  isVerificationModalOpen = false;
  isLeaderApplicationModalOpen = false;
  communitySearchTerm = '';
  private brokenCommunityAvatarIds = new Set<number>();

  get hasCommunityLeaderAccess(): boolean {
    // 1. Check if SuperAdmin
    if (this.authService.hasRole('SuperAdmin')) return true;

    // 2. Check approved tags from authenticated user profile only.
    if (this.currentUserInfo && this.currentUserInfo.tags) {
      return this.currentUserInfo.tags.some((t: any) => isCommunityLeaderTag(t));
    }

    return false;
  }

  openVerificationModal(preferredOccupationName: string | null = null) {
    this.verificationModalOccupations = this.prioritizeVerificationOccupations(preferredOccupationName);
    this.isVerificationModalOpen = true;
    this.isActivityDropdownOpen = false; // Close dropdown
  }

  openLeaderApplicationModal(): void {
    this.isVerificationModalOpen = false;
    this.verificationModalOccupations = [];
    this.isLeaderApplicationModalOpen = true;
    this.isActivityDropdownOpen = false;
    this.activeSubMenu = null;
  }

  closeLeaderApplicationModal(): void {
    this.isLeaderApplicationModalOpen = false;
  }

  onLeaderApplicationSubmitted(_payload: CommunityLeaderApplicationPayload): void {
    this.toastService.success('Community leader application submitted. Avg response time: 4 hours.');
    this.closeLeaderApplicationModal();
  }

  openVerificationFromDropdown(preferredOccupationName: string | null = null) {
    const normalized = this.normalizeOccupationNameForMatch(preferredOccupationName);

    // Fallback guard: if cached template still calls this method for "Apply for Community Leader",
    // redirect to the dedicated leader-application modal instead of verification modal.
    if (!normalized || normalized.includes('leader')) {
      this.openLeaderApplicationModal();
      return;
    }

    this.openVerificationModal(preferredOccupationName);
    this.activeSubMenu = null;
  }

  closeVerificationModal() {
    this.isVerificationModalOpen = false;
    this.verificationModalOccupations = [];
  }

  onVerified() {
    // Reload User Info to get the new tag immediately
    this.authService.fetchFullUserInfo().subscribe();
    this.closeVerificationModal();
  }

  isLoading = true;

  ngOnInit() {
    this.loadData();

    // Subscribe to User Info changes to update UI automatically
    this.authService.fullUserInfo$.subscribe((info: UserInfo | null) => {
      this.currentUserInfo = info;
      this.cdr.detectChanges();
    });
  }

  loadData() {
    this.isLoading = true;
    this.communityService.getCommunityHome(1, 20).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.isSuccess && res.data) {
          // 1. Communities Cards
          this.suggestions = (Array.isArray(res.data.suggestions) ? res.data.suggestions : [])
            .map((item) => this.normalizeSuggestion(item))
            .filter((item): item is CommunitySuggestion => !!item);

          // 2. Feed Posts
          const allPosts = (Array.isArray(res.data.feed?.data) ? res.data.feed.data : [])
            .map((item) => this.normalizePost(item))
            .filter((item): item is CommunityPost => !!item);
          if (allPosts.length > 0) {
            this.featuredPost = allPosts[0];
            this.posts = allPosts.slice(1);
          } else {
            this.featuredPost = null;
            this.posts = [];
          }

          // 3. Local Tags (Optional fallback)
          if (res.data.tags) {
            this.userTags = res.data.tags;
          }
          this.communityPublicBadgeTags = buildCommunityD01BadgeOptions(res.data.tags || []);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onCommunitySearch(): void {
    const search = this.communitySearchTerm.trim();
    this.router.navigate(
      ['/public/discover'],
      { queryParams: search ? { search } : {} }
    );
  }

  formatCompactNumber(value: number | null | undefined): string {
    const safeValue = Number(value || 0);

    return new Intl.NumberFormat('en-US', {
      notation: safeValue >= 1000 ? 'compact' : 'standard',
      maximumFractionDigits: 1
    }).format(safeValue);
  }

  formatPostDate(value?: string | null): string {
    if (!value) return 'Recent';

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Recent';

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfPostDay = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    const diffDays = Math.round((startOfToday.getTime() - startOfPostDay.getTime()) / 86400000);

    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(parsed);
  }

  getExcerpt(value: string | null | undefined, maxLength: number): string {
    const text = this.cleanText(value);
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trim()}...`;
  }

  get hasCommunitySuggestions(): boolean {
    return this.suggestions.length > 0;
  }

  hasFeaturedMedia(post: CommunityPost | null | undefined): boolean {
    return !!post?.attachments?.some((attachment) => !!this.cleanText(attachment?.url));
  }

  getFeaturedTitle(post: CommunityPost | null | undefined): string {
    return this.cleanText(post?.title) || 'Community Update';
  }

  getFeaturedExcerpt(post: CommunityPost | null | undefined, maxLength: number): string {
    return this.getExcerpt(post?.content, maxLength) || 'A new update is available in the community feed.';
  }

  isCompactTextFeatured(post: CommunityPost | null | undefined): boolean {
    return this.getFeaturedTitle(post).length <= 26 && this.getFeaturedExcerpt(post, 300).length <= 90;
  }

  get discussionPosts(): CommunityPost[] {
    if (this.posts.length > 0) {
      return this.posts.slice(0, 3);
    }
    return this.featuredPost ? [this.featuredPost] : [];
  }

  get supportCards(): Array<{ post: CommunityPost; label: 'QUESTION' | 'Help' }> {
    const primary = this.posts.slice(3, 5);
    const fallback = this.posts.slice(0, 2);
    const source = (primary.length > 0 ? primary : fallback).slice(0, 2);

    return source.map((post, index) => ({
      post,
      label: this.inferSupportLabel(post, index)
    }));
  }

  private inferSupportLabel(post: CommunityPost, index: number): 'QUESTION' | 'Help' {
    const text = [
      post?.title || '',
      post?.content || '',
      ...(post?.tags || [])
    ].join(' ').toLowerCase();

    if (text.includes('help')) return 'Help';
    if (text.includes('question') || text.includes('?')) return 'QUESTION';

    return index === 0 ? 'QUESTION' : 'Help';
  }

  getPostAuthorName(post: CommunityPost): string {
    if (typeof post?.author === 'string') return post.author;
    return this.cleanText(post?.author?.name) || 'Community Member';
  }

  get leaderApplicationFullName(): string {
    const firstName = String(this.currentUserInfo?.firstName || '').trim();
    const lastName = String(this.currentUserInfo?.lastName || '').trim();
    return `${firstName} ${lastName}`.trim();
  }

  get leaderApplicationEmail(): string {
    return String(this.currentUserInfo?.email || '').trim();
  }

  get leaderApplicationPhoneNumber(): string {
    return String(this.currentUserInfo?.phoneNumber || '').trim();
  }

  // دالة الانضمام
  joinCommunity(comm: CommunitySuggestion) {
    if (comm.isJoined) return; // منع التكرار

    comm.isLoadingJoin = true; // تفعيل اللودينج

    // نمرر comm.id (رقم) للسيرفس
    this.communityService.joinCommunity(comm.id).subscribe({
      next: (res) => {
        comm.isLoadingJoin = false;
        if (res.isSuccess) {
          comm.isJoined = true; // تغيير الحالة لـ Joined
          comm.memberCount++; // زيادة العداد
          this.toastService.success(`You joined ${comm.name}.`);
        } else {
          this.toastService.error(res.error?.message || 'Could not join this community.');
        }
        this.cdr.detectChanges();
      },
      error: () => {
        comm.isLoadingJoin = false;
        this.toastService.error('Network error. Please try again.');
        this.cdr.detectChanges();
      }
    });
  }

  // --- Image Resolvers ---

  markCommunityAvatarBroken(communityId: number): void {
    this.brokenCommunityAvatarIds.add(communityId);
  }

  hasCommunityAvatar(comm: CommunitySuggestion): boolean {
    return !!this.cleanText(comm?.avatarUrl) && !this.brokenCommunityAvatarIds.has(comm.id);
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

  getCommunityRoute(comm: CommunitySuggestion): any[] | null {
    return this.cleanText(comm?.slug) ? ['/public/community', comm.slug] : null;
  }

  resolveCommunityAvatar(url?: string): string {
    if (!url) return 'assets/images/default-group.png';
    if (url.includes('http')) return url;
    return `${environment.apiBaseUrl2}/communities/${url}`;
  }

  resolvePostImage(url?: string): string {
    if (!url || url.trim() === '') return 'assets/images/nyc-city.jpg';

    // تنظيف المسار
    const cleanUrl = url.replace('@local://', '');

    // لو لينك خارجي
    if (cleanUrl.startsWith('http')) return cleanUrl;

    // لو صورة من السيرفر (posts)
    return `${this.environment.apiBaseUrl3}/${cleanUrl}`;
  }

  private normalizeSuggestion(item: any): CommunitySuggestion | null {
    const name = this.cleanText(item?.name);
    if (!name) return null;

    return {
      ...item,
      name,
      slug: this.cleanText(item?.slug),
      description: this.normalizeCommunityDescription(item?.description, name),
      avatarUrl: this.cleanText(item?.avatarUrl),
      memberCount: Math.max(0, Number(item?.memberCount || 0)),
      isPrivate: !!item?.isPrivate,
      isJoined: !!item?.isJoined,
      isLoadingJoin: false
    };
  }

  private normalizePost(item: any): CommunityPost | null {
    const title = this.cleanText(item?.title);
    const content = this.cleanText(item?.content);
    const attachments = Array.isArray(item?.attachments)
      ? item.attachments
        .filter((attachment: any) => !!this.cleanText(attachment?.url))
        .map((attachment: any) => ({
          id: Number(attachment?.id || 0),
          url: this.cleanText(attachment?.url)
        }))
      : [];

    if (!title && !content && attachments.length === 0) {
      return null;
    }

    return {
      ...item,
      title,
      content,
      attachments,
      stats: {
        views: 0,
        likes: 0,
        dislikes: 0,
        comments: 0,
        shares: 0,
        ...(item?.stats || {})
      },
      tags: Array.isArray(item?.tags) ? item.tags.filter(Boolean) : []
    };
  }

  private normalizeCommunityDescription(value: string | null | undefined, name: string): string {
    const text = this.cleanText(value);
    if (!text) {
      return 'Join neighbors and local members in this community.';
    }

    const words = text.toLowerCase().split(/\s+/).filter(Boolean);
    const uniqueRatio = words.length ? new Set(words).size / words.length : 1;

    if (text.toLowerCase() === name.toLowerCase() || uniqueRatio < 0.45) {
      return 'Join neighbors and local members in this community.';
    }

    return text;
  }

  private cleanText(value: string | null | undefined): string {
    return String(value || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private prioritizeVerificationOccupations(preferredOccupationName: string | null): any[] {
    const source = Array.isArray(this.communityPublicBadgeTags) ? [...this.communityPublicBadgeTags] : [];
    if (!source.length) return source;

    const preferred = this.normalizeOccupationNameForMatch(preferredOccupationName);
    if (!preferred) return source;

    const preferredTokens = preferred.split(' ').filter((token) => token.length > 2);
    if (!preferredTokens.length) return source;

    let bestIndex = -1;
    let bestScore = 0;

    source.forEach((occupation, index) => {
      const normalizedName = this.normalizeOccupationNameForMatch(occupation?.name ?? occupation?.Name);
      const score = preferredTokens.reduce((sum, token) => (
        normalizedName.includes(token) ? sum + 1 : sum
      ), 0);

      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    if (bestIndex <= 0) return source;

    const [preferredItem] = source.splice(bestIndex, 1);
    source.unshift(preferredItem);
    return source;
  }

  private normalizeOccupationNameForMatch(value: string | null | undefined): string {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  toggleActivityDropdown(event: Event) {
    event.stopPropagation();
    this.clearActivityDropdownCloseTimer();
    this.isActivityDropdownOpen = !this.isActivityDropdownOpen;
    if (!this.isActivityDropdownOpen) {
      this.activeSubMenu = null;
    }
  }

  openActivityDropdown() {
    this.clearActivityDropdownCloseTimer();
    this.isActivityDropdownOpen = true;
  }

  scheduleCloseActivityDropdown() {
    this.clearActivityDropdownCloseTimer();
    this.activityDropdownCloseTimer = setTimeout(() => {
      this.closeActivityDropdown();
    }, 120);
  }

  private clearActivityDropdownCloseTimer() {
    if (this.activityDropdownCloseTimer) {
      clearTimeout(this.activityDropdownCloseTimer);
      this.activityDropdownCloseTimer = null;
    }
  }

  toggleSubMenu(menuName: string, event: Event) {
    event.stopPropagation();
    this.activeSubMenu = this.activeSubMenu === menuName ? null : menuName;
  }

  closeActivityDropdown() {
    this.clearActivityDropdownCloseTimer();
    this.isActivityDropdownOpen = false;
    this.activeSubMenu = null;
  }

  @HostListener('document:click')
  closeDropdownHandler() {
    this.closeActivityDropdown();
  }
}
