import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CommunityService } from '../../services/community';
import { CommunityPost } from '../../models/community';
import { environment } from '../../../../../../environments/environment';

const PAGE_SIZE = 12;
const LIST_COUNT = 3;

const DUMMY_POSTS: CommunityPost[] = [
  {
    id: 0, createdAt: '2026-03-08', category: 1,
    title: 'NYC Officials Announce New Policy Updates Impacting City Services',
    content: 'City leaders introduce new policy decisions that may influence transportation, housing, and public services across all five boroughs.',
    author: { id: 1, name: 'Marcus Sterling', imageUrl: '' },
    attachments: [{ id: 1, url: 'assets/images/nyc-city.jpg' }],
    stats: { views: 0, likes: 0, dislikes: 0, comments: 0, shares: 0 },
    tags: ['Community', 'Politics']
  },
  {
    id: 0, createdAt: '2026-04-11', category: 1,
    title: 'New Yorkers Take to the Streets in Major Policy Protest',
    content: 'A massive wave of demonstrators gathered in the heart of the city today to express concerns over recent legislative changes affecting local neighborhoods.',
    author: { id: 1, name: 'Marcus Sterling', imageUrl: '' },
    attachments: [{ id: 2, url: 'assets/images/nyc-city.jpg' }],
    stats: { views: 0, likes: 0, dislikes: 0, comments: 0, shares: 0 },
    tags: ['Community', 'Politics']
  },
  {
    id: 0, createdAt: '2026-04-13', category: 1,
    title: 'Independent Bookstores See Record Sales at the End of the Year',
    content: 'A curated theatre event bringing together creativity, emotion, and live performance as local bookstores report record-breaking community engagement.',
    author: { id: 1, name: 'Marcus Sterling', imageUrl: '' },
    attachments: [{ id: 3, url: 'assets/images/nyc-city.jpg' }],
    stats: { views: 0, likes: 0, dislikes: 0, comments: 0, shares: 0 },
    tags: ['Community', 'Books', 'Library']
  },
  {
    id: 0, createdAt: '2026-04-13', category: 1,
    title: 'Chinatown Dumpling Crawl',
    content: 'A self guided culinary adventure through the winding streets of Chinatown, featuring 7 must visit spots for self guided culinary exploration.',
    author: { id: 1, name: 'Marcus Sterling', imageUrl: '' },
    attachments: [{ id: 4, url: 'assets/images/nyc-city.jpg' }],
    stats: { views: 0, likes: 0, dislikes: 0, comments: 0, shares: 0 },
    tags: ['Community', 'Food']
  },
  {
    id: 0, createdAt: '2026-04-13', category: 1,
    title: 'Brooklyn Bridge Park Summer Events',
    content: 'A self guided culinary adventure through the winding streets of Brooklyn, featuring 7 must visit spots for self guided culinary exploration.',
    author: { id: 2, name: 'Sarah Chen', imageUrl: '' },
    attachments: [{ id: 5, url: 'assets/images/nyc-city.jpg' }],
    stats: { views: 0, likes: 0, dislikes: 0, comments: 0, shares: 0 },
    tags: ['Community', 'Events']
  },
  {
    id: 0, createdAt: '2026-04-13', category: 1,
    title: 'Harlem Renaissance Art Exhibition Opens',
    content: 'A self guided culinary adventure through the winding streets of Harlem, featuring 7 must visit spots for self guided cultural exploration.',
    author: { id: 3, name: 'James Rivera', imageUrl: '' },
    attachments: [{ id: 6, url: 'assets/images/nyc-city.jpg' }],
    stats: { views: 0, likes: 0, dislikes: 0, comments: 0, shares: 0 },
    tags: ['Community', 'Culture', 'Art']
  },
  {
    id: 0, createdAt: '2026-04-13', category: 1,
    title: 'Queens Night Market Returns for Another Season',
    content: 'A self guided culinary adventure through the winding streets of Queens, featuring 7 must visit spots for self guided culinary exploration.',
    author: { id: 2, name: 'Sarah Chen', imageUrl: '' },
    attachments: [{ id: 7, url: 'assets/images/nyc-city.jpg' }],
    stats: { views: 0, likes: 0, dislikes: 0, comments: 0, shares: 0 },
    tags: ['Community', 'Food', 'Events']
  },
  {
    id: 0, createdAt: '2026-04-13', category: 1,
    title: 'Bronx Community Garden Initiative Expands',
    content: 'A self guided culinary adventure through the winding streets of the Bronx, featuring 7 must visit spots for self guided culinary exploration.',
    author: { id: 3, name: 'James Rivera', imageUrl: '' },
    attachments: [{ id: 8, url: 'assets/images/nyc-city.jpg' }],
    stats: { views: 0, likes: 0, dislikes: 0, comments: 0, shares: 0 },
    tags: ['Community', 'Environment']
  },
  {
    id: 0, createdAt: '2026-04-13', category: 1,
    title: 'Staten Island Ferry Celebrates 100 Years',
    content: 'A self guided culinary adventure through the winding streets of Staten Island, featuring 7 must visit spots for self guided culinary exploration.',
    author: { id: 1, name: 'Marcus Sterling', imageUrl: '' },
    attachments: [{ id: 9, url: 'assets/images/nyc-city.jpg' }],
    stats: { views: 0, likes: 0, dislikes: 0, comments: 0, shares: 0 },
    tags: ['Community', 'Transportation', 'History']
  }
];

