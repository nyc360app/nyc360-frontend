export enum CategoryEnum {
  Community = 0,
  Culture = 1,
  Education = 2,
  Health = 3,
  Housing = 4,
  Lifestyle = 5,
  Legal = 6,
  News = 7,
  Professions = 8,
  Social = 9,
  Transportation = 10,
  Tv = 11
}

export const DEPARTMENT_PATHS = [
  'community',
  'culture',
  'education',
  'health',
  'housing',
  'lifestyle',
  'legal',
  'news',
  'professions',
  'social',
  'transportation',
  'tv'
] as const;

export function normalizeDepartmentPath(value: string | null | undefined): string {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'profession') return 'professions';
  return normalized;
}

export function isDepartmentPath(value: string | null | undefined): boolean {
  const normalized = normalizeDepartmentPath(value);
  return DEPARTMENT_PATHS.includes(normalized as typeof DEPARTMENT_PATHS[number]);
}

export function getDepartmentHomeRoute(path: string | null | undefined): string {
  const normalized = normalizeDepartmentPath(path);
  return normalized ? `/${normalized}` : '/public/home';
}

export function getDepartmentExploreRoute(path: string | null | undefined): string {
  const normalized = normalizeDepartmentPath(path);

  switch (normalized) {
    case 'community':
      return '/community/explore';
    case 'housing':
      return '/housing/explore';
    case 'professions':
      return '/professions/jobs';
    default:
      return normalized ? `/${normalized}/explore` : '/public/home';
  }
}

export function getDepartmentSavedRoute(path: string | null | undefined): string {
  const normalized = normalizeDepartmentPath(path);
  return normalized ? `/${normalized}/saved` : '/public/home';
}

export function getDepartmentDashboardRoute(path: string | null | undefined): string {
  const normalized = normalizeDepartmentPath(path);
  return normalized ? `/${normalized}/dashboard` : '/public/home';
}

export function getDepartmentArticleCreateRoute(path: string | null | undefined): string {
  const normalized = normalizeDepartmentPath(path);

  switch (normalized) {
    case 'community':
    case 'housing':
    case 'professions':
      return `/${normalized}/create/article`;
    default:
      return normalized ? `/${normalized}/create` : '/public/posts/create';
  }
}

export function getDepartmentRssConnectRoute(path: string | null | undefined): string {
  const normalized = normalizeDepartmentPath(path);
  return normalized ? `/${normalized}/rss/connect` : '/public/rss/connect';
}

export function getDepartmentDiscussionsRoute(path: string | null | undefined): string {
  const normalized = normalizeDepartmentPath(path);
  return normalized ? `/${normalized}/discussions` : '/public/forums';
}

export function getDepartmentDiscussionCreateRoute(path: string | null | undefined): string {
  const normalized = normalizeDepartmentPath(path);
  return normalized ? `/${normalized}/discussions/create` : '/public/forums';
}

export function getDepartmentQuestionDetailsRoute(path: string | null | undefined, questionId: number | string): string {
  const normalized = normalizeDepartmentPath(path);
  return normalized ? `/${normalized}/discussions/questions/${questionId}` : `/public/forums/questions/${questionId}`;
}

function buildStandardTopLinks(path: string) {
  return [
    { label: 'Explore', route: getDepartmentExploreRoute(path), icon: 'bi-rss' },
    { label: 'My Inquiries', route: getDepartmentSavedRoute(path), icon: 'bi-journal-text' },
    { label: 'Contributor Dashboard', route: getDepartmentDashboardRoute(path), icon: 'bi-speedometer2' },
    {
      label: 'Contributor Activity',
      icon: 'bi-activity',
      isDropdown: true,
      children: [
        { label: 'Publish News Article', route: getDepartmentArticleCreateRoute(path), icon: 'bi-pencil-square', isAction: true },
        { label: 'Connect RSS Feed', route: getDepartmentRssConnectRoute(path), icon: 'bi-broadcast', isAction: true }
      ]
    }
  ];
}

function buildHousingTopLinks() {
  return [
    { label: 'Explore', route: getDepartmentExploreRoute('housing'), icon: 'bi-rss' },
    { label: 'My Inquiries', route: getDepartmentSavedRoute('housing'), icon: 'bi-journal-text' },
    { label: 'Contributor Dashboard', route: getDepartmentDashboardRoute('housing'), icon: 'bi-speedometer2' },
    {
      label: 'Contributor Activity',
      icon: 'bi-activity',
      isDropdown: true,
      children: [
        { label: 'Publish News Article', route: getDepartmentArticleCreateRoute('housing'), icon: 'bi-pencil-square', isAction: true },
        { label: 'Connect RSS Feed', route: getDepartmentRssConnectRoute('housing'), icon: 'bi-broadcast', isAction: true },
        { label: 'House Listing', route: '/housing/create/renting', icon: 'bi-key' }
      ]
    }
  ];
}

