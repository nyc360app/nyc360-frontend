import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { PostsService } from '../posts/services/posts';
import { CATEGORY_THEMES } from '../../Widgets/feeds/models/categories';
import { ApiResponse, Post } from '../posts/models/posts';
import { ImageService } from '../../../../shared/services/image.service';
import { AuthService } from '../../../Authentication/Service/auth';

@Component({
    selector: 'app-category-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './category-dashboard.html',
    styleUrls: ['./category-dashboard.scss']
})
export class CategoryDashboardComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private postsService = inject(PostsService);
    private cdr = inject(ChangeDetectorRef);
    protected imageService = inject(ImageService);
    protected authService = inject(AuthService);

    categoryTheme: any = null;
    activeCategoryId: number = 0;
    analytics: any = null;
    posts: Post[] = [];
    isLoading = true;
    activeView: 'dashboard' | 'list' = 'dashboard';
    currentUsername: string = 'User';

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
            this.loadData();
        } else {
            this.categoryTheme = { label: 'General', color: '#0A3D91' };
            this.isLoading = false;
        }
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
}
