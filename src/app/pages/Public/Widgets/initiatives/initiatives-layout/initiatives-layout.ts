import { Component, OnInit, ElementRef, Renderer2, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostsService } from '../../feeds/services/posts';
import { environment } from '../../../../../environments/environment';
import { CATEGORY_THEMES, CategoryEnum } from '../../feeds/models/categories';

@Component({
  standalone: true,
  selector: 'app-initiatives-layout',
  templateUrl: './initiatives-layout.html',
  styleUrls: ['./initiatives-layout.scss'],
  imports: [CommonModule, FormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InitiativesLayoutComponent implements OnInit {
  initiatives: any[] = [];
  loading = true;

  // إعدادات الثيم
  currentCategory = 0;
  pageTitle = '';
  themeColor = '#00c3ff';
  themeLight = 'rgba(0, 195, 255, 0.1)';

  // البحث والفلاتر
  searchQuery = '';

  // الباجينيشن
  currentPage = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;
  protected readonly environment = environment;

  constructor(
    private route: ActivatedRoute,
    private postsService: PostsService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.currentCategory = data['categoryEnum'];
      this.pageTitle = data['title'];

      // Use efficient lookup from centralized themes
      const theme = CATEGORY_THEMES[this.currentCategory as CategoryEnum];
      if (theme) {
        this.themeColor = theme.color;
      } else {
        this.themeColor = data['themeColor'] || '#00c3ff';
      }

      this.themeLight = this.themeColor + '1a'; // 10% opacity

      this.loadInitiatives();
      this.cdr.markForCheck();
    });
  }

  loadInitiatives() {
    if (this.initiatives.length === 0) {
      this.loading = true;
      this.cdr.markForCheck();
    }
    const params = {
      page: this.currentPage,
      pageSize: this.pageSize,
      category: this.currentCategory,
      type: 4, // 4 = Initiative حسب الـ Enum
      search: this.searchQuery
    };

    this.postsService.getFeed(params).subscribe({
      next: (res: any) => {
        if (res.isSuccess) {
          this.initiatives = this.mapData(res.data);
          this.totalCount = res.totalCount;
          this.totalPages = res.totalPages;
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load initiatives', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  mapData(data: any[]): any[] {
    const mapped = data.map(item => ({
      ...item,
      // صورة افتراضية في حالة عدم وجود صورة
      image: this.resolvePostImage(item),
      // استخدام العنوان والوصف
      title: item.title,
      description: item.content,
      // تنسيق التاريخ والمكان
      date: item.createdAt,
      locationName: item.location?.neighborhood || 'NYC Wide',
      // اسم المؤسسة أو الناشر
      organizer: item.author?.fullName || 'Community Organization',
      organizerImg: this.resolveAuthorImage(item.author)
    }));

    // Sort: Images first, Text-only last
    return mapped.sort((a, b) => (b.image ? 1 : 0) - (a.image ? 1 : 0));
  }

  onSearch() {
    this.currentPage = 1;
    this.loadInitiatives();
  }

  // --- Image Resolvers ---
  resolvePostImage(post: any): string | null {
    const attachment = post.attachments?.[0];
    let url = attachment?.url || post.imageUrl;
    if (!url || url.trim() === '') return null; // ✅ Null for text-only layout
    url = url.replace('@local://', '');
    if (url.startsWith('http')) return url;
    return `${this.environment.apiBaseUrl3}/${url}`;
  }

  resolveAuthorImage(author: any): string {
    let url = author?.imageUrl;
    if (!url || url.trim() === '') return 'assets/images/default-avatar.png';
    url = url.replace('@local://', '');
    if (url.startsWith('http')) return url;
    return `${this.environment.apiBaseUrl3}/${url}`;
  }
}