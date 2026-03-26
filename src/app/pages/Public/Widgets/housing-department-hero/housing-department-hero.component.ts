import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, Input, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../Authentication/Service/auth';
import { VerificationModalComponent } from '../../../../shared/components/verification-modal/verification-modal';
import { getDepartmentArticleCreateRoute, getDepartmentDashboardRoute, getDepartmentDiscussionsRoute, getDepartmentExploreRoute, getDepartmentListingSubmitRoute, getDepartmentRssConnectRoute, getDepartmentSavedRoute } from '../feeds/models/categories';

interface HeroButtonChild {
  label: string;
  link: any[];
  icon?: string;
  isAction?: boolean;
  opensVerification?: boolean;
  queryParams?: any;
}

interface HeroButton {
  label: string;
  link?: any[];
  icon?: string;
  queryParams?: any;
  isDropdown?: boolean;
  children?: HeroButtonChild[];
}

@Component({
  selector: 'app-housing-department-hero',
  standalone: true,
  imports: [CommonModule, RouterModule, VerificationModalComponent],
  templateUrl: './housing-department-hero.component.html',
  styleUrls: ['./housing-department-hero.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HousingDepartmentHeroComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  @Input() title = 'Housing';
  @Input() description = 'Listings, housing programs, and practical guidance for New Yorkers.';
  @Input() searchPlaceholder = 'Search homes, programs, or housing updates...';
  @Input() showSearch = true;

  readonly themeColor = '#B59B62';
  readonly categoryId = 4;
  readonly categoryName = 'Housing';
  readonly housingOccupations = [
    { id: 1854, name: 'Housing Advisor' },
    { id: 1855, name: 'Housing Organization' },
    { id: 1856, name: 'Licensed Agent' }
  ];

  readonly headerButtons: HeroButton[] = [
    { label: 'Explore', link: [getDepartmentExploreRoute('housing')], icon: 'bi-rss' },
    { label: 'My Inquiries', link: [getDepartmentSavedRoute('housing')], icon: 'bi-journal-text' },
    { label: 'Contributor Dashboard', link: [getDepartmentDashboardRoute('housing')], icon: 'bi-speedometer2' },
    {
      label: 'Contributor Activity',
      icon: 'bi-activity',
      isDropdown: true,
      children: [
        {
          label: 'Start Housing Journey',
          link: [],
          icon: 'bi-stars',
          opensVerification: true
        },
        {
          label: 'Add a Location or Organization',
          link: [getDepartmentListingSubmitRoute('housing')],
          icon: 'bi-geo-alt-fill'
        },
        {
          label: 'Write Post or Article',
          link: [getDepartmentArticleCreateRoute('housing')],
          icon: 'bi-pencil-square',
          isAction: true
        },
        {
          label: 'Import RSS Feed',
          link: [getDepartmentRssConnectRoute('housing')],
          icon: 'bi-broadcast',
          isAction: true
        },
        {
          label: 'Create Housing Listing',
          link: ['/housing/create/renting'],
          icon: 'bi-key'
        }
      ]
    },
    { label: 'Ask a Question', link: [getDepartmentDiscussionsRoute('housing')], icon: 'bi-question-circle' }
  ];

  showVerificationModal = false;

  ngOnInit(): void {
    this.authService.fullUserInfo$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.markForCheck());
  }

  onSearch(query: string): void {
    const normalizedQuery = query.trim();
    this.router.navigate([getDepartmentExploreRoute('housing')], {
      queryParams: normalizedQuery ? { search: normalizedQuery } : {}
    });
  }

  hasContributorAccess(): boolean {
    return this.authService.hasHousingPermission();
  }

  handleContributorAction(event: Event): void {
    if (this.hasContributorAccess()) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.showVerificationModal = true;
    this.cdr.markForCheck();
  }

  openVerificationRequest(): void {
    this.showVerificationModal = true;
    this.cdr.markForCheck();
  }

  onVerified(): void {
    this.authService.fetchFullUserInfo().subscribe();
    this.closeModal();
  }

  closeModal(): void {
    this.showVerificationModal = false;
    this.cdr.markForCheck();
  }
}