@Component({
  selector: 'app-community-top-news',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './community-top-news.html',
  styleUrls: ['./community-top-news.scss']
})
export class CommunityTopNewsComponent implements OnInit {
  private communityService = inject(CommunityService);

  allPosts: CommunityPost[] = [];
  isLoading = true;
  currentPage = 1;
  totalCount = 0;
  usingDummy = false;

  get totalPages(): number {
    if (this.usingDummy) return Math.ceil(DUMMY_POSTS.length / PAGE_SIZE);
    return Math.max(1, Math.ceil(this.totalCount / PAGE_SIZE));
  }

  get listPosts(): CommunityPost[] {
    return this.allPosts.slice(0, LIST_COUNT);
  }

  get gridPosts(): CommunityPost[] {
    return this.allPosts.slice(LIST_COUNT);
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    const cur = this.currentPage;
    const pages: number[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (cur > 3) pages.push(-1);
    for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i);
    if (cur < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  }

  ngOnInit() { this.load(); }

  load() {
    this.isLoading = true;
    this.communityService.getCommunityHome(this.currentPage, PAGE_SIZE).subscribe({
      next: (res) => {
        this.isLoading = false;
        const raw = Array.isArray(res?.data?.feed?.data) ? res.data.feed.data : [];
        const posts = raw.map((item: any) => this.normalize(item)).filter(Boolean) as CommunityPost[];

        if (posts.length > 0) {
          this.allPosts = posts;
          this.totalCount = res.data.feed?.totalCount || posts.length;
          this.usingDummy = false;
        } else {
          // fallback to dummy data so page is never blank
          this.allPosts = DUMMY_POSTS;
          this.totalCount = DUMMY_POSTS.length;
          this.usingDummy = true;
        }
      },
      error: () => {
        this.isLoading = false;
        this.allPosts = DUMMY_POSTS;
        this.totalCount = DUMMY_POSTS.length;
        this.usingDummy = true;
      }
    });
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  hasMedia(post: CommunityPost): boolean {
    return !!post.attachments?.some(a => !!a.url?.trim());
  }

  resolveImage(url?: string): string {
    if (!url || !url.trim()) return 'assets/images/nyc-city.jpg';
    const clean = url.replace('@local://', '');
    if (clean.startsWith('http') || clean.startsWith('assets/')) return clean;
    return `${environment.apiBaseUrl3}/${clean}`;
  }

  excerpt(text: string | null | undefined, max: number): string {
    const clean = String(text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return clean.length <= max ? clean : clean.slice(0, max).trim() + ' .....';
  }

  formatDate(value?: string | null): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: '2-digit', year: 'numeric' }).format(d);
  }

  authorName(post: CommunityPost): string {
    if (typeof post.author === 'string') return post.author || 'Community Member';
    return (post.author as any)?.name || 'Community Member';
  }

  authorOrg(post: CommunityPost): string {
    if (typeof post.author === 'object' && post.author) {
      return (post.author as any)?.organization || (post.author as any)?.orgName || 'STERLING ESTATES GROUP';
    }
    return 'NYC360 COMMUNITY';
  }

  authorInitials(post: CommunityPost): string {
    const name = this.authorName(post);
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (parts[0] || 'NY').slice(0, 2).toUpperCase();
  }

  authorColor(post: CommunityPost): string {
    const colors = ['#1e3a5f', '#2d6a4f', '#7b2d8b', '#c0392b', '#d35400', '#1a5276'];
    const name = this.authorName(post);
    const idx = name.charCodeAt(0) % colors.length;
    return colors[idx];
  }

  private normalize(item: any): CommunityPost | null {
    const title = String(item?.title || '').trim();
    const content = String(item?.content || '').trim();
    const attachments = Array.isArray(item?.attachments)
      ? item.attachments.filter((a: any) => !!a?.url?.trim()).map((a: any) => ({ id: a.id || 0, url: a.url }))
      : [];
    if (!title && !content && !attachments.length) return null;
    return {
      ...item, title, content, attachments,
      stats: { views: 0, likes: 0, dislikes: 0, comments: 0, shares: 0, ...(item?.stats || {}) },
      tags: Array.isArray(item?.tags) ? item.tags.filter(Boolean) : []
    };
  }
}
