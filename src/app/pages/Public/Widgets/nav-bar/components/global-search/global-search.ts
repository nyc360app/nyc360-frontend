import { Component, OnInit, OnDestroy, Input, inject, ChangeDetectorRef, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, NavigationEnd, Event as RouterEvent } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription, debounceTime, distinctUntilChanged, tap, filter, switchMap, catchError, of, finalize } from 'rxjs';
import { SearchService, SearchResult } from '../../../services/search.service';
import { CategoryEnum } from '../../../feeds/models/categories';
import { AuthService } from '../../../../../Authentication/Service/auth';

@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './global-search.component.html',
  styleUrls: ['./global-search.component.scss']
})
export class GlobalSearchComponent implements OnInit, OnDestroy {
  @Input() currentActiveCat: any = null;
  @Input() isMobile = false;

  private searchService = inject(SearchService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private elementRef = inject(ElementRef);

  searchControl = new FormControl('');
  searchResults: SearchResult | null = null;
  activeSearchTab: 'all' | 'posts' | 'users' | 'communities' | 'tags' = 'all';
  isSearching = false;
  showSearchResults = false;
  searchError = false;
  isLoggedIn = false;

  private searchSub!: Subscription;
  private userSub!: Subscription;

  ngOnInit() {
    this.userSub = this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
    });

    this.searchSub = this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(term => {
        if (!term || term.length < 2) {
          this.searchResults = null;
          this.showSearchResults = false;
          this.cdr.detectChanges();
        }
      }),
      filter(term => !!term && term.length >= 2),
      tap(() => {
        this.isSearching = true;
        this.showSearchResults = true;
        this.searchError = false;
        this.cdr.detectChanges();
      }),
      switchMap(term => {
        let division: number | undefined;
        if (this.currentActiveCat) {
          const catId = this.currentActiveCat.id.toLowerCase();
          const enumKey = Object.keys(CategoryEnum).find(key => key.toLowerCase() === catId) as keyof typeof CategoryEnum;
          if (enumKey) {
            division = CategoryEnum[enumKey] as unknown as number;
          }
        }
        return this.searchService.search(term!, division).pipe(
          catchError(err => {
            console.error('Search API error', err);
            this.searchError = true;
            return of(null);
          }),
          finalize(() => {
            this.isSearching = false;
            this.cdr.detectChanges();
          })
        );
      })
    ).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.isSearching = false;
        if (results) {
          this.activeSearchTab = 'all';
        }
        this.cdr.detectChanges();
      }
    });

    // Close on route change
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.closeSearch();
    });
  }

  onSearchFocus() {
    if (this.searchControl.value && this.searchControl.value.length >= 2) {
      this.showSearchResults = true;
    }
  }

  closeSearch() {
    this.showSearchResults = false;
    this.cdr.detectChanges();
  }

  switchSearchTab(tab: 'all' | 'posts' | 'users' | 'communities' | 'tags') {
    this.activeSearchTab = tab;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeSearch();
    }
  }

  ngOnDestroy() {
    if (this.searchSub) this.searchSub.unsubscribe();
    if (this.userSub) this.userSub.unsubscribe();
  }
}
