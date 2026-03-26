import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PostsService } from '../posts/services/posts';
import { CATEGORY_THEMES, getDepartmentArticleCreateRoute, getDepartmentHomeRoute } from '../../Widgets/feeds/models/categories';
import { ApiResponse, Post } from '../posts/models/posts';
import { ImageService } from '../../../../shared/services/image.service';
import { AuthService } from '../../../Authentication/Service/auth';
import { NewsDepartmentHeroComponent } from '../../Widgets/news-department-hero/news-department-hero.component';
import { CommunityDepartmentHeroComponent } from '../../Widgets/community-department-hero/community-department-hero.component';
import { CategoryDepartmentHeroComponent } from '../../Widgets/category-department-hero/category-department-hero.component';
import { HousingDepartmentHeroComponent } from '../../Widgets/housing-department-hero/housing-department-hero.component';
import { EMPTY_NEWS_ACCESS, NewsAccess, NewsService } from '../../../../shared/services/news.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { hasCommunityContributorAccess, hasCommunityStaffBypass } from '../../../../shared/utils/community-contract';

@Component({
    selector: 'app-category-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, NewsDepartmentHeroComponent, CommunityDepartmentHeroComponent, CategoryDepartmentHeroComponent, HousingDepartmentHeroComponent],
    templateUrl: './category-dashboard.html',
    styleUrls: ['./category-dashboard.scss']
})
export class CategoryDashboardComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private postsService = inject(PostsService);
    private cdr = inject(ChangeDetectorRef);
    private newsService = inject(NewsService);
    private toastService = inject(ToastService);
    protected imageService = inject(ImageService);
    protected authService = inject(AuthService);

    categoryTheme: any = null;
    activeCategoryId: number = 0;
    analytics: any = null;
    posts: Post[] = [];
    isLoading = true;
    activeView: 'dashboard' | 'list' | 'submissions' | 'rssRequests' | 'rssSources' = 'dashboard';
    currentUsername: string = 'User';
    newsAccess: NewsAccess = EMPTY_NEWS_ACCESS;
    pendingNewsSubmissions: any[] = [];
    newsSubmissionSearch = '';
    isLoadingNewsSubmissions = false;
    processingSubmissionId: number | null = null;
    newsRssRequests: any[] = [];
    newsRssRequestStatus = 'Pending';
    isLoadingNewsRssRequests = false;
    processingRssRequestId: number | null = null;
    newsRssSources: any[] = [];
    isLoadingNewsRssSources = false;
    showRssSourceModal = false;
    private resolvedCategoryPath = '';
    editingRssSourceId: number | null = null;
    rssSourceForm = {
        url: '',
        name: '',
        description: '',
        imageUrl: '',
        isActive: true
    };
    rssSourceImageFile: File | null = null;
    isSubmittingRssSource = false;
    isTestingRssSource = false;

    ngOnInit(): void {
        const user = this.authService.currentUser$.value;
        if (user) {
            this.currentUsername = user.fullName || user.username || 'Contributor';
        }

        if (this.authService.isLoggedIn() && !this.authService.getFullUserInfo()) {
            this.authService.fetchFullUserInfo().subscribe({ error: () => undefined });
        }

        this.route.params.subscribe(() => this.resolveCategoryFromRoute());
        this.route.data.subscribe(() => this.resolveCategoryFromRoute());
    }

    private resolveCategoryFromRoute(): void {
        const path = this.route.snapshot.params['categoryPath'] || this.route.snapshot.data['categoryPath'];
        if (!path || path === this.resolvedCategoryPath) {
            return;
        }
        this.resolvedCategoryPath = path;
        this.resolveCategory(path);
    }

    resolveCategory(path: string) {
        this.isLoading = true;
        const categoryEntry = Object.entries(CATEGORY_THEMES).find(([key, val]: any) => val.path === path);

        if (categoryEntry) {
            this.activeCategoryId = Number(categoryEntry[0]);
            this.categoryTheme = categoryEntry[1];
            this.syncNewsAccess();
            this.loadData();
        } else {
            this.categoryTheme = { label: 'General', color: '#0A3D91' };
            this.newsAccess = EMPTY_NEWS_ACCESS;
            this.isLoading = false;
        }
    }

    private syncNewsAccess(): void {
        if (this.categoryTheme?.path !== 'news') {
            this.newsAccess = EMPTY_NEWS_ACCESS;
            return;
        }

        this.newsService.getNewsAccess().subscribe({
            next: (access) => {
                this.newsAccess = access;
                if (!this.isNewsViewAllowed(this.activeView)) {
                    this.activeView = 'dashboard';
                }
                this.cdr.markForCheck();
            },
            error: () => {
                this.newsAccess = EMPTY_NEWS_ACCESS;
                if (!this.isNewsViewAllowed(this.activeView)) {
                    this.activeView = 'dashboard';
                }
                this.cdr.markForCheck();
            }
        });
    }

    loadData() {
        if (this.showCommunityDashboardLocked) {
            this.analytics = null;
            this.posts = [];
            this.isLoading = false;
            this.cdr.detectChanges();
            return;
        }

        this.isLoading = true;
        this.postsService.getMyCategoryAnalysis(this.activeCategoryId).subscribe({
            next: (res: ApiResponse<any>) => {
                if (res.isSuccess) {
                    this.analytics = res.data;
                }
                this.loadPosts();
            },
            error: () => this.loadPosts()
        });
    }

    loadPosts() {
        this.postsService.getMyPostsByCategory(this.activeCategoryId).subscribe({
            next: (res: ApiResponse<Post[]>) => {
                if (res.isSuccess) {
                    this.posts = res.data;
                }
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    setView(view: 'dashboard' | 'list' | 'submissions' | 'rssRequests' | 'rssSources') {
        this.activeView = view;
        this.loadActiveViewData();
        this.cdr.detectChanges();
    }

    loadActiveViewData(): void {
        switch (this.activeView) {
            case 'submissions':
                this.loadPendingNewsSubmissions();
                break;
            case 'rssRequests':
                this.loadNewsRssRequests();
                break;
            case 'rssSources':
                this.loadNewsRssSources();
                break;
            default:
                break;
        }
    }

    refreshCurrentView(): void {
        if (this.activeView === 'dashboard' || this.activeView === 'list') {
            this.loadData();
            return;
        }

        this.loadActiveViewData();
    }

    get fallbackColor(): string {
        return this.categoryTheme?.color || '#0A3D91';
    }

    getInitials(): string {
        return this.currentUsername.charAt(0).toUpperCase();
    }

    get isNewsCategory(): boolean {
        return this.categoryTheme?.path === 'news';
    }

    get isCommunityCategory(): boolean {
        return this.categoryTheme?.path === 'community';
    }

    get hasCommunityDashboardAccess(): boolean {
        if (!this.isCommunityCategory) {
            return true;
        }

        return this.authService.hasRole('Admin')
            || this.authService.hasRole('SuperAdmin')
            || hasCommunityStaffBypass(this.authService.getFullUserInfo())
            || hasCommunityContributorAccess(this.authService.getFullUserInfo()?.tags || []);
    }

    get showCommunityDashboardLocked(): boolean {
        return this.isCommunityCategory && !this.hasCommunityDashboardAccess;
    }

    get isCultureCategory(): boolean {
        return this.categoryTheme?.path === 'culture';
    }

    get isEducationCategory(): boolean {
        return this.categoryTheme?.path === 'education';
    }

    get isHealthCategory(): boolean {
        return this.categoryTheme?.path === 'health';
    }

    get isHousingCategory(): boolean {
        return this.categoryTheme?.path === 'housing';
    }

    get newsHeroTitle(): string {
        return this.activeView === 'dashboard' ? 'News Dashboard' : 'My News Articles';
    }

    get newsHeroDescription(): string {
        return this.activeView === 'dashboard'
            ? 'Track performance, engagement, and publishing momentum across your News contributions.'
            : 'Review, refine, and manage the News stories you have published in NYC360.';
    }

    get canCreateNewsContent(): boolean {
        return this.authService.hasRole('SuperAdmin') || this.newsAccess.canSubmitContent;
    }

    get newsCreateButtonLabel(): string {
        if (!this.isNewsCategory) return 'Article';
        return this.authService.hasRole('SuperAdmin') || this.newsAccess.canPublishContent
            ? 'Publish Article'
            : 'Submit Story';
    }

    get hasNewsModerationAccess(): boolean {
        return this.authService.hasRole('SuperAdmin') || this.newsAccess.canModerateContent;
    }

    get hasNewsRssRequestAccess(): boolean {
        return this.authService.hasRole('SuperAdmin') || this.newsAccess.canReviewRssRequests;
    }

    get hasNewsRssSourceAccess(): boolean {
        return this.authService.hasRole('SuperAdmin') || this.newsAccess.canConnectRss;
    }

    get hasNewsOrganizationListingAccess(): boolean {
        return this.authService.hasRole('SuperAdmin') || this.newsAccess.canListNewsOrganizationInSpace;
    }

    get contentHeaderTitle(): string {
        switch (this.activeView) {
            case 'list':
                return 'My List';
            case 'submissions':
                return 'Moderation Queue';
            case 'rssRequests':
                return 'RSS Requests';
            case 'rssSources':
                return 'RSS Sources';
            default:
                return 'Analytics';
        }
    }

    get contentHeaderDescription(): string {
        switch (this.activeView) {
            case 'list':
                return `Manage articles for ${this.categoryTheme?.label}`;
            case 'submissions':
                return 'Review pending News story submissions waiting for a publisher decision.';
            case 'rssRequests':
                return 'Review News RSS connection requests submitted by users.';
            case 'rssSources':
                return 'Manage approved News RSS sources and ingestion endpoints.';
            default:
                return `Performance overview for ${this.categoryTheme?.label}`;
        }
    }

    get newsWorkflowSummary(): string {
        if (!this.isNewsCategory) {
            return '';
        }

        if (this.hasNewsModerationAccess) {
            return 'Use Moderation to approve or reject pending News stories before they appear in public News feeds.';
        }

        return 'Your submitted News stories stay under review until a News moderator or publisher approves them.';
    }

    loadPendingNewsSubmissions(): void {
        if (!this.isNewsCategory || !this.hasNewsModerationAccess) return;

        this.isLoadingNewsSubmissions = true;
        this.newsService.getPendingSubmissions(1, 20, this.newsSubmissionSearch).subscribe({
            next: (res) => {
                this.pendingNewsSubmissions = res.isSuccess ? (res.data || []) : [];
                this.isLoadingNewsSubmissions = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.pendingNewsSubmissions = [];
                this.isLoadingNewsSubmissions = false;
                this.toastService.error('Failed to load pending News submissions.');
                this.cdr.markForCheck();
            }
        });
    }

    reviewNewsSubmission(item: any, approved: boolean): void {
        const postId = Number(item?.id ?? item?.postId ?? item?.PostId);
        if (!postId) {
            this.toastService.error('Invalid submission id.');
            return;
        }

        this.processingSubmissionId = postId;
        this.newsService.reviewSubmission(postId, approved, item?._moderationNote || '').subscribe({
            next: (res: any) => {
                const isSuccess = res?.isSuccess ?? res?.IsSuccess ?? true;
                if (isSuccess) {
                    this.toastService.success(approved ? 'Submission approved.' : 'Submission rejected.');
                    this.pendingNewsSubmissions = this.pendingNewsSubmissions.filter((submission) =>
                        Number(submission?.id ?? submission?.postId ?? submission?.PostId) !== postId
                    );
                } else {
                    this.toastService.error(res?.error?.message || res?.Error?.Message || 'Failed to review submission.');
                }
                this.processingSubmissionId = null;
                this.cdr.markForCheck();
            },
            error: () => {
                this.processingSubmissionId = null;
                this.toastService.error('Failed to review submission.');
                this.cdr.markForCheck();
            }
        });
    }

    loadNewsRssRequests(): void {
        if (!this.isNewsCategory || !this.hasNewsRssRequestAccess) return;

        this.isLoadingNewsRssRequests = true;
        this.newsService.getNewsRssRequests(1, 20, this.newsRssRequestStatus).subscribe({
            next: (res) => {
                this.newsRssRequests = res.isSuccess ? (res.data || []) : [];
                this.isLoadingNewsRssRequests = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.newsRssRequests = [];
                this.isLoadingNewsRssRequests = false;
                this.toastService.error('Failed to load News RSS requests.');
                this.cdr.markForCheck();
            }
        });
    }

    reviewNewsRssRequest(item: any, status: 'Approved' | 'Rejected'): void {
        const requestId = Number(item?.id ?? item?.Id);
        if (!requestId) {
            this.toastService.error('Invalid RSS request id.');
            return;
        }

        this.processingRssRequestId = requestId;
        this.newsService.reviewNewsRssRequest(requestId, status, item?._adminNote || '').subscribe({
            next: (res: any) => {
                const isSuccess = res?.isSuccess ?? res?.IsSuccess ?? true;
                if (isSuccess) {
                    this.toastService.success(`RSS request ${status.toLowerCase()}.`);
                    this.newsRssRequests = this.newsRssRequests.filter((request) =>
                        Number(request?.id ?? request?.Id) !== requestId
                    );
                } else {
                    this.toastService.error(res?.error?.message || res?.Error?.Message || 'Failed to review RSS request.');
                }
                this.processingRssRequestId = null;
                this.cdr.markForCheck();
            },
            error: () => {
                this.processingRssRequestId = null;
                this.toastService.error('Failed to review RSS request.');
                this.cdr.markForCheck();
            }
        });
    }

    loadNewsRssSources(): void {
        if (!this.isNewsCategory || !this.hasNewsRssSourceAccess) return;

        this.isLoadingNewsRssSources = true;
        this.newsService.getNewsRssSources().subscribe({
            next: (sources) => {
                this.newsRssSources = Array.isArray(sources) ? sources : [];
                this.isLoadingNewsRssSources = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.newsRssSources = [];
                this.isLoadingNewsRssSources = false;
                this.toastService.error('Failed to load News RSS sources.');
                this.cdr.markForCheck();
            }
        });
    }

    openCreateRssSourceModal(): void {
        this.editingRssSourceId = null;
        this.rssSourceImageFile = null;
        this.rssSourceForm = {
            url: '',
            name: '',
            description: '',
            imageUrl: '',
            isActive: true
        };
        this.showRssSourceModal = true;
    }

    openEditRssSourceModal(source: any): void {
        this.editingRssSourceId = Number(source?.id ?? source?.Id ?? 0) || null;
        this.rssSourceImageFile = null;
        this.rssSourceForm = {
            url: String(source?.rssUrl ?? source?.url ?? ''),
            name: String(source?.name ?? ''),
            description: String(source?.description ?? ''),
            imageUrl: String(source?.imageUrl ?? ''),
            isActive: !!(source?.isActive ?? source?.IsActive ?? true)
        };
        this.showRssSourceModal = true;
    }

    closeRssSourceModal(): void {
        this.showRssSourceModal = false;
        this.isSubmittingRssSource = false;
        this.isTestingRssSource = false;
    }

    onRssSourceFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.rssSourceImageFile = input?.files?.[0] || null;
    }

    testRssSourceUrl(): void {
        const url = this.rssSourceForm.url.trim();
        if (!url) {
            this.toastService.error('Enter an RSS URL to test.');
            return;
        }

        this.isTestingRssSource = true;
        this.newsService.testNewsRssSource(url).subscribe({
            next: (res: any) => {
                const isSuccess = res?.isSuccess ?? res?.IsSuccess ?? true;
                if (isSuccess) {
                    const data = res?.data ?? res?.Data ?? {};
                    this.rssSourceForm = {
                        ...this.rssSourceForm,
                        name: this.rssSourceForm.name || String(data?.name ?? ''),
                        description: this.rssSourceForm.description || String(data?.description ?? ''),
                        imageUrl: this.rssSourceForm.imageUrl || String(data?.imageUrl ?? '')
                    };
                    this.toastService.success('RSS source test succeeded.');
                } else {
                    this.toastService.error(res?.error?.message || res?.Error?.Message || 'RSS test failed.');
                }
                this.isTestingRssSource = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.isTestingRssSource = false;
                this.toastService.error('RSS test failed.');
                this.cdr.markForCheck();
            }
        });
    }

    submitRssSourceForm(): void {
        if (!this.rssSourceForm.url.trim() || !this.rssSourceForm.name.trim()) {
            this.toastService.error('RSS URL and name are required.');
            return;
        }

        this.isSubmittingRssSource = true;
        const request$ = this.editingRssSourceId
            ? this.newsService.updateNewsRssSource(this.buildUpdateRssSourceFormData())
            : this.newsService.createNewsRssSource(this.buildCreateRssSourceFormData());

        request$.subscribe({
            next: (res: any) => {
                const isSuccess = res?.isSuccess ?? res?.IsSuccess ?? true;
                if (isSuccess) {
                    this.toastService.success(this.editingRssSourceId ? 'RSS source updated.' : 'RSS source created.');
                    this.closeRssSourceModal();
                    this.loadNewsRssSources();
                } else {
                    this.toastService.error(res?.error?.message || res?.Error?.Message || 'Failed to save RSS source.');
                }
                this.isSubmittingRssSource = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.isSubmittingRssSource = false;
                this.toastService.error('Failed to save RSS source.');
                this.cdr.markForCheck();
            }
        });
    }

    deleteNewsRssSource(item: any): void {
        const sourceId = Number(item?.id ?? item?.Id);
        if (!sourceId) {
            this.toastService.error('Invalid RSS source id.');
            return;
        }

        if (!confirm('Delete this News RSS source?')) {
            return;
        }

        this.newsService.deleteNewsRssSource(sourceId).subscribe({
            next: () => {
                this.toastService.success('RSS source deleted.');
                this.newsRssSources = this.newsRssSources.filter((source) => Number(source?.id ?? source?.Id) !== sourceId);
                this.cdr.markForCheck();
            },
            error: () => {
                this.toastService.error('Failed to delete RSS source.');
                this.cdr.markForCheck();
            }
        });
    }

    getNewsSubmissionId(item: any): number {
        return Number(item?.id ?? item?.postId ?? item?.PostId ?? 0);
    }

    getNewsSubmissionTitle(item: any): string {
        return String(item?.title ?? item?.Title ?? 'Untitled submission');
    }

    getNewsSubmissionExcerpt(item: any): string {
        return String(item?.content ?? item?.Content ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    getNewsSubmissionAuthor(item: any): string {
        return item?.author?.fullName
            || item?.author?.name
            || item?.author?.username
            || item?.Author?.FullName
            || 'Unknown author';
    }

    getNewsSubmissionDate(item: any): string {
        return String(item?.createdAt ?? item?.CreatedAt ?? '');
    }

    getNewsPostStatus(post: any): string {
        const rawStatus = post?.status
            ?? post?.Status
            ?? post?.moderationStatus
            ?? post?.ModerationStatus
            ?? post?.approvalStatus
            ?? post?.ApprovalStatus
            ?? post?.postStatus
            ?? post?.PostStatus
            ?? null;

        if (typeof rawStatus === 'string') {
            const normalized = rawStatus.trim().toLowerCase();
            if (normalized.includes('reject')) return 'Rejected';
            if (normalized.includes('approve') || normalized.includes('publish') || normalized.includes('live')) return 'Approved';
            if (normalized.includes('draft')) return 'Draft';
            if (normalized.includes('pending') || normalized.includes('review') || normalized.includes('submit')) return 'Under Review';
        }

        if (typeof rawStatus === 'number') {
            if (rawStatus === 0) return 'Under Review';
            if (rawStatus === 1) return 'Approved';
            if (rawStatus === 2) return 'Rejected';
            if (rawStatus === 3) return 'Draft';
        }

        const isRejected = !!(post?.isRejected ?? post?.IsRejected);
        if (isRejected) return 'Rejected';

        const isApproved = post?.isApproved ?? post?.IsApproved;
        if (isApproved === true) return 'Approved';
        if (isApproved === false) return 'Under Review';

        const isPending = post?.isPending ?? post?.IsPending;
        if (isPending === true) return 'Under Review';

        const isPublished = post?.isPublished ?? post?.IsPublished;
        if (isPublished === true) return 'Approved';

        return 'Status Unknown';
    }

    getNewsPostStatusClass(post: any): string {
        const status = this.getNewsPostStatus(post).toLowerCase();
        if (status.includes('reject')) return 'rejected';
        if (status.includes('approve')) return 'approved';
        if (status.includes('review')) return 'pending';
        if (status.includes('draft')) return 'draft';
        return 'unknown';
    }

    getNewsPostStatusHint(post: any): string {
        switch (this.getNewsPostStatus(post)) {
            case 'Approved':
                return 'Visible in public News feeds.';
            case 'Rejected':
                return 'Rejected by moderation and needs revision before resubmission.';
            case 'Draft':
                return 'Saved but not yet submitted into the News workflow.';
            case 'Under Review':
                return 'Waiting for a News moderator or publisher decision.';
            default:
                return 'Status details are not fully available from the current response.';
        }
    }

    getNewsRssRequestId(item: any): number {
        return Number(item?.id ?? item?.Id ?? 0);
    }

    getNewsRssRequestName(item: any): string {
        return String(item?.name ?? item?.Name ?? 'Untitled request');
    }

    getNewsRssRequestUrl(item: any): string {
        return String(item?.url ?? item?.Url ?? '');
    }

    getNewsRssRequester(item: any): string {
        return item?.requester?.fullName
            || item?.requester?.username
            || item?.Requester?.FullName
            || 'Unknown requester';
    }

    getNewsRssStatusLabel(item: any): string {
        const rawStatus = item?.status ?? item?.Status ?? this.newsRssRequestStatus;

        if (typeof rawStatus === 'string') {
            const normalized = rawStatus.trim().toLowerCase();
            if (normalized.includes('approve')) return 'Approved';
            if (normalized.includes('reject')) return 'Rejected';
            if (normalized.includes('pending')) return 'Pending';
            return rawStatus;
        }

        if (typeof rawStatus === 'number') {
            if (rawStatus === 1) return 'Approved';
            if (rawStatus === 2) return 'Rejected';
            return 'Pending';
        }

        return 'Pending';
    }

    getNewsRssStatusClass(item: any): string {
        const normalized = this.getNewsRssStatusLabel(item).toLowerCase();
        if (normalized.includes('approve')) return 'approved';
        if (normalized.includes('reject')) return 'rejected';
        return 'pending';
    }

    private buildCreateRssSourceFormData(): FormData {
        const formData = new FormData();
        formData.append('Url', this.rssSourceForm.url.trim());
        formData.append('Name', this.rssSourceForm.name.trim());
        formData.append('Description', this.rssSourceForm.description.trim());
        formData.append('ImageUrl', this.rssSourceForm.imageUrl.trim());

        if (this.rssSourceImageFile) {
            formData.append('Image', this.rssSourceImageFile);
        }

        return formData;
    }

    private buildUpdateRssSourceFormData(): FormData {
        const formData = new FormData();
        formData.append('Id', String(this.editingRssSourceId || 0));
        formData.append('RssUrl', this.rssSourceForm.url.trim());
        formData.append('Name', this.rssSourceForm.name.trim());
        formData.append('Description', this.rssSourceForm.description.trim());
        formData.append('IsActive', String(this.rssSourceForm.isActive));

        if (this.rssSourceImageFile) {
            formData.append('Image', this.rssSourceImageFile);
        }

        return formData;
    }

    private isNewsViewAllowed(view: 'dashboard' | 'list' | 'submissions' | 'rssRequests' | 'rssSources'): boolean {
        if (view === 'submissions') return this.hasNewsModerationAccess;
        if (view === 'rssRequests') return this.hasNewsRssRequestAccess;
        if (view === 'rssSources') return this.hasNewsRssSourceAccess;
        return true;
    }

    get communityHeroTitle(): string {
        return this.activeView === 'dashboard' ? 'Community Dashboard' : 'My Community Articles';
    }

    get communityHeroDescription(): string {
        return this.activeView === 'dashboard'
            ? 'Track your activity, publishing rhythm, and contribution health across the Community network.'
            : 'Manage the community stories and updates you have published across NYC360.';
    }

    get cultureHeroTitle(): string {
        return this.activeView === 'dashboard' ? 'Culture Dashboard' : 'My Culture Articles';
    }

    get cultureHeroDescription(): string {
        return this.activeView === 'dashboard'
            ? 'Track performance, engagement, and publishing momentum across your Culture contributions.'
            : 'Review, refine, and manage the Culture stories you have published in NYC360.';
    }

    get educationHeroTitle(): string {
        return this.activeView === 'dashboard' ? 'Education Dashboard' : 'My Education Articles';
    }

    get educationHeroDescription(): string {
        return this.activeView === 'dashboard'
            ? 'See how your education posts are performing across NYC360.'
            : 'Review and manage the education articles you have published.';
    }

    get healthHeroTitle(): string {
        return this.activeView === 'dashboard' ? 'Health Dashboard' : 'My Health Articles';
    }

    get healthHeroDescription(): string {
        return this.activeView === 'dashboard'
            ? 'Track how your health updates are performing across NYC360.'
            : 'Review and manage the health articles you have published.';
    }

    get housingHeroTitle(): string {
        return this.activeView === 'dashboard' ? 'Housing Dashboard' : 'My Housing Articles';
    }

    get housingHeroDescription(): string {
        return this.activeView === 'dashboard'
            ? 'Review your housing activity, listings, and published updates in one place.'
            : 'Manage the housing articles and updates you have published.';
    }

    get backHomeLink(): any[] {
        return [getDepartmentHomeRoute(this.categoryTheme?.path)];
    }

    get createArticleLink(): any[] {
        return [getDepartmentArticleCreateRoute(this.categoryTheme?.path)];
    }
}
