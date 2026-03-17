import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { ProfileService } from '../service/profile';
import { AuthService } from '../../../../Authentication/Service/auth';
import { UserProfileData, SocialPlatform } from '../models/profile';
import { Post, InteractionType, PostComment } from '../../posts/models/posts';
import { ToastService } from '../../../../../shared/services/toast.service';
import { PostsService } from '../../posts/services/posts';
import { CATEGORY_LIST } from '../../../../models/category-list';
import { GlobalLoaderService } from '../../../../../shared/components/global-loader/global-loader.service';

export interface DashboardCard {
  type: string;
  status: string;
  title: string;
  sub: string;
  detail: string;
  action: string;
  isEvent?: boolean;
}

import { ProfilePostComponent } from '../widgets/profile-post/profile-post.component';
import { ProfileHeaderComponent } from '../widgets/profile-header/profile-header.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ProfilePostComponent, ProfileHeaderComponent],
  providers: [DatePipe],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class ProfileComponent implements OnInit {

  protected readonly environment = environment;
  protected readonly InteractionType = InteractionType;

  private profileService = inject(ProfileService);
  private postsService = inject(PostsService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private datePipe = inject(DatePipe);
  private zone = inject(NgZone);
  private toastService = inject(ToastService);
  private loaderService = inject(GlobalLoaderService);

  // --- State ---
  user: UserProfileData | null = null;
  savedPosts: Post[] = [];
  currentUsername: string = '';
  currentUserId: string | null = null;

  isLoading = true;
  isSavedLoading = false;
  isOwner = false;
  activeTab = 'posts';

  categories = CATEGORY_LIST;

  // UI Data
  socialPlatforms = [
    { id: SocialPlatform.Facebook, name: 'Facebook', icon: 'bi-facebook' },
    { id: SocialPlatform.Twitter, name: 'Twitter', icon: 'bi-twitter-x' },
    { id: SocialPlatform.LinkedIn, name: 'LinkedIn', icon: 'bi-linkedin' },
    { id: SocialPlatform.Github, name: 'Github', icon: 'bi-github' },
    { id: SocialPlatform.Website, name: 'Website', icon: 'bi-globe' },
    { id: SocialPlatform.Other, name: 'Other', icon: 'bi-link-45deg' }
  ];

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUserId = user.id || (user as any).userId;
      }
    });

    this.route.paramMap.subscribe(params => {
      const username = params.get('username');
      this.resolveIdentityAndLoad(username);
    });
  }

  resolveIdentityAndLoad(routeUsername: string | null) {
    const currentUser = this.authService.currentUser$.value;
    let targetUsername = routeUsername;

    if (!targetUsername && currentUser) {
      targetUsername = currentUser.username;
    }

    this.isOwner = !!(currentUser && targetUsername && currentUser.username?.toLowerCase() === targetUsername.toLowerCase());
    this.currentUsername = targetUsername || '';

    if (this.currentUsername) {
      this.loadProfile(this.currentUsername);
    } else {
      this.zone.run(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    }
  }

  loadProfile(username: string) {
    this.isLoading = true;
    this.loaderService.show();
    this.profileService.getProfile(username).subscribe({
      next: (res) => {
        this.zone.run(() => {
          this.isLoading = false;
          this.loaderService.hide();
          if (res.isSuccess && res.data) {
            this.user = res.data;
            if (this.user.recentPosts) {
              this.user.recentPosts = (this.user.recentPosts as any[]).map(p => this.normalizePostData(p)) as any;
            }
            this.initBasicInfo();
          }
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.isLoading = false;
          this.loaderService.hide();
          this.cdr.detectChanges();
        });
      }
    });
  }

  normalizePostData(post: Post): Post {
    if (!post.stats) post.stats = { views: 0, likes: 0, dislikes: 0, comments: 0, shares: 0 };
    if (post.currentUserInteraction !== undefined) post.userInteraction = post.currentUserInteraction;
    (post as any).showComments = false;
    (post as any).newCommentContent = '';
    return post;
  }

  switchTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'saved' && this.isOwner) this.loadSavedPosts();
    if (tab === 'manage' && this.isOwner) this.initBasicInfo();
  }

  loadSavedPosts() {
    this.isSavedLoading = true;
    this.loaderService.show();
    this.profileService.getSavedPosts().subscribe({
      next: (res) => {
        this.zone.run(() => {
          this.isSavedLoading = false;
          this.loaderService.hide();
          if (res.isSuccess) {
            this.savedPosts = (res.data || []).map((p: any) => this.normalizePostData(p));
          }
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.isSavedLoading = false;
          this.loaderService.hide();
          this.cdr.detectChanges();
        });
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

  navigateToCommunity(comm: any) {
    if (!comm) return;
    const identifier = comm.slug || comm.id;
    this.router.navigate(['/public/community', identifier]);
  }

  // --- Manage Profile Actions ---

  basicInfo: any = {};
  initBasicInfo() {
    if (this.user) {
      this.basicInfo = {
        FirstName: this.user.firstName,
        LastName: this.user.lastName,
        Headline: this.user.headline,
        Bio: this.user.bio,
        LocationId: this.user.locationId || 1
      };
    }
  }

  saveBasicInfo() {
    if (!this.basicInfo.FirstName || !this.basicInfo.LastName) {
      this.toastService.warning('Name is required.');
      return;
    }
    this.profileService.updateBasicInfo(this.basicInfo).subscribe((res: any) => {
      if (res.isSuccess) {
        this.toastService.success('Profile updated!');
        this.loadProfile(this.currentUsername);
      } else {
        this.toastService.error('Failed to update profile info.');
      }
    });
  }

  // Social Links
  newLink = { platform: 0, url: '' };
  isAddingLink = false;
  editingLink: any = null;

  addSocialLink() {
    if (!this.newLink.url) return;
    this.profileService.addSocialLink({
      Platform: Number(this.newLink.platform),
      Url: this.newLink.url
    }).subscribe((res: any) => {
      if (res.isSuccess) {
        this.toastService.success('Link added!');
        this.newLink = { platform: 0, url: '' };
        this.isAddingLink = false;
        this.loadProfile(this.currentUsername);
      }
    });
  }

  deleteLink(id: number) {
    if (!confirm('Are you sure you want to remove this link?')) return;
    this.profileService.deleteSocialLink(id).subscribe((res: any) => {
      if (res.isSuccess) {
        this.toastService.success('Link removed.');
        this.loadProfile(this.currentUsername);
      }
    });
  }

  // Experience
  newPosition = { Title: '', Company: '', StartDate: new Date().toISOString(), IsCurrent: true };
  isAddingPos = false;
  editingPos: any = null;

  addPosition() {
    if (!this.newPosition.Title || !this.newPosition.Company) return;
    this.profileService.addPosition(this.newPosition).subscribe((res: any) => {
      if (res.isSuccess) {
        this.toastService.success('Experience added!');
        this.isAddingPos = false;
        this.newPosition = { Title: '', Company: '', StartDate: new Date().toISOString(), IsCurrent: true };
        this.loadProfile(this.currentUsername);
      }
    });
  }

  deletePosition(id: number) {
    if (!confirm('Delete this experience?')) return;
    this.profileService.deletePosition(id).subscribe((res: any) => {
      if (res.isSuccess) {
        this.toastService.success('Experience removed.');
        this.loadProfile(this.currentUsername);
      }
    });
  }

  // Education
  newEdu = { School: '', Degree: '', FieldOfStudy: '', StartDate: new Date().toISOString() };
  isAddingEdu = false;
  editingEdu: any = null;

  addEducation() {
    if (!this.newEdu.School) return;
    this.profileService.addEducation(this.newEdu).subscribe((res: any) => {
      if (res.isSuccess) {
        this.toastService.success('Education added!');
        this.isAddingEdu = false;
        this.newEdu = { School: '', Degree: '', FieldOfStudy: '', StartDate: new Date().toISOString() };
        this.loadProfile(this.currentUsername);
      }
    });
  }

  deleteEducation(id: number) {
    if (!confirm('Delete this academic record?')) return;
    this.profileService.deleteEducation(id).subscribe((res: any) => {
      if (res.isSuccess) {
        this.toastService.success('Education removed.');
        this.loadProfile(this.currentUsername);
      }
    });
  }

  shareProfile() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => this.toastService.success('Profile link copied to clipboard!'));
  }

  // --- Helpers ---
  resolveImage(url: string | null | undefined): string {
    if (!url) return 'assets/images/default-avatar.png';
    if (url.includes('http') || url.startsWith('data:')) return url;
    return `${environment.apiBaseUrl2}/avatars/${url}`;
  }

  resolveCover(url: string | null | undefined): string {
    if (!url) return 'assets/images/default-cover.jpg';
    if (url.includes('http') || url.startsWith('data:')) return url;
    return `${environment.apiBaseUrl2}/covers/${url}`;
  }

  resolveImageUrl(url: string | undefined | null): string {
    if (!url || url.trim() === '') return 'assets/images/default-post.jpg';

    let cleanUrl = url.replace('@local://', '');

    if (cleanUrl.startsWith('http') || cleanUrl.startsWith('https') || cleanUrl.startsWith('data:')) {
      return cleanUrl;
    }

    if (cleanUrl.startsWith('posts/')) {
      return `${this.environment.apiBaseUrl2}/${cleanUrl}`;
    }

    return `${this.environment.apiBaseUrl3}/${cleanUrl}`;
  }

  resolveAttachmentUrl(url: string | null | undefined): string {
    return this.resolveImageUrl(url);
  }

  getAuthorImage(author: any): string {
    if (author && author.imageUrl) {
      if (author.imageUrl.includes('http')) return author.imageUrl;
      return `${environment.apiBaseUrl2}/avatars/${author.imageUrl}`;
    }
    return 'assets/images/default-avatar.png';
  }

  getAuthorName(author: any): string { return author?.name || author?.username || 'User'; }
  getPlatformName(id: number): string { return this.socialPlatforms.find(p => p.id === id)?.name || 'Link'; }
  getPlatformIcon(id: number): string { return this.socialPlatforms.find(p => p.id === id)?.icon || 'bi-link'; }
  getInitials(name: string): string { return name ? (name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()) : 'NYC'; }

  get displayName() {
    if (!this.user) return '';
    const first = this.user.firstName || '';
    const last = this.user.lastName || '';
    if (first.toLowerCase() === last.toLowerCase()) return first;
    return `${first} ${last}`.trim() || this.currentUsername;
  }

  getInterestName(id: number): string {
    return this.categories.find(c => c.id === id)?.name || 'Interest';
  }
}
