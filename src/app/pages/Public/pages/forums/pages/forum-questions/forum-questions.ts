import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ForumService } from '../../services/forum.service';
import { Forum, Question, ApiResponse, ForumDetailsData } from '../../models/forum';
import { GlobalLoaderService } from '../../../../../../shared/components/global-loader/global-loader.service';
import { InitialsAvatarComponent } from '../../../../../../shared/components/initials-avatar/initials-avatar.component';

@Component({
    selector: 'app-forum-questions',
    standalone: true,
    imports: [CommonModule, RouterLink, InitialsAvatarComponent],
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
}