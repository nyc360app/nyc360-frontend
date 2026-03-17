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

export const CATEGORY_THEMES: { [key: number]: any } = {
  [CategoryEnum.Community]: {
    color: '#BC5E3D', label: 'Community', path: 'community', icon: '/icon-category/commumity.png', biIcon: 'bi-people-fill',
    route: '/public/community',
    topLinks: [
      { label: 'Explore', route: '/public/feed/community', icon: 'bi-rss' },
      { label: 'My Inquiries', route: '/public/category/community/saved', icon: 'bi-journal-text' },
      { label: 'Contributor Dashboard', route: '/public/category/community/dashboard', icon: 'bi-speedometer2' },
      {
        label: 'Contributor Activity',
        icon: 'bi-activity',
        isDropdown: true,
        children: [
          { label: 'Publish News Article', route: '/public/posts/create', icon: 'bi-pencil-square', isAction: true },
          { label: 'Connect RSS Feed', route: '/public/rss/connect', icon: 'bi-broadcast', isAction: true }
        ]
      }
    ]
  },
  [CategoryEnum.Culture]: {
    color: '#dc3545', label: 'Culture', path: 'culture', icon: '/icon-category/culture.png', biIcon: 'bi-palette-fill',
    route: '/public/category/culture',
    topLinks: [
      { label: 'Explore', route: '/public/feed/culture', icon: 'bi-rss' },
      { label: 'My Inquiries', route: '/public/category/culture/saved', icon: 'bi-journal-text' },
      { label: 'Contributor Dashboard', route: '/public/category/culture/dashboard', icon: 'bi-speedometer2' },
      {
        label: 'Contributor Activity',
        icon: 'bi-activity',
        isDropdown: true,
        children: [
          { label: 'Publish News Article', route: '/public/posts/create', icon: 'bi-pencil-square', isAction: true },
          { label: 'Connect RSS Feed', route: '/public/rss/connect', icon: 'bi-broadcast', isAction: true }
        ]
      }
    ]
  },
  [CategoryEnum.Education]: {
    color: '#0056b3', label: 'Education', path: 'education', icon: '/icon-category/education.png', biIcon: 'bi-mortarboard-fill',
    route: '/public/category/education',
    topLinks: [
      { label: 'Explore', route: '/public/feed/education', icon: 'bi-rss' },
      { label: 'My Inquiries', route: '/public/category/education/saved', icon: 'bi-journal-text' },
      { label: 'Contributor Dashboard', route: '/public/category/education/dashboard', icon: 'bi-speedometer2' },

      {
        label: 'Contributor Activity',
        icon: 'bi-activity',
        isDropdown: true,
        children: [
          { label: 'Publish News Article', route: '/public/posts/create', icon: 'bi-pencil-square', isAction: true },
          { label: 'Connect RSS Feed', route: '/public/rss/connect', icon: 'bi-broadcast', isAction: true }
        ]
      }
    ]
  },
  [CategoryEnum.Health]: {
    color: '#00c3ff', label: 'Health', path: 'health', icon: '/icon-category/health.png', biIcon: 'bi-heart-pulse-fill',
    route: '/public/category/health',
    topLinks: [
      { label: 'Explore', route: '/public/feed/health', icon: 'bi-rss' },
      { label: 'My Inquiries', route: '/public/category/health/saved', icon: 'bi-journal-text' },
      { label: 'Contributor Dashboard', route: '/public/category/health/dashboard', icon: 'bi-speedometer2' },

      {
        label: 'Contributor Activity',
        icon: 'bi-activity',
        isDropdown: true,
        children: [
          { label: 'Publish News Article', route: '/public/posts/create', icon: 'bi-pencil-square', isAction: true },
          { label: 'Connect RSS Feed', route: '/public/rss/connect', icon: 'bi-broadcast', isAction: true }
        ]
      }
    ]
  },
  [CategoryEnum.Housing]: {
    color: '#B59B62', label: 'Housing', path: 'housing', icon: '/icon-category/housing.png', biIcon: 'bi-house-heart-fill',
    route: '/public/housing/home',
    topLinks: [
      { label: 'Explore', route: '/public/housing/feed', icon: 'bi-rss' },
      { label: 'My Inquiries', route: '/public/category/housing/saved', icon: 'bi-journal-text' },
      { label: 'Contributor Dashboard', route: '/public/category/housing/dashboard', icon: 'bi-speedometer2' },

      {
        label: 'Contributor Activity',
        icon: 'bi-activity',
        isDropdown: true,
        children: [
          { label: 'Publish News Article', route: '/public/posts/create', icon: 'bi-pencil-square', isAction: true },
          { label: 'Connect RSS Feed', route: '/public/rss/connect', icon: 'bi-broadcast', isAction: true },
          { label: 'House Listing', route: '/public/housing/create/renting', icon: 'bi-key' }
        ]
      }
    ]
  },
  [CategoryEnum.Lifestyle]: {
    color: '#8bc34a', label: 'Lifestyle', path: 'lifestyle', icon: '/icon-category/lifestyle.png', biIcon: 'bi-cup-hot-fill',
    route: '/public/category/lifestyle',
    topLinks: [
      { label: 'Explore', route: '/public/feed/lifestyle', icon: 'bi-rss' },
      { label: 'My Inquiries', route: '/public/category/lifestyle/saved', icon: 'bi-journal-text' },
      { label: 'Contributor Dashboard', route: '/public/category/lifestyle/dashboard', icon: 'bi-speedometer2' },

      {
        label: 'Contributor Activity',
        icon: 'bi-activity',
        isDropdown: true,
        children: [
          { label: 'Publish News Article', route: '/public/posts/create', icon: 'bi-pencil-square', isAction: true },
          { label: 'Connect RSS Feed', route: '/public/rss/connect', icon: 'bi-broadcast', isAction: true }
        ]
      }
    ]
  },
  [CategoryEnum.Legal]: {
    color: '#102a43', label: 'Legal', path: 'legal', icon: '/icon-category/legal.png', biIcon: 'bi-hammer',
    route: '/public/category/legal',
    topLinks: [
      { label: 'Explore', route: '/public/feed/legal', icon: 'bi-rss' },
      { label: 'My Inquiries', route: '/public/category/legal/saved', icon: 'bi-journal-text' },
      { label: 'Contributor Dashboard', route: '/public/category/legal/dashboard', icon: 'bi-speedometer2' },

      {
        label: 'Contributor Activity',
        icon: 'bi-activity',
        isDropdown: true,
        children: [
          { label: 'Publish News Article', route: '/public/posts/create', icon: 'bi-pencil-square', isAction: true },
          { label: 'Connect RSS Feed', route: '/public/rss/connect', icon: 'bi-broadcast', isAction: true }
        ]
      }
    ]
  },
  [CategoryEnum.News]: {
    color: '#333333', label: 'News', path: 'news', icon: '/icon-category/newspaper.png', biIcon: 'bi-newspaper',
    route: '/public/category/news',
    topLinks: [
      { label: 'Explore', route: '/public/feed/news', icon: 'bi-rss' },
      { label: 'My Inquiries', route: '/public/category/news/saved', icon: 'bi-journal-text' },
      { label: 'Contributor Dashboard', route: '/public/category/news/dashboard', icon: 'bi-speedometer2' },

      {
        label: 'Contributor Activity',
        icon: 'bi-activity',
        isDropdown: true,
        children: [
          { label: 'Publish News Article', route: '/public/posts/create', icon: 'bi-pencil-square', isAction: true },
          { label: 'Connect RSS Feed', route: '/public/rss/connect', icon: 'bi-broadcast', isAction: true }
        ]
      }
    ]
  },
  [CategoryEnum.Professions]: {
    color: '#2ecc71', label: 'Professions', path: 'professions', icon: '/icon-category/professions.png', biIcon: 'bi-briefcase-fill',
    route: '/public/profession/feed',
    topLinks: [
      { label: 'Jobs', route: '/public/profession/jobs', icon: 'bi-briefcase' },
      { label: 'My Inquiries', route: '/public/category/professions/saved', icon: 'bi-journal-text' },
      { label: 'Contributor Dashboard', route: '/public/category/professions/dashboard', icon: 'bi-speedometer2' },

      {
        label: 'Contributor Activity',
        icon: 'bi-activity',
        isDropdown: true,
        children: [
          { label: 'Publish News Article', route: '/public/posts/create', icon: 'bi-pencil-square', isAction: true },
          { label: 'Connect RSS Feed', route: '/public/rss/connect', icon: 'bi-broadcast', isAction: true }
        ]
      }
    ]
  },
  [CategoryEnum.Social]: {
    color: '#17a2b8', label: 'Social', path: 'social', icon: '/icon-category/social.png', biIcon: 'bi-chat-heart-fill',
    route: '/public/category/social',
    topLinks: [
      { label: 'Explore', route: '/public/feed/social', icon: 'bi-rss' },
      { label: 'My Inquiries', route: '/public/category/social/saved', icon: 'bi-journal-text' },
      { label: 'Contributor Dashboard', route: '/public/category/social/dashboard', icon: 'bi-speedometer2' },

      {
        label: 'Contributor Activity',
        icon: 'bi-activity',
        isDropdown: true,
        children: [
          { label: 'Publish News Article', route: '/public/posts/create', icon: 'bi-pencil-square', isAction: true },
          { label: 'Connect RSS Feed', route: '/public/rss/connect', icon: 'bi-broadcast', isAction: true }
        ]
      }
    ]
  },
  [CategoryEnum.Transportation]: {
    color: '#f1c40f', label: 'Transportation', path: 'transportation', icon: '/icon-category/transportation.png', biIcon: 'bi-bus-front-fill',
    route: '/public/category/transportation',
    topLinks: [
      { label: 'Explore', route: '/public/feed/transportation', icon: 'bi-rss' },
      { label: 'My Inquiries', route: '/public/category/transportation/saved', icon: 'bi-journal-text' },
      { label: 'Contributor Dashboard', route: '/public/category/transportation/dashboard', icon: 'bi-speedometer2' },

      {
        label: 'Contributor Activity',
        icon: 'bi-activity',
        isDropdown: true,
        children: [
          { label: 'Publish News Article', route: '/public/posts/create', icon: 'bi-pencil-square', isAction: true },
          { label: 'Connect RSS Feed', route: '/public/rss/connect', icon: 'bi-broadcast', isAction: true }
        ]
      }
    ]
  },
  [CategoryEnum.Tv]: {
    color: '#0d47a1', label: 'TV', path: 'tv', icon: '/icon-category/tv.png', biIcon: 'bi-tv-fill',
    route: '/public/category/tv',
    topLinks: [
      { label: 'Explore', route: '/public/feed/tv', icon: 'bi-rss' },
      { label: 'My Inquiries', route: '/public/category/tv/saved', icon: 'bi-journal-text' },
      { label: 'Contributor Dashboard', route: '/public/category/tv/dashboard', icon: 'bi-speedometer2' },
      {
        label: 'Contributor Activity',
        icon: 'bi-activity',
        isDropdown: true,
        children: [
          { label: 'Publish News Article', route: '/public/posts/create', icon: 'bi-pencil-square', isAction: true },
          { label: 'Connect RSS Feed', route: '/public/rss/connect', icon: 'bi-broadcast', isAction: true }
        ]
      }
    ]
  }
};
