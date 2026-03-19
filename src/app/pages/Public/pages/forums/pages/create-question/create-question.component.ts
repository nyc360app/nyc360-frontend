import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ForumService } from '../../services/forum.service';
import { GlobalLoaderService } from '../../../../../../shared/components/global-loader/global-loader.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { Forum } from '../../models/forum';
import { NewsDepartmentHeroComponent } from '../../../../Widgets/news-department-hero/news-department-hero.component';
import { CommunityDepartmentHeroComponent } from '../../../../Widgets/community-department-hero/community-department-hero.component';
import { CategoryDepartmentHeroComponent } from '../../../../Widgets/category-department-hero/category-department-hero.component';
import { HousingDepartmentHeroComponent } from '../../../../Widgets/housing-department-hero/housing-department-hero.component';

@Component({
    selector: 'app-create-question',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, NewsDepartmentHeroComponent, CommunityDepartmentHeroComponent, CategoryDepartmentHeroComponent, HousingDepartmentHeroComponent],
    templateUrl: './create-question.component.html',
    styleUrls: ['./create-question.component.scss']
})
export class CreateQuestionComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private forumService = inject(ForumService);
    private loaderService = inject(GlobalLoaderService);
    private toastService = inject(ToastService);

    slug: string = '';
    forum: Forum | null = null;

    title: string = '';
    content: string = '';
    isSubmitting = false;

    ngOnInit() {
        this.route.params.subscribe(params => {
            this.slug = params['slug'];
            if (this.slug) {
                this.loadForum();
            }
        });
    }

    loadForum() {
        this.loaderService.show();
        // Reusing getForumQuestions to get forum details because I don't see a getForumBySlug method in existing service
        // However, getForumQuestions returns forum data. It's safe to use.
        this.forumService.getForumQuestions(this.slug, 1, 1).subscribe({
            next: (res) => {
                this.loaderService.hide();
                if (res.isSuccess && res.data) {
                    this.forum = res.data.forum;
                } else {
                    this.toastService.error('Forum not found');
                    this.router.navigate(['/public/forums']);
                }
            },
            error: () => {
                this.loaderService.hide();
                this.toastService.error('Failed to load forum details');
                this.router.navigate(['/public/forums']);
            }
        });
    }

    onSubmit() {
        if (!this.forum) return;
        if (!this.title.trim() || !this.content.trim()) {
            this.toastService.warning('Please fill in all fields');
            return;
        }

        this.isSubmitting = true;
        this.loaderService.show();

        const payload = {
            ForumId: this.forum.id,
            Title: this.title,
            Content: this.content
        };

        this.forumService.createQuestion(payload).subscribe({
            next: (res) => {
                this.isSubmitting = false;
                this.loaderService.hide();
                if (res.isSuccess) {
                    this.toastService.success('Question created successfully');
                    // Navigate back to the forum's question list
                    this.router.navigate(['/public/forums', this.slug]);
                } else {
                    this.toastService.error(res.error?.Message || 'Failed to create question');
                }
            },
            error: (err) => {
                this.isSubmitting = false;
                this.loaderService.hide();
                this.toastService.error('An unexpected error occurred');
            }
        });
    }

    onTitleChange() {
        // This method is called on input to trigger change detection
        // Can be used for future enhancements like auto-suggestions
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
        return 'Ask in News';
    }

    get newsHeroDescription(): string {
        return `Start a focused discussion in ${this.forum?.title || 'News'} and give readers enough context to answer clearly.`;
    }

    get communityHeroTitle(): string {
        return 'Ask in Community';
    }

    get communityHeroDescription(): string {
        return `Start a helpful conversation in ${this.forum?.title || 'Community'} and give neighbors enough context to respond well.`;
    }

    get cultureHeroTitle(): string {
        return 'Ask in Culture';
    }

    get cultureHeroDescription(): string {
        return `Start a thoughtful discussion in ${this.forum?.title || 'Culture'} and give readers enough context to answer clearly.`;
    }

    get educationHeroTitle(): string {
        return 'Ask in Education';
    }

    get educationHeroDescription(): string {
        return `Start a clear question in ${this.forum?.title || 'Education'} and give enough context for helpful answers.`;
    }

    get healthHeroTitle(): string {
        return 'Ask in Health';
    }

    get healthHeroDescription(): string {
        return `Start a clear question in ${this.forum?.title || 'Health'} and include the symptoms, service, or resource you need help with.`;
    }

    get housingHeroTitle(): string {
        return 'Ask in Housing';
    }

    get housingHeroDescription(): string {
        return `Start a clear question in ${this.forum?.title || 'Housing'} and include the area, budget, or program details that matter.`;
    }

    get titlePlaceholder(): string {
        switch (this.slug) {
            case 'housing':
                return 'e.g., How do I apply for affordable housing in Brooklyn?';
            case 'health':
                return 'e.g., Where can I find free health screenings in Queens?';
            case 'education':
                return 'e.g., How do I register my child for a public school transfer?';
            default:
                return 'e.g., What is the best way to get started with this topic?';
        }
    }
}
