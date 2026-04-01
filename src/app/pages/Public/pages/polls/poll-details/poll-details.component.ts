import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../../Authentication/Service/auth';
import { NewsDepartmentHeroComponent } from '../../../Widgets/news-department-hero/news-department-hero.component';
import { NewsPollDetails, NewsPollOption, NewsPollResults, NewsService } from '../../../../../shared/services/news.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import { ImageService } from '../../../../../shared/services/image.service';

@Component({
  selector: 'app-poll-details',
  standalone: true,
  imports: [CommonModule, RouterLink, NewsDepartmentHeroComponent],
  templateUrl: './poll-details.component.html',
  styleUrls: ['./poll-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PollDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly newsService = inject(NewsService);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly imageService = inject(ImageService);

  poll: NewsPollDetails | null = null;
  results: NewsPollResults | null = null;
  selectedOptionIds: number[] = [];
  isLoading = true;
  isSubmittingVote = false;
  pollId = 0;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.pollId = Number(params.get('id') || 0);
      if (!this.pollId) {
        this.isLoading = false;
        this.toastService.error('Invalid poll id.');
        this.cdr.markForCheck();
        return;
      }

      this.loadPoll();
    });
  }

  get coverUrl(): string {
    return this.imageService.resolveImageUrl(this.poll?.coverImageUrl || '');
  }

  get canVote(): boolean {
    return !!this.poll?.canVote && this.authService.isLoggedIn();
  }

  get shouldShowResults(): boolean {
    return !!this.poll && (!!this.poll.showResultsBeforeVoting || !!this.poll.hasVoted);
  }

  get totalVotes(): number {
    return Number(this.results?.totalVotes ?? this.poll?.totalVotes ?? 0);
  }

  isSelected(optionId: number): boolean {
    return this.selectedOptionIds.includes(optionId);
  }

  toggleOption(option: NewsPollOption): void {
    if (!this.poll || !this.canVote || this.isSubmittingVote) {
      return;
    }

    if (this.poll.allowMultipleAnswers) {
      if (this.isSelected(option.id)) {
        this.selectedOptionIds = this.selectedOptionIds.filter((id) => id !== option.id);
      } else {
        this.selectedOptionIds = [...this.selectedOptionIds, option.id];
      }
    } else {
      this.selectedOptionIds = [option.id];
    }

    this.cdr.markForCheck();
  }

  submitVote(): void {
    if (!this.poll) return;

    if (!this.authService.isLoggedIn()) {
      this.toastService.warning('Please log in before voting on a poll.');
      return;
    }

    if (!this.canVote) {
      this.toastService.info('Voting is not available for this poll.');
      return;
    }

    if (!this.selectedOptionIds.length) {
      this.toastService.warning('Choose at least one answer before voting.');
      return;
    }

    this.isSubmittingVote = true;
    this.newsService.voteOnNewsPoll(this.poll.pollId, this.selectedOptionIds).subscribe({
      next: (response: any) => {
        const isSuccess = response?.isSuccess ?? response?.IsSuccess ?? true;
        if (isSuccess) {
          this.toastService.success('Your vote has been recorded.');
          this.loadPoll();
        } else {
          this.isSubmittingVote = false;
          this.toastService.error(response?.error?.message || response?.Error?.Message || 'Failed to submit your vote.');
          this.cdr.markForCheck();
        }
      },
      error: (error) => {
        this.isSubmittingVote = false;
        this.toastService.error(error?.error?.error?.message || error?.error?.message || 'Failed to submit your vote.');
        this.cdr.markForCheck();
      }
    });
  }

  getVotePercent(optionId: number): number {
    const resultOption = this.results?.options?.find((option) => option.id === optionId);
    return Number(resultOption?.votePercent ?? 0);
  }

  getVoteCount(optionId: number): number {
    const resultOption = this.results?.options?.find((option) => option.id === optionId);
    return Number(resultOption?.votes ?? 0);
  }

  private loadPoll(): void {
    this.isLoading = true;

    forkJoin({
      pollResponse: this.newsService.getNewsPollById(this.pollId),
      resultsResponse: this.newsService.getNewsPollResults(this.pollId)
    }).subscribe({
      next: ({ pollResponse, resultsResponse }) => {
        this.poll = pollResponse?.isSuccess ? pollResponse.data : null;
        this.results = resultsResponse?.isSuccess ? resultsResponse.data : null;
        this.selectedOptionIds = Array.isArray(this.poll?.selectedOptionIds) ? [...this.poll!.selectedOptionIds] : [];
        this.isLoading = false;
        this.isSubmittingVote = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.poll = null;
        this.results = null;
        this.selectedOptionIds = [];
        this.isLoading = false;
        this.isSubmittingVote = false;
        this.toastService.error('Failed to load poll details.');
        this.cdr.markForCheck();
      }
    });
  }
}
