import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { PostsService } from '../posts/services/posts';
import { CATEGORY_THEMES } from '../../Widgets/feeds/models/categories';
import { ApiResponse, Post } from '../posts/models/posts';
import { ImageService } from '../../../../shared/services/image.service';
import { AuthService } from '../../../Authentication/Service/auth';
import { NewsDepartmentHeroComponent } from '../../Widgets/news-department-hero/news-department-hero.component';
import { CommunityDepartmentHeroComponent } from '../../Widgets/community-department-hero/community-department-hero.component';
import { CategoryDepartmentHeroComponent } from '../../Widgets/category-department-hero/category-department-hero.component';
import { HousingDepartmentHeroComponent } from '../../Widgets/housing-department-hero/housing-department-hero.component';
import { EMPTY_NEWS_ACCESS, NewsAccess, NewsService } from '../../../../shared/services/news.service';

@Component({
    selector: 'app-category-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, NewsDepartmentHeroComponent, CommunityDepartmentHeroComponent, CategoryDepartmentHeroComponent, HousingDepartmentHeroComponent],
    templateUrl: './category-dashboard.html',
    styleUrls: ['./category-dashboard.scss']
})
export class CategoryDashboardComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private postsService = inject(PostsService);
    private cdr = inject(ChangeDetectorRef);
    private newsService = inject(NewsService);
    protected imageService = inject(ImageService);
    protected authService = inject(AuthService);

    categoryTheme: any = null;
    activeCategoryId: number = 0;
    analytics: any = null;
    posts: Post[] = [];
    isLoading = true;
    activeView: 'dashboard' | 'list' = 'dashboard';
    currentUsername: string = 'User';
    newsAccess: NewsAccess = EMPTY_NEWS_ACCESS;

    ngOnInit(): void {
        const user = this.authService.currentUser$.value;
        if (user) {
            this.currentUsername = user.fullName || user.username || 'Contributor';
        }

        this.route.params.subscribe(params => {
            const path = params['categoryPath'];
            this.resolveCategory(path);
        });
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
                this.cdr.markForCheck();
            },
            error: () => {
                this.newsAccess = EMPTY_NEWS_ACCESS;
                this.cdr.markForCheck();
            }
        });
    }

    loadData() {
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

    setView(view: 'dashboard' | 'list') {
        this.activeView = view;
        this.cdr.detectChanges();
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
        if (this.isHousingCategory) {
            return ['/public/housing/home'];
        }

        return ['/public/feed', this.categoryTheme?.path];
    }
}
