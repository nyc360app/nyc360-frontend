import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { environment } from '../../../../../../environments/environment';
import { RssService } from '../../services/rss';
import { RssSource } from '../../models/rss';
import { CATEGORY_THEMES, CategoryEnum } from '../../../../../Public/Widgets/feeds/models/categories';

@Component({
  selector: 'app-rss-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './rss-list.html',
  styleUrls: ['./rss-list.scss']
})
export class RssListComponent implements OnInit {

  protected readonly environment = environment;

  private rssService = inject(RssService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  rssList: RssSource[] = [];
  isLoading = true;
  errorMessage = '';

  categories = Object.entries(CATEGORY_THEMES).map(([key, value]) => ({
    id: Number(key),
    ...value
  }));

  // Dashboard Stats
  stats = {
    total: 0,
    active: 0,
    categoriesCount: 0
  };

  ngOnInit() {
    this.loadRssFeeds();
  }

  loadRssFeeds() {
    this.isLoading = true;
    this.errorMessage = '';

    this.rssService.getAllRssSources().subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.rssList = res.data || [];
          this.calculateStats();
        } else {
          this.errorMessage = res.error?.message || 'Failed to load RSS feeds.';
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Network Error.';
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }

  calculateStats() {
    this.stats.total = this.rssList.length;
    this.stats.active = this.rssList.filter(r => r.isActive).length;
    // Count unique categories used
    const cats = new Set(this.rssList.map(r => r.category));
    this.stats.categoriesCount = cats.size;
  }

  getCategoryName(id: number): string {
    const cat = this.categories.find(c => c.id === id);
    return cat ? cat.label : 'Unknown';
  }

  getCategoryTheme(id: number) {
    return CATEGORY_THEMES[id as CategoryEnum] || { color: '#333', label: 'Unknown', path: '' };
  }

  onDelete(id: number) {
    if (confirm('Are you sure you want to delete this source?')) {
      this.isLoading = true; // Show loading
      this.rssService.deleteRssSource(id).subscribe({
        next: () => {
          this.loadRssFeeds();
        },
        error: () => {
          alert('Failed to delete.');
          this.isLoading = false;
        }
      });
    }
  }

  onEdit(item: RssSource) {
    this.router.navigate(['/admin/rss/edit'], { state: { data: item } });
  }
}