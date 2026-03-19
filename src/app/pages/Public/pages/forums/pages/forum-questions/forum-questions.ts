import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ForumService } from '../../services/forum.service';
import { Forum, Question, ApiResponse, ForumDetailsData } from '../../models/forum';
import { GlobalLoaderService } from '../../../../../../shared/components/global-loader/global-loader.service';
import { InitialsAvatarComponent } from '../../../../../../shared/components/initials-avatar/initials-avatar.component';
import { NewsDepartmentHeroComponent } from '../../../../Widgets/news-department-hero/news-department-hero.component';
import { CommunityDepartmentHeroComponent } from '../../../../Widgets/community-department-hero/community-department-hero.component';
import { CategoryDepartmentHeroComponent } from '../../../../Widgets/category-department-hero/category-department-hero.component';
import { HousingDepartmentHeroComponent } from '../../../../Widgets/housing-department-hero/housing-department-hero.component';

@Component({
    selector: 'app-forum-questions',
    standalone: true,
    imports: [CommonModule, RouterLink, InitialsAvatarComponent, NewsDepartmentHeroComponent, CommunityDepartmentHeroComponent, CategoryDepartmentHeroComponent, HousingDepartmentHeroComponent],
    templateUrl: './forum-questions.html',
    styleUrls: ['./forum-questions.scss']
})
export class ForumQuestionsComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private forumService = inject(ForumService);
    private loaderService = inject(GlobalLoaderService);

    slug: string = '';
    forum: Forum | null = null;
    questions: Question[] = [];
    page = 1;
    pageSize = 10;
    totalCount = 0;
    totalPages = 0;
    isLoading = false;

    ngOnInit() {
        this.route.params.subscribe(params => {
            this.slug = params['slug'];
            if (this.slug) {
                this.loadQuestions();
            }
        });
    }

    loadQuestions() {
        this.isLoading = true;
        this.loaderService.show();
        this.forumService.getForumQuestions(this.slug, this.page, this.pageSize).subscribe({
            next: (res) => {
                this.isLoading = false;
                this.loaderService.hide();
                if (res.isSuccess && res.data) {
                    this.forum = res.data.forum;
                    const questionsData = res.data.questions;
                    if (questionsData && questionsData.isSuccess) {
                        this.questions = questionsData.data || [];
                        this.totalCount = questionsData.totalCount;
                        this.totalPages = questionsData.totalPages;
                    }
                }
            },
            error: () => {
                this.isLoading = false;
                this.loaderService.hide();
            }
        });
    }

    resolveForumIcon(iconUrl: string | undefined): string {
        if (!iconUrl) return '/MAIN Blue & Orange.png';
        return `https://nyc360.runasp.net/forums/${iconUrl}`;
    }

    onPageChange(newPage: number) {
        if (newPage >= 1 && newPage <= this.totalPages) {
            this.page = newPage;
            this.loadQuestions();
        }
    }

    get isNewsForum(): boolean {
        return this.slug === 'news';
    }

    get isCommunityForum(): boolean {
        return this.slug === 'community';
    }

    get isCultureForum(): boolean {
        return this.slug === 'culture';
    }

    get isEducationForum(): boolean {
        return this.slug === 'education';
    }

    get isHealthForum(): boolean {
        return this.slug === 'health';
    }

    get isHousingForum(): boolean {
        return this.slug === 'housing';
    }

    get newsHeroTitle(): string {
        return 'News Discussions';
    }

    get newsHeroDescription(): string {
        return this.forum?.description || 'Discuss the latest reporting, follow-up questions, and public insights in News.';
    }

    get communityHeroTitle(): string {
        return 'Community Discussions';
    }

    get communityHeroDescription(): string {
        return this.forum?.description || 'Ask follow-up questions, share local context, and continue conversations with the Community network.';
    }

    get cultureHeroTitle(): string {
        return 'Culture Discussions';
    }

    get cultureHeroDescription(): string {
        return this.forum?.description || 'Discuss cultural updates, local events, creative work, and follow-up questions in Culture.';
    }

    get educationHeroTitle(): string {
        return 'Education Discussions';
    }

    get educationHeroDescription(): string {
        return this.forum?.description || 'Ask about schools, learning resources, and education opportunities.';
    }

    get healthHeroTitle(): string {
        return 'Health Discussions';
    }

    get healthHeroDescription(): string {
        return this.forum?.description || 'Discuss care options, health resources, and practical questions with the Health community.';
    }

    get housingHeroTitle(): string {
        return 'Housing Discussions';
    }

    get housingHeroDescription(): string {
        return this.forum?.description || 'Ask about rentals, buying, housing programs, and neighborhood options.';
    }
}
