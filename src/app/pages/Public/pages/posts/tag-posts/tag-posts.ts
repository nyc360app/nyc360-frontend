import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PostsService } from '../services/posts';
import { Post } from '../models/posts';
import { environment } from '../../../../../environments/environment';
import { CATEGORY_LIST } from '../../../../../pages/models/category-list';
import { CATEGORY_THEMES } from '../../../Widgets/feeds/models/categories';
import { GlobalLoaderService } from '../../../../../shared/components/global-loader/global-loader.service';

@Component({
  selector: 'app-tag-posts',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './tag-posts.html',
  styleUrls: ['./tag-posts.scss']
})
export class TagPostsComponent implements OnInit {

  protected readonly environment = environment;
  private route = inject(ActivatedRoute);
  private postsService = inject(PostsService);
  private cdr = inject(ChangeDetectorRef);
  private loaderService = inject(GlobalLoaderService);

  posts: Post[] = [];

  // هذه المصفوفة ستحمل التاجات المستخرجة من البوستات
  relatedTags: string[] = [];

  tagName: string = '';
  isLoaded = false;
  totalCount = 0;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const rawTag = params.get('tag');
      if (rawTag) {
        this.tagName = rawTag;
        this.loadTagPosts(this.tagName);
      }
    });
  }

  loadTagPosts(tag: string) {
    this.isLoaded = false;
    this.posts = [];
    this.loaderService.show();
    this.relatedTags = []; // تصفية التاجات القديمة

    // طلب 10 بوستات فقط للسرعة
    this.postsService.getPostsByTag(tag, 1, 10).subscribe({
      next: (res) => {
        this.isLoaded = true;
        this.loaderService.hide();

        if (res.isSuccess) {
          if (Array.isArray(res.data)) {
            this.posts = res.data.map(p => ({
              ...p,
              content: this.stripHtml(p.content)
            }));
            this.totalCount = res.totalCount ?? this.posts.length;

            // 🔥 استخراج التاجات من البوستات (Extraction Logic)
            this.extractRelatedTags(this.posts);
          } else {
            this.posts = [];
          }
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoaded = true;
        this.loaderService.hide();
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }

  // دالة لاستخراج وتجميع التاجات من البوستات
  extractRelatedTags(posts: Post[]) {
    const allTags = new Set<string>();

    posts.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(t => allTags.add(t));
      }
    });

    // تحويل الـ Set لمصفوفة وأخذ أول 15 تاج مثلاً
    // ونستبعد التاج الحالي الذي نبحث عنه لعدم التكرار
    this.relatedTags = Array.from(allTags)
      .filter(t => t.toLowerCase() !== this.tagName.toLowerCase())
      .slice(0, 20);
  }

  private stripHtml(html: string | null | undefined): string {
    if (!html) return '';
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
    } catch {
      return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    }
  }

  // --- Helpers ---
  get displayTagName(): string {
    if (!this.tagName) return '';
    return this.tagName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getCategoryName(id: number): string {
    const cat = CATEGORY_LIST.find(c => c.id === id);
    return cat ? cat.name : 'General';
  }

  getCategoryColor(id: number): string {
    const theme = (CATEGORY_THEMES as any)[id];
    return theme ? theme.color : '#d4af37';
  }

  getCategoryIcon(id: number): string {
    const theme = (CATEGORY_THEMES as any)[id];
    return theme ? theme.icon : '';
  }

  getAuthorName(author: any): string {
    if (!author) return 'NYC360';
    if (typeof author === 'string') return author;
    return author.name || author.username || 'NYC360';
  }

  resolvePostImage(post: Post): string {
    const attachment = post.attachments?.[0];
    let url = attachment?.url || post.imageUrl;

    if (!url || url.trim() === '') return 'assets/images/default-placeholder.jpg';

    // تنظيف المسار
    url = url.replace('@local://', '');

    // لو لينك خارجي
    if (url.startsWith('http')) return url;

    // لو صورة من السيرفر (posts)
    return `${this.environment.apiBaseUrl3}/${url}`;
  }
}