import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../Authentication/Service/auth';
import { environment } from '../../../../environments/environment';
import { PostsService } from '../posts/services/posts';
import { Post, FeedData, InterestGroup, CommunitySuggestion, PostAuthor } from '../posts/models/posts';
import { CATEGORY_LIST } from '../../../models/category-list';
import { WeatherService } from '../posts/services/weather';
import { CATEGORY_THEMES } from '../../Widgets/feeds/models/categories';
import { ToastService } from '../../../../shared/services/toast.service';
import { ImageService } from '../../../../shared/services/image.service';
import { ImgFallbackDirective } from '../../../../shared/directives/img-fallback.directive';
import { GlobalLoaderService } from '../../../../shared/components/global-loader/global-loader.service';
import { StatusModalComponent } from '../../../../shared/components/status-modal/status-modal.component';

interface Alert { type: 'yellow' | 'blue' | 'red'; title: string; desc: string; icon: string; }

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ImgFallbackDirective, StatusModalComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class Home implements OnInit {

  protected readonly environment = environment;
  private postsService = inject(PostsService);
  private weatherService = inject(WeatherService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  private router = inject(Router);
  private toastService = inject(ToastService);
  protected imageService = inject(ImageService);
  private loaderService = inject(GlobalLoaderService);

  // Data
  featuredPosts: Post[] = [];
  heroBanner: Post | null = null;
  interestGroups: InterestGroup[] = [];
  trendingTags: string[] = [];
  suggestedCommunities: CommunitySuggestion[] = [];
  highlightedPosts: Post[] = [];
  textOnlyPosts: Post[] = []; // New array for posts without images

  // Weather Data
  weatherData: any = null;
  currentDate: Date = new Date();
  isFahrenheit: boolean = true; // Default to F for NYC

  // Alerts Data
  alerts: Alert[] = [
    { type: 'yellow', title: 'Gridlock Alert', desc: 'Midtown traffic moving slow due to UN General Assembly', icon: 'bi-exclamation-triangle-fill' },
    { type: 'blue', title: 'Rain Expected', desc: 'Light showers starting around 4 PM', icon: 'bi-cloud-rain-fill' }
  ];

  isLoading = true;
  selectedCategoryId: number = -1;
  categories = [{ id: -1, name: 'All', icon: 'bi-grid' }, ...CATEGORY_LIST];

  isPendingUser: boolean = false;

  // Ticket Modal State
  showTicketModal: boolean = false;
  ticketSubject: string = '';
  ticketMessage: string = '';

  // Status Modal State
  statusModalOpen: boolean = false;
  statusModalType: 'success' | 'error' = 'success';
  statusModalTitle: string = '';
  statusModalMessage: string = '';

  private http = inject(HttpClient); // Inject HttpClient directly here as it wasn't present before

  ngOnInit() {
    // Check for pending status
    this.authService.fullUserInfo$.subscribe(info => {
      this.isPendingUser = info?.isPending === true;
    });

    this.route.queryParams.subscribe(params => {
      const cat = params['category'];
      this.selectedCategoryId = cat !== undefined ? +cat : -1;
      this.loadFeed();
    });

    this.getRealWeather();
  }

  openTicketModal() {
    this.ticketSubject = 'Account Pending Verification';
    this.ticketMessage = 'My account is pending. Please review my profile.';
    this.showTicketModal = true;
  }

  closeTicketModal() {
    this.showTicketModal = false;
  }

  submitTicket() {
    if (!this.ticketMessage || !this.ticketSubject) return;

    const payload = {
      Subject: this.ticketSubject,
      Message: this.ticketMessage
    };

    const url = `${environment.apiBaseUrl}/support-tickets/ticket/create/private`;

    this.http.post<any>(url, payload).subscribe({
      next: (res) => {
        if (res && (res.IsSuccess || res.isSuccess)) {
          this.closeTicketModal();
          this.openModal('success', 'Request Sent', 'Your request has been sent to support!');
        } else {
          const errorMsg = res.message || res.error || res.Message || 'Failed to send request.';
          this.openModal('error', 'Request Failed', errorMsg);
        }
      },
      error: (err) => {
        console.error(err);
        this.openModal('error', 'Error', 'Error sending request. Please check your connection.');
      }
    });
  }

  openModal(type: 'success' | 'error', title: string, message: string) {
    this.statusModalType = type;
    this.statusModalTitle = title;
    this.statusModalMessage = message;
    this.statusModalOpen = true;
  }

  closeModal() {
    this.statusModalOpen = false;
  }

  getRealWeather() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn('Location access denied, defaulting to NYC');
          this.fetchWeather(); // Will use default inside service
        }
      );
    } else {
      this.fetchWeather();
    }
  }

  fetchWeather(lat?: number, lon?: number) {
    this.weatherService.getWeather(lat, lon).subscribe(data => {
      this.weatherData = data;
      this.cdr.detectChanges();
    });
  }

  toggleUnit() {
    this.isFahrenheit = !this.isFahrenheit;
  }

  get displayTemp(): number {
    if (!this.weatherData) return 0;
    if (this.isFahrenheit) {
      return Math.round((this.weatherData.tempC * 9 / 5) + 32);
    }
    return Math.round(this.weatherData.tempC);
  }

  loadFeed() {
    this.isLoading = true;
    this.loaderService.show();
    this.postsService.getPostsFeed().subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.processData(res.data);
        }
        this.isLoading = false;
        this.loaderService.hide();
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.loaderService.hide();
        this.toastService.error('Failed to load feed');
        this.cdr.detectChanges();
      }
    });
  }

  // Helper check (Used mainly for Hero selection logic)
  private hasValidImage(post: Post): boolean {
    if (post.imageUrl && post.imageUrl.trim() !== '') return true;
    if (post.attachments && post.attachments.length > 0 && post.attachments[0].url) return true;
    // Check Parent Post (for Shared Posts)
    if (post.parentPost) {
      if (post.parentPost.imageUrl && post.parentPost.imageUrl.trim() !== '') return true;
      if (post.parentPost.attachments && post.parentPost.attachments.length > 0 && post.parentPost.attachments[0].url) return true;
    }
    return false;
  }

  processData(data: FeedData) {
    this.textOnlyPosts = []; // Reset text-only posts
    const processedIds = new Set<string | number>(); // Track added IDs to avoid duplicates

    // Helper to add to textOnlyPosts if unique
    const addTextOnly = (post: Post) => {
      if (!processedIds.has(post.id)) {
        this.textOnlyPosts.push(post);
        processedIds.add(post.id);
      }
    };

    const rawFeatured = data.featuredPosts || [];
    const validFeatured: Post[] = [];

    // 1. Process Featured: Split into with-image and without-image
    rawFeatured.forEach(p => {
      const post = this.normalizePost(p);
      if (this.hasValidImage(post)) {
        validFeatured.push(post);
      } else {
        addTextOnly(post);
      }
    });

    // Take top 3 valid images for featured row
    this.featuredPosts = validFeatured.slice(0, 3);

    // 2. Hero Banner Logic
    const rawDiscovery = data.discoveryPosts || [];
    const validDiscovery: Post[] = [];

    rawDiscovery.forEach(p => {
      const post = this.normalizePost(p);
      if (this.hasValidImage(post)) {
        validDiscovery.push(post);
      } else {
        addTextOnly(post);
      }
    });

    if (validDiscovery.length > 0) {
      this.heroBanner = validDiscovery[0];
    } else if (validFeatured.length > 3) {
      // If we have extra featured posts with images, use the 4th one as hero (index 3)
      this.heroBanner = validFeatured[3];
    } else {
      this.heroBanner = null;
    }

    // 3. Interest Groups Logic
    this.interestGroups = (data.interestGroups || []).map(group => {
      const validGroupPosts: Post[] = [];

      group.posts.forEach(p => {
        const post = this.normalizePost(p);
        if (this.hasValidImage(post)) {
          validGroupPosts.push(post);
        } else {
          addTextOnly(post);
        }
      });

      return { ...group, posts: validGroupPosts };
    }).filter(g => g.posts.length > 0);

    // Highlights Logic (remains mostly same, picks from interest groups which are now only-images)
    this.highlightedPosts = [];
    this.interestGroups.forEach(group => {
      if (group.posts.length > 0) {
        this.highlightedPosts.push(group.posts[0]);
      }
    });

    this.trendingTags = data.trendingTags || [];
    this.suggestedCommunities = data.suggestedCommunities || [];
  }

  goToPost(post: Post) {
    // ✅ Redirection Logic: If this is a Job Post, go to Job Profile
    if (post.category === 8 && (post as any).linkedResource) {
      this.router.navigate(['/public/job-profile', (post as any).linkedResource.id]);
      return;
    }

    this.router.navigate(['/public/posts/details', post.id], {
      state: { postData: post }
    });
  }

  onSavePost(post: Post, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    if (!this.authService.currentUser$.value) {
      this.toastService.info('Please login to save posts');
      return;
    }
    const originalState = post.isSaved;
    post.isSaved = !post.isSaved;
    this.postsService.savePost(post.id).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          const msg = post.isSaved ? 'Post saved successfully!' : 'Post unsaved';
          this.toastService.success(msg);
        } else {
          post.isSaved = originalState;
          this.toastService.error('Failed to save post');
        }
        this.cdr.detectChanges();
      },
      error: () => {
        post.isSaved = originalState;
        this.toastService.error('Error saving post');
        this.cdr.detectChanges();
      }
    });
  }

  onJoinCommunity(comm: CommunitySuggestion) {
    if (!this.authService.currentUser$.value) { this.toastService.info('Login required'); return; }
    if (comm.isJoined || comm.isLoadingJoin) return;
    comm.isLoadingJoin = true;
    this.postsService.joinCommunity(comm.id).subscribe({
      next: (res) => {
        comm.isLoadingJoin = false;
        if (res.isSuccess) { comm.isJoined = true; this.toastService.success('Joined!'); }
        else this.toastService.error('Failed');
        this.cdr.detectChanges();
      },
      error: () => { comm.isLoadingJoin = false; this.cdr.detectChanges(); }
    })
  }

  scrollGroup(categoryId: number, direction: 'left' | 'right') {
    const slider = document.getElementById('slider-' + categoryId);
    if (slider) {
      const scrollAmount = slider.clientWidth * 0.8;
      slider.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  }

  // Helpers
  private stripHtml(html: string | null | undefined): string {
    if (!html) return '';
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
    } catch {
      return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    }
  }

  private normalizePost(post: any): Post {
    if (!post.stats) post.stats = { views: 0, likes: 0, dislikes: 0, comments: 0, shares: 0 };
    if (post.isSaved === undefined) post.isSaved = (post.isSavedByUser === true);
    if (!post.title) post.title = '';

    // Clean HTML content for excerpts
    if (post.content) {
      post.content = this.stripHtml(post.content);
    } else {
      post.content = '';
    }

    return post;
  }

  getAuthorName(author: PostAuthor | string | undefined | null): string {
    if (!author) return 'NYC360';
    if (typeof author === 'string') return author;
    return author.name || author.username || 'NYC360';
  }

  getCategoryName(id: number): string {
    const cat = this.categories.find(c => c.id === id);
    return cat ? cat.name : 'General';
  }

  getCategoryColor(id: number): string {
    const theme = (CATEGORY_THEMES as any)[id];
    return theme ? theme.color : '#d4af37'; // Default gold
  }

  getCategoryIcon(id: number): string {
    const theme = (CATEGORY_THEMES as any)[id];
    return theme ? theme.icon : '';
  }

  // ============================================
  // 🔥 دوال معالجة الصور (الذكية)
  // ============================================

  // Use ImageService for visuals
  getAuthorImage(author: any): string {
    return this.imageService.resolveAvatar(author);
  }

  resolvePostImage(post: Post): string {
    return this.imageService.resolvePostImage(post);
  }
}