import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ForumService } from '../../services/forum.service';
import { GlobalLoaderService } from '../../../../../../shared/components/global-loader/global-loader.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { Forum } from '../../models/forum';

@Component({
    selector: 'app-create-question',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
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
}