function buildProfessionsTopLinks() {
  return [
    { label: 'Jobs', route: '/professions/jobs', icon: 'bi-briefcase' },
    { label: 'My Inquiries', route: getDepartmentSavedRoute('professions'), icon: 'bi-journal-text' },
    { label: 'Contributor Dashboard', route: getDepartmentDashboardRoute('professions'), icon: 'bi-speedometer2' },
    {
      label: 'Contributor Activity',
      icon: 'bi-activity',
      isDropdown: true,
      children: [
        { label: 'Publish News Article', route: getDepartmentArticleCreateRoute('professions'), icon: 'bi-pencil-square', isAction: true },
        { label: 'Connect RSS Feed', route: getDepartmentRssConnectRoute('professions'), icon: 'bi-broadcast', isAction: true }
      ]
    }
  ];
}

export const CATEGORY_THEMES: { [key: number]: any } = {
  [CategoryEnum.Community]: {
    color: '#BC5E3D',
    label: 'Community',
    path: 'community',
    icon: '/icon-category/commumity.png',
    biIcon: 'bi-people-fill',
    route: getDepartmentHomeRoute('community'),
    topLinks: buildStandardTopLinks('community')
  },
  [CategoryEnum.Culture]: {
    color: '#dc3545',
    label: 'Culture',
    path: 'culture',
    icon: '/icon-category/culture.png',
    biIcon: 'bi-palette-fill',
    route: getDepartmentHomeRoute('culture'),
    topLinks: buildStandardTopLinks('culture')
  },
  [CategoryEnum.Education]: {
    color: '#0056b3',
    label: 'Education',
    path: 'education',
    icon: '/icon-category/education.png',
    biIcon: 'bi-mortarboard-fill',
    route: getDepartmentHomeRoute('education'),
    topLinks: buildStandardTopLinks('education')
  },
  [CategoryEnum.Health]: {
    color: '#00c3ff',
    label: 'Health',
    path: 'health',
    icon: '/icon-category/health.png',
    biIcon: 'bi-heart-pulse-fill',
    route: getDepartmentHomeRoute('health'),
    topLinks: buildStandardTopLinks('health')
  },
  [CategoryEnum.Housing]: {
    color: '#B59B62',
    label: 'Housing',
    path: 'housing',
    icon: '/icon-category/housing.png',
    biIcon: 'bi-house-heart-fill',
    route: getDepartmentHomeRoute('housing'),
    topLinks: buildHousingTopLinks()
  },
  [CategoryEnum.Lifestyle]: {
    color: '#8bc34a',
    label: 'Lifestyle',
    path: 'lifestyle',
    icon: '/icon-category/lifestyle.png',
    biIcon: 'bi-cup-hot-fill',
    route: getDepartmentHomeRoute('lifestyle'),
    topLinks: buildStandardTopLinks('lifestyle')
  },
  [CategoryEnum.Legal]: {
    color: '#102a43',
    label: 'Legal',
    path: 'legal',
    icon: '/icon-category/legal.png',
    biIcon: 'bi-hammer',
    route: getDepartmentHomeRoute('legal'),
    topLinks: buildStandardTopLinks('legal')
  },
  [CategoryEnum.News]: {
    color: '#333333',
    label: 'News',
    path: 'news',
    icon: '/icon-category/newspaper.png',
    biIcon: 'bi-newspaper',
    route: getDepartmentHomeRoute('news'),
    topLinks: buildStandardTopLinks('news')
  },
  [CategoryEnum.Professions]: {
    color: '#2ecc71',
    label: 'Professions',
    path: 'professions',
    icon: '/icon-category/professions.png',
    biIcon: 'bi-briefcase-fill',
    route: getDepartmentHomeRoute('professions'),
    topLinks: buildProfessionsTopLinks()
  },
  [CategoryEnum.Social]: {
    color: '#17a2b8',
    label: 'Social',
    path: 'social',
    icon: '/icon-category/social.png',
    biIcon: 'bi-chat-heart-fill',
    route: getDepartmentHomeRoute('social'),
    topLinks: buildStandardTopLinks('social')
  },
  [CategoryEnum.Transportation]: {
    color: '#f1c40f',
    label: 'Transportation',
    path: 'transportation',
    icon: '/icon-category/transportation.png',
    biIcon: 'bi-bus-front-fill',
    route: getDepartmentHomeRoute('transportation'),
    topLinks: buildStandardTopLinks('transportation')
  },
  [CategoryEnum.Tv]: {
    color: '#0d47a1',
    label: 'TV',
    path: 'tv',
    icon: '/icon-category/tv.png',
    biIcon: 'bi-tv-fill',
    route: getDepartmentHomeRoute('tv'),
    topLinks: buildStandardTopLinks('tv')
  }
};
