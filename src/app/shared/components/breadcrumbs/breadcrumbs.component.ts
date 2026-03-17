import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter, Subscription } from 'rxjs';

export interface Breadcrumb {
    label: string;
    url: string;
}

const ROUTE_MAP: Array<{
    match: RegExp;
    crumbs: (m: RegExpMatchArray, full: string) => Breadcrumb[];
}> = [
        // Category Pages
        { match: /^\/category\/([^/]+)$/, crumbs: (m) => [{ label: formatDepartmentLabel(m[1]), url: `/public/category/${m[1]}` }] },
        { match: /^\/category\/([^/]+)\/saved$/, crumbs: (m, f) => [{ label: formatDepartmentLabel(m[1]), url: `/public/category/${m[1]}` }, { label: 'My Inquiries', url: f }] },
        { match: /^\/category\/([^/]+)\/dashboard$/, crumbs: (m, f) => [{ label: formatDepartmentLabel(m[1]), url: `/public/category/${m[1]}` }, { label: 'Contributor Dashboard', url: f }] },

        // Community
        { match: /^\/community$/, crumbs: () => [{ label: 'Community', url: '/public/community' }] },
        { match: /^\/community\/([^/]+)\/manage$/, crumbs: (m, f) => [{ label: 'Community', url: '/public/community' }, { label: m[1].replace(/-/g, ' '), url: `/public/community/${m[1]}` }, { label: 'Manage Community', url: f }] },
        { match: /^\/community\/([^/]+)$/, crumbs: (m, f) => [{ label: 'Community', url: '/public/community' }, { label: m[1].replace(/-/g, ' '), url: f }] },
        { match: /^\/create-community$/, crumbs: () => [{ label: 'Community', url: '/public/community' }, { label: 'Create Community', url: '/public/create-community' }] },
        { match: /^\/community\/([^/]+)\/create-post$/, crumbs: (m, f) => [{ label: 'Community', url: '/public/community' }, { label: 'Create Post', url: f }] },
        { match: /^\/discover$/, crumbs: () => [{ label: 'Community', url: '/public/community' }, { label: 'Discover', url: '/public/discover' }] },
        { match: /^\/my-communities$/, crumbs: () => [{ label: 'Community', url: '/public/community' }, { label: 'My Communities', url: '/public/my-communities' }] },

        // Housing
        { match: /^\/housing\/home$/, crumbs: () => [{ label: 'Housing', url: '/public/housing/home' }] },
        { match: /^\/housing\/feed$/, crumbs: () => [{ label: 'Housing', url: '/public/housing/home' }, { label: 'Explore', url: '/public/housing/feed' }] },
        { match: /^\/housing\/create\/renting$/, crumbs: () => [{ label: 'Housing', url: '/public/housing/home' }, { label: 'Create Listing', url: '/public/housing/create/renting' }] },
        { match: /^\/housing\/create\/sale$/, crumbs: () => [{ label: 'Housing', url: '/public/housing/home' }, { label: 'Create Sale', url: '/public/housing/create/sale' }] },
        { match: /^\/housing\/listing-authorization$/, crumbs: () => [{ label: 'Housing', url: '/public/housing/home' }, { label: 'Listing Authorization', url: '/public/housing/listing-authorization' }] },
        { match: /^\/housing\/details\/([^/]+)$/, crumbs: (m, f) => [{ label: 'Housing', url: '/public/housing/home' }, { label: 'Property Details', url: f }] },
        { match: /^\/housing\/agent\/dashboard$/, crumbs: () => [{ label: 'Housing', url: '/public/housing/home' }, { label: 'Agent Dashboard', url: '/public/housing/agent/dashboard' }] },
        { match: /^\/housing\/agent\/dashboard\/requests$/, crumbs: () => [{ label: 'Housing', url: '/public/housing/home' }, { label: 'Agent Dashboard', url: '/public/housing/agent/dashboard' }, { label: 'Agent Requests', url: '/public/housing/agent/dashboard/requests' }] },
        { match: /^\/housing\/agent\/dashboard\/listings$/, crumbs: () => [{ label: 'Housing', url: '/public/housing/home' }, { label: 'Agent Dashboard', url: '/public/housing/agent/dashboard' }, { label: 'My Listings', url: '/public/housing/agent/dashboard/listings' }] },
        { match: /^\/housing\/my-requests$/, crumbs: () => [{ label: 'Housing', url: '/public/housing/home' }, { label: 'My Requests', url: '/public/housing/my-requests' }] },
        { match: /^\/housing\/edit\/renting\/([^/]+)$/, crumbs: (m, f) => [{ label: 'Housing', url: '/public/housing/home' }, { label: 'Edit Rental', url: f }] },
        { match: /^\/housing\/edit\/sale\/([^/]+)$/, crumbs: (m, f) => [{ label: 'Housing', url: '/public/housing/home' }, { label: 'Edit Sale', url: f }] },
        { match: /^\/housing\/edit\/([^/]+)$/, crumbs: (m, f) => [{ label: 'Housing', url: '/public/housing/home' }, { label: 'Edit Listing', url: f }] },
        { match: /^\/housing(?:\/.*)?$/, crumbs: () => [{ label: 'Housing', url: '/public/housing/home' }] },

        // Professions / Jobs
        { match: /^\/profession(?:\/feed)?$/, crumbs: () => [{ label: 'Professions', url: '/public/profession/feed' }] },
        { match: /^\/profession\/jobs$/, crumbs: () => [{ label: 'Professions', url: '/public/profession/feed' }, { label: 'Job Search', url: '/public/profession/jobs' }] },
        { match: /^\/profession\/my-applications$/, crumbs: () => [{ label: 'Professions', url: '/public/profession/feed' }, { label: 'My Applications', url: '/public/profession/my-applications' }] },
        { match: /^\/profession\/my-offers$/, crumbs: () => [{ label: 'Professions', url: '/public/profession/feed' }, { label: 'My Offers', url: '/public/profession/my-offers' }] },
        { match: /^\/create-offer$/, crumbs: () => [{ label: 'Professions', url: '/public/profession/feed' }, { label: 'Create Offer', url: '/public/create-offer' }] },
        { match: /^\/edit-offer\/([^/]+)$/, crumbs: (m, f) => [{ label: 'Professions', url: '/public/profession/feed' }, { label: 'Edit Offer', url: f }] },
        { match: /^\/job-profile\/([^/]+)$/, crumbs: (m, f) => [{ label: 'Professions', url: '/public/profession/feed' }, { label: 'Job Details', url: f }] },

        // Forums
        { match: /^\/forums$/, crumbs: () => [{ label: 'Forums', url: '/public/forums' }] },
        { match: /^\/forums\/([^/]+)\/create$/, crumbs: (m, f) => [{ label: 'Forums', url: '/public/forums' }, { label: formatDepartmentLabel(m[1]), url: `/public/forums/${m[1]}` }, { label: 'Ask A Question', url: f }] },
        { match: /^\/forums\/([^/]+)$/, crumbs: (m, f) => [{ label: 'Forums', url: '/public/forums' }, { label: formatDepartmentLabel(m[1]), url: f }] },
        { match: /^\/forums\/questions\/([^/]+)$/, crumbs: (m, f) => [{ label: 'Forums', url: '/public/forums' }, { label: 'Question Details', url: f }] },

        // Feed by Department
        { match: /^\/feed\/([^/]+)$/, crumbs: (m, f) => [{ label: formatDepartmentLabel(m[1]), url: departmentHomeRoute(m[1]) }, { label: 'Explore', url: f }] },

        // Utility
        { match: /^\/rss\/connect$/, crumbs: () => [{ label: 'Connect RSS Feed', url: '/public/rss/connect' }] },

        // Posts
        { match: /^\/posts\/details\/([^/]+)$/, crumbs: (m, f) => [{ label: 'Posts', url: '/public/home' }, { label: 'Post Details', url: f }] },
        { match: /^\/post\/([^/]+)$/, crumbs: (m, f) => [{ label: 'Posts', url: '/public/home' }, { label: 'Post Details', url: f }] },

        // Fallbacks
        { match: /^\/home$/, crumbs: () => [] },
        { match: /^\/search$/, crumbs: () => [{ label: 'Search', url: '/public/search' }] }
    ];

