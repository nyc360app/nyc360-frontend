
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ForumService } from '../../services/forum.service';
import { GlobalLoaderService } from '../../../../../../shared/components/global-loader/global-loader.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { Question, Answer } from '../../models/forum';
import { InitialsAvatarComponent } from '../../../../../../shared/components/initials-avatar/initials-avatar.component';

@Component({
    selector: 'app-question-details',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, InitialsAvatarComponent],
    templateUrl: './question-details.component.html',
    styleUrls: ['./question-details.component.scss']
})
export class QuestionDetailsComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private forumService = inject(ForumService);
    private loaderService = inject(GlobalLoaderService);
    private toastService = inject(ToastService);

    questionId: number = 0;
    question: Question | null = null;
    answers: Answer[] = [];

    answerContent: string = '';
    isSubmitting = false;
    showAnswerForm = false;

    ngOnInit() {
        this.route.params.subscribe(params => {
            console.log('QuestionDetailsComponent params:', params);
            this.questionId = +params['id'];
            if (this.questionId) {
                this.loadQuestionDetails();
            } else {
                console.warn('No valid questionId found in params:', params);
            }
        });
    }

    loadQuestionDetails() {
        this.loaderService.show();
        this.forumService.getQuestionDetails(this.questionId).subscribe({
            next: (res: any) => {
                this.loaderService.hide();
                // Support both camelCase and PascalCase
                const isSuccess = res.isSuccess ?? res.IsSuccess;
                const data = res.data ?? res.Data;
                const error = res.error ?? res.Error;

                if (isSuccess && data) {
                    this.question = data.question ?? data.Question;
                    this.answers = data.answers ?? data.Answers;
                } else {
                    console.error('Question details load failed:', res);
                    const errorMessage = error?.Message ?? error?.message ?? 'Question not found';
                    this.toastService.error(errorMessage);
                    // Don't redirect immediately so the user can see the error
                    // only redirect if it's clearly a "not found" case after a delay or based on a specific flag
                }
            },
            error: (err) => {
                this.loaderService.hide();
                console.error('Failed to load question details:', err);
                const errorMessage = err.error?.error?.Message ?? err.error?.Message ?? 'Failed to load question details';
                this.toastService.error(errorMessage);

                // Only redirect if it's a 404 Not Found and we're sure
                if (err.status === 404) {
                    this.toastService.error('The requested question was not found');
                    // Optional: redirect after showing the message
                    // setTimeout(() => this.router.navigate(['/public/forums']), 3000);
                }
            }
        });
    }

    toggleAnswerForm() {
        if (this.question?.isLocked) {
            this.toastService.warning('This question is locked and cannot accept new answers');
            return;
        }
        this.showAnswerForm = !this.showAnswerForm;
        if (!this.showAnswerForm) {
            this.answerContent = '';
        }
    }

    onSubmitAnswer() {
        if (!this.question || this.question.isLocked) return;
        if (!this.answerContent.trim()) {
            this.toastService.warning('Please provide an answer');
            return;
        }

        this.isSubmitting = true;
        this.loaderService.show();

        const payload = {
            QuestionId: this.questionId,
            Content: this.answerContent
        };

        this.forumService.createAnswer(payload).subscribe({
            next: (res) => {
                this.isSubmitting = false;
                this.loaderService.hide();
                if (res.isSuccess) {
                    this.toastService.success('Answer posted successfully');
                    this.answerContent = '';
                    this.showAnswerForm = false;
                    // Reload the question to get the new answer
                    this.loadQuestionDetails();
                } else {
                    this.toastService.error(res.error?.Message || 'Failed to post answer');
                }
            },
            error: () => {
                this.isSubmitting = false;
                this.loaderService.hide();
                this.toastService.error('An unexpected error occurred');
            }
        });
    }

    getTimeSince(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };

        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
            }
        }

        return 'just now';
    }

    getAuthorBadgeClass(type: number): string {
        switch (type) {
            case 1: return 'badge-admin';
            case 2: return 'badge-moderator';
            case 3: return 'badge-verified';
            default: return 'badge-member';
        }
    }

    getAuthorBadgeText(type: number): string {
        switch (type) {
            case 1: return 'Admin';
            case 2: return 'Moderator';
            case 3: return 'Verified';
            default: return 'Member';
        }
    }
}
