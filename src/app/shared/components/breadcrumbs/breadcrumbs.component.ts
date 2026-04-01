import { Component, OnInit, OnDestroy, inject, HostListener, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
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
        { match: /^\/(culture|education|health|lifestyle|legal|news|social|transportation|tv)$/, crumbs: (m) => [{ label: formatDepartmentLabel(m[1]), url: departmentHomeRoute(m[1]) }] },
        { match: /^\/(culture|education|health|lifestyle|legal|news|social|transportation|tv)\/explore$/, crumbs: (m, f) => [{ label: formatDepartmentLabel(m[1]), url: departmentHomeRoute(m[1]) }, { label: 'Explore', url: f }] },
        { match: /^\/(culture|education|health|lifestyle|legal|news|social|transportation|tv)\/saved$/, crumbs: (m, f) => [{ label: formatDepartmentLabel(m[1]), url: departmentHomeRoute(m[1]) }, { label: 'My Inquiries', url: f }] },
        { match: /^\/(culture|education|health|lifestyle|legal|news|social|transportation|tv)\/dashboard$/, crumbs: (m, f) => [{ label: formatDepartmentLabel(m[1]), url: departmentHomeRoute(m[1]) }, { label: 'Contributor Dashboard', url: f }] },
        { match: /^\/(culture|education|health|lifestyle|legal|news|social|transportation|tv)\/create-poll$/, crumbs: (m, f) => [{ label: formatDepartmentLabel(m[1]), url: departmentHomeRoute(m[1]) }, { label: 'Create Poll', url: f }] },
        { match: /^\/news\/polls\/([^/]+)$/, crumbs: (m, f) => [{ label: 'News', url: '/news' }, { label: 'Poll Details', url: f }] },
        { match: /^\/(culture|education|health|lifestyle|legal|news|social|transportation|tv)\/create$/, crumbs: (m, f) => [{ label: formatDepartmentLabel(m[1]), url: departmentHomeRoute(m[1]) }, { label: 'Create Article', url: f }] },
        { match: /^\/(culture|education|health|lifestyle|legal|news|social|transportation|tv)\/rss\/connect$/, crumbs: (m, f) => [{ label: formatDepartmentLabel(m[1]), url: departmentHomeRoute(m[1]) }, { label: 'Connect RSS', url: f }] },
        { match: /^\/(culture|education|health|lifestyle|legal|news|social|transportation|tv)\/discussions$/, crumbs: (m, f) => [{ label: formatDepartmentLabel(m[1]), url: departmentHomeRoute(m[1]) }, { label: 'Discussions', url: f }] },
        { match: /^\/(culture|education|health|lifestyle|legal|news|social|transportation|tv)\/discussions\/create$/, crumbs: (m, f) => [{ label: formatDepartmentLabel(m[1]), url: departmentHomeRoute(m[1]) }, { label: 'Discussions', url: `/${m[1]}/discussions` }, { label: 'Ask A Question', url: f }] },
        { match: /^\/(culture|education|health|lifestyle|legal|news|social|transportation|tv)\/discussions\/questions\/([^/]+)$/, crumbs: (m, f) => [{ label: formatDepartmentLabel(m[1]), url: departmentHomeRoute(m[1]) }, { label: 'Discussions', url: `/${m[1]}/discussions` }, { label: 'Question Details', url: f }] },
        { match: /^\/category\/([^/]+)$/, crumbs: (m) => [{ label: formatDepartmentLabel(m[1]), url: departmentHomeRoute(m[1]) }] },
        { match: /^\/category\/([^/]+)\/saved$/, crumbs: (m, f) => [{ label: formatDepartmentLabel(m[1]), url: departmentHomeRoute(m[1]) }, { label: 'My Inquiries', url: f }] },
        { match: /^\/category\/([^/]+)\/dashboard$/, crumbs: (m, f) => [{ label: formatDepartmentLabel(m[1]), url: departmentHomeRoute(m[1]) }, { label: 'Contributor Dashboard', url: f }] },

        // Community
        { match: /^\/community$/, crumbs: () => [{ label: 'Community', url: '/community' }] },
        { match: /^\/community\/explore$/, crumbs: (m, f) => [{ label: 'Community', url: '/community' }, { label: 'Explore', url: f }] },
        { match: /^\/community\/saved$/, crumbs: (m, f) => [{ label: 'Community', url: '/community' }, { label: 'My Inquiries', url: f }] },
        { match: /^\/community\/dashboard$/, crumbs: (m, f) => [{ label: 'Community', url: '/community' }, { label: 'Contributor Dashboard', url: f }] },
        { match: /^\/community\/create\/article$/, crumbs: (m, f) => [{ label: 'Community', url: '/community' }, { label: 'Create Article', url: f }] },
        { match: /^\/community\/create\/community$/, crumbs: (m, f) => [{ label: 'Community', url: '/community' }, { label: 'Create Community', url: f }] },
        { match: /^\/community\/rss\/connect$/, crumbs: (m, f) => [{ label: 'Community', url: '/community' }, { label: 'Connect RSS', url: f }] },
        { match: /^\/community\/discussions$/, crumbs: (m, f) => [{ label: 'Community', url: '/community' }, { label: 'Discussions', url: f }] },
        { match: /^\/community\/discussions\/create$/, crumbs: (m, f) => [{ label: 'Community', url: '/community' }, { label: 'Discussions', url: '/community/discussions' }, { label: 'Ask A Question', url: f }] },
        { match: /^\/community\/discussions\/questions\/([^/]+)$/, crumbs: (m, f) => [{ label: 'Community', url: '/community' }, { label: 'Discussions', url: '/community/discussions' }, { label: 'Question Details', url: f }] },
        { match: /^\/community\/my-communities$/, crumbs: (m, f) => [{ label: 'Community', url: '/community' }, { label: 'My Communities', url: f }] },
        { match: /^\/community\/post\/([^/]+)$/, crumbs: (m, f) => [{ label: 'Community', url: '/community' }, { label: 'Post Details', url: f }] },
        { match: /^\/community\/([^/]+)\/manage$/, crumbs: (m, f) => [{ label: 'Community', url: '/community' }, { label: m[1].replace(/-/g, ' '), url: `/community/${m[1]}` }, { label: 'Manage Community', url: f }] },
        { match: /^\/community\/([^/]+)$/, crumbs: (m, f) => [{ label: 'Community', url: '/community' }, { label: m[1].replace(/-/g, ' '), url: f }] },
        { match: /^\/create-community$/, crumbs: () => [{ label: 'Community', url: '/community' }, { label: 'Create Community', url: '/community/create/community' }] },
        { match: /^\/community\/([^/]+)\/create-post$/, crumbs: (m, f) => [{ label: 'Community', url: '/community' }, { label: 'Create Post', url: f }] },
        { match: /^\/discover$/, crumbs: () => [{ label: 'Community', url: '/community' }, { label: 'Discover', url: '/community/explore' }] },
        { match: /^\/my-communities$/, crumbs: () => [{ label: 'Community', url: '/community' }, { label: 'My Communities', url: '/community/my-communities' }] },

        // Housing
        { match: /^\/housing$/, crumbs: () => [{ label: 'Housing', url: '/housing' }] },
        { match: /^\/housing\/home$/, crumbs: () => [{ label: 'Housing', url: '/housing' }] },
        { match: /^\/housing\/explore$/, crumbs: (m, f) => [{ label: 'Housing', url: '/housing' }, { label: 'Explore', url: f }] },
        { match: /^\/housing\/saved$/, crumbs: (m, f) => [{ label: 'Housing', url: '/housing' }, { label: 'My Inquiries', url: f }] },
        { match: /^\/housing\/dashboard$/, crumbs: () => [{ label: 'Housing', url: '/housing' }, { label: 'Agent Dashboard', url: '/housing/dashboard' }] },
        { match: /^\/housing\/dashboard\/requests$/, crumbs: () => [{ label: 'Housing', url: '/housing' }, { label: 'Agent Dashboard', url: '/housing/dashboard' }, { label: 'Agent Requests', url: '/housing/dashboard/requests' }] },
        { match: /^\/housing\/dashboard\/listings$/, crumbs: () => [{ label: 'Housing', url: '/housing' }, { label: 'Agent Dashboard', url: '/housing/dashboard' }, { label: 'My Listings', url: '/housing/dashboard/listings' }] },
        { match: /^\/housing\/create\/article$/, crumbs: (m, f) => [{ label: 'Housing', url: '/housing' }, { label: 'Create Article', url: f }] },
        { match: /^\/housing\/feed$/, crumbs: () => [{ label: 'Housing', url: '/housing' }, { label: 'Explore', url: '/housing/explore' }] },
        { match: /^\/housing\/create\/renting$/, crumbs: () => [{ label: 'Housing', url: '/housing' }, { label: 'Create Listing', url: '/housing/create/renting' }] },
        { match: /^\/housing\/create\/sale$/, crumbs: () => [{ label: 'Housing', url: '/housing' }, { label: 'Create Sale', url: '/housing/create/sale' }] },
        { match: /^\/housing\/listing-authorization$/, crumbs: () => [{ label: 'Housing', url: '/housing' }, { label: 'Listing Authorization', url: '/housing/listing-authorization' }] },
        { match: /^\/housing\/details\/([^/]+)$/, crumbs: (m, f) => [{ label: 'Housing', url: '/housing' }, { label: 'Property Details', url: f }] },
        { match: /^\/housing\/agent\/dashboard$/, crumbs: () => [{ label: 'Housing', url: '/housing' }, { label: 'Agent Dashboard', url: '/housing/dashboard' }] },
        { match: /^\/housing\/agent\/dashboard\/requests$/, crumbs: () => [{ label: 'Housing', url: '/housing' }, { label: 'Agent Dashboard', url: '/housing/dashboard' }, { label: 'Agent Requests', url: '/housing/dashboard/requests' }] },
        { match: /^\/housing\/agent\/dashboard\/listings$/, crumbs: () => [{ label: 'Housing', url: '/housing' }, { label: 'Agent Dashboard', url: '/housing/dashboard' }, { label: 'My Listings', url: '/housing/dashboard/listings' }] },
        { match: /^\/housing\/rss\/connect$/, crumbs: (m, f) => [{ label: 'Housing', url: '/housing' }, { label: 'Connect RSS', url: f }] },
        { match: /^\/housing\/discussions$/, crumbs: (m, f) => [{ label: 'Housing', url: '/housing' }, { label: 'Discussions', url: f }] },
        { match: /^\/housing\/discussions\/create$/, crumbs: (m, f) => [{ label: 'Housing', url: '/housing' }, { label: 'Discussions', url: '/housing/discussions' }, { label: 'Ask A Question', url: f }] },
        { match: /^\/housing\/discussions\/questions\/([^/]+)$/, crumbs: (m, f) => [{ label: 'Housing', url: '/housing' }, { label: 'Discussions', url: '/housing/discussions' }, { label: 'Question Details', url: f }] },
        { match: /^\/housing\/my-requests$/, crumbs: () => [{ label: 'Housing', url: '/housing' }, { label: 'My Requests', url: '/housing/my-requests' }] },
        { match: /^\/housing\/edit\/renting\/([^/]+)$/, crumbs: (m, f) => [{ label: 'Housing', url: '/housing' }, { label: 'Edit Rental', url: f }] },
        { match: /^\/housing\/edit\/sale\/([^/]+)$/, crumbs: (m, f) => [{ label: 'Housing', url: '/housing' }, { label: 'Edit Sale', url: f }] },
        { match: /^\/housing\/edit\/([^/]+)$/, crumbs: (m, f) => [{ label: 'Housing', url: '/housing' }, { label: 'Edit Listing', url: f }] },
        { match: /^\/housing(?:\/.*)?$/, crumbs: () => [{ label: 'Housing', url: '/housing' }] },

        // Professions / Jobs
        { match: /^\/professions$/, crumbs: () => [{ label: 'Professions', url: '/professions' }] },
        { match: /^\/professions\/saved$/, crumbs: (m, f) => [{ label: 'Professions', url: '/professions' }, { label: 'My Inquiries', url: f }] },
        { match: /^\/professions\/dashboard$/, crumbs: (m, f) => [{ label: 'Professions', url: '/professions' }, { label: 'Contributor Dashboard', url: f }] },
        { match: /^\/professions\/jobs$/, crumbs: () => [{ label: 'Professions', url: '/professions' }, { label: 'Job Search', url: '/professions/jobs' }] },
        { match: /^\/professions\/jobs\/([^/]+)$/, crumbs: (m, f) => [{ label: 'Professions', url: '/professions' }, { label: 'Job Details', url: f }] },
        { match: /^\/professions\/applications$/, crumbs: () => [{ label: 'Professions', url: '/professions' }, { label: 'My Applications', url: '/professions/applications' }] },
        { match: /^\/professions\/offers$/, crumbs: () => [{ label: 'Professions', url: '/professions' }, { label: 'My Offers', url: '/professions/offers' }] },
        { match: /^\/professions\/offers\/create$/, crumbs: () => [{ label: 'Professions', url: '/professions' }, { label: 'My Offers', url: '/professions/offers' }, { label: 'Create Offer', url: '/professions/offers/create' }] },
        { match: /^\/professions\/offers\/edit\/([^/]+)$/, crumbs: (m, f) => [{ label: 'Professions', url: '/professions' }, { label: 'My Offers', url: '/professions/offers' }, { label: 'Edit Offer', url: f }] },
        { match: /^\/professions\/create\/article$/, crumbs: (m, f) => [{ label: 'Professions', url: '/professions' }, { label: 'Create Article', url: f }] },
        { match: /^\/professions\/rss\/connect$/, crumbs: (m, f) => [{ label: 'Professions', url: '/professions' }, { label: 'Connect RSS', url: f }] },
        { match: /^\/professions\/discussions$/, crumbs: (m, f) => [{ label: 'Professions', url: '/professions' }, { label: 'Discussions', url: f }] },
        { match: /^\/professions\/discussions\/create$/, crumbs: (m, f) => [{ label: 'Professions', url: '/professions' }, { label: 'Discussions', url: '/professions/discussions' }, { label: 'Ask A Question', url: f }] },
        { match: /^\/professions\/discussions\/questions\/([^/]+)$/, crumbs: (m, f) => [{ label: 'Professions', url: '/professions' }, { label: 'Discussions', url: '/professions/discussions' }, { label: 'Question Details', url: f }] },
        { match: /^\/profession(?:\/feed)?$/, crumbs: () => [{ label: 'Professions', url: '/professions' }] },
        { match: /^\/profession\/jobs$/, crumbs: () => [{ label: 'Professions', url: '/professions' }, { label: 'Job Search', url: '/professions/jobs' }] },
        { match: /^\/profession\/my-applications$/, crumbs: () => [{ label: 'Professions', url: '/professions' }, { label: 'My Applications', url: '/professions/applications' }] },
        { match: /^\/profession\/my-offers$/, crumbs: () => [{ label: 'Professions', url: '/professions' }, { label: 'My Offers', url: '/professions/offers' }] },
        { match: /^\/create-offer$/, crumbs: () => [{ label: 'Professions', url: '/professions' }, { label: 'Create Offer', url: '/professions/offers/create' }] },
        { match: /^\/edit-offer\/([^/]+)$/, crumbs: (m, f) => [{ label: 'Professions', url: '/professions' }, { label: 'Edit Offer', url: f }] },
        { match: /^\/job-profile\/([^/]+)$/, crumbs: (m, f) => [{ label: 'Professions', url: '/professions' }, { label: 'Job Details', url: f }] },

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
    if (slug === 'community') return '/community';
    if (slug === 'housing') return '/housing';
    if (slug === 'profession' || slug === 'professions') return '/professions';
    return `/${slug}`;
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
    private platformId = inject(PLATFORM_ID);
    private routerSub?: Subscription;
    private lastScrollY = 0;

    private readonly hiddenOnRoutes: RegExp[] = [
        /^\/$/,
        /^\/public\/?$/,
        /^\/public\/home$/,
        /^\/community$/,
        /^\/housing$/,
        /^\/professions$/,
        /^\/(?:culture|education|health|lifestyle|legal|news|social|transportation|tv)$/,
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
        if (!this.isBrowser()) {
            return;
        }

        const currentScrollY = this.getScrollY();
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
        this.lastScrollY = this.getScrollY();
        this.routerSub = this.router.events
            .pipe(filter((e) => e instanceof NavigationEnd))
            .subscribe(() => {
                this.build();
                this.isScrolled = false;
                this.lastScrollY = this.getScrollY();
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

    private isBrowser(): boolean {
        return isPlatformBrowser(this.platformId);
    }

    private getScrollY(): number {
        if (!this.isBrowser()) {
            return 0;
        }

        return Math.max(window.scrollY || 0, 0);
    }
}