const DEPARTMENT_LABELS: Record<string, string> = {
    community: 'Community',
    culture: 'Culture',
    education: 'Education',
    health: 'Health',
    housing: 'Housing',
    lifestyle: 'Lifestyle',
    legal: 'Legal',
    news: 'News',
    profession: 'Professions',
    professions: 'Professions',
    social: 'Social',
    transportation: 'Transportation',
    tv: 'TV'
};

function formatDepartmentLabel(value: string): string {
    const slug = (value || '').trim().toLowerCase();
    if (!slug) return '';
    if (DEPARTMENT_LABELS[slug]) return DEPARTMENT_LABELS[slug];
    return slug
        .replace(/[-_]+/g, ' ')
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => (word === 'tv' ? 'TV' : word.charAt(0).toUpperCase() + word.slice(1)))
        .join(' ');
}

function departmentHomeRoute(value: string): string {
    const slug = (value || '').trim().toLowerCase();
    if (slug === 'community') return '/public/community';
    if (slug === 'housing') return '/public/housing/home';
    if (slug === 'profession' || slug === 'professions') return '/public/profession/feed';
    return `/public/category/${slug}`;
}

function toTitleCase(value: string): string {
    return value
        .replace(/[-_]+/g, ' ')
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => {
            const lower = word.toLowerCase();
            if (lower === 'tv') return 'TV';
            if (lower === 'rss') return 'RSS';
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
}

@Component({
    selector: 'app-breadcrumbs',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './breadcrumbs.component.html',
    styleUrls: ['./breadcrumbs.component.css']
})
export class BreadcrumbsComponent implements OnInit, OnDestroy {
    private router = inject(Router);
    private routerSub?: Subscription;
    private lastScrollY = 0;

    private readonly hiddenOnRoutes: RegExp[] = [
        /^\/$/,
        /^\/public\/?$/,
        /^\/public\/home$/,
        /^\/public\/community$/,
        /^\/public\/housing$/,
        /^\/public\/housing\/home$/,
        /^\/public\/category\/[^/]+$/,
        /^\/public\/profession(?:\/feed)?$/
    ];

    private readonly darkThemeRoutes: RegExp[] = [
        /^\/public\/forums(\/.*)?$/
    ];

    breadcrumbs: Breadcrumb[] = [];
    isScrolled = false;

    @HostListener('window:scroll')
    onWindowScroll(): void {
        const currentScrollY = Math.max(window.scrollY || 0, 0);
        const isScrollingDown = currentScrollY > this.lastScrollY;

        this.isScrolled = isScrollingDown && currentScrollY > 20;
        this.lastScrollY = currentScrollY;
    }

    isHomePage(): boolean {
        const url = this.normalizeUrlPath(this.router.url.split('?')[0]);
        return this.hiddenOnRoutes.some((pattern) => pattern.test(url));
    }

    isDarkThemeRoute(): boolean {
        const url = this.normalizeUrlPath(this.router.url.split('?')[0]);
        return this.darkThemeRoutes.some((pattern) => pattern.test(url));
    }

    ngOnInit(): void {
        this.build();
        this.lastScrollY = Math.max(window.scrollY || 0, 0);
        this.routerSub = this.router.events
            .pipe(filter((e) => e instanceof NavigationEnd))
            .subscribe(() => {
                this.build();
                this.isScrolled = false;
                this.lastScrollY = Math.max(window.scrollY || 0, 0);
            });
    }

    ngOnDestroy(): void {
        this.routerSub?.unsubscribe();
    }

    private build(): void {
        const fullUrl = this.normalizeUrlPath(this.router.url.split('?')[0]);
        const relUrl = this.normalizeUrlPath(fullUrl.replace(/^\/public/, '') || '/');

        const mapCrumbs = this.getCrumbsFromMap(relUrl, fullUrl);
        this.breadcrumbs = this.normalizeBreadcrumbs(mapCrumbs);
    }

    private getCrumbsFromMap(relUrl: string, fullUrl: string): Breadcrumb[] {
        for (const route of ROUTE_MAP) {
            const match = relUrl.match(route.match);
            if (match) {
                return route.crumbs(match, fullUrl).map((crumb) => ({
                    ...crumb,
                    label: toTitleCase(crumb.label)
                }));
            }
        }
        return [];
    }

    private normalizeBreadcrumbs(crumbs: Breadcrumb[]): Breadcrumb[] {
        const cleaned: Breadcrumb[] = [];
        for (const crumb of crumbs) {
            const label = toTitleCase((crumb.label || '').trim());
            const url = (crumb.url || '').trim();
            if (!label || !url) continue;
            if (label.toLowerCase() === 'home') continue;

            const prev = cleaned[cleaned.length - 1];
            if (prev && (prev.label === label || prev.url === url)) continue;

            cleaned.push({ label, url });
        }
        return cleaned;
    }

    private normalizeUrlPath(path: string): string {
        if (!path || path === '/') return '/';
        return path.replace(/\/+$/, '') || '/';
    }
}
