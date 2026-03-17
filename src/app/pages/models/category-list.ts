import { CATEGORY_THEMES } from '../Public/Widgets/feeds/models/categories';

export interface CategoryModel {
  id: any;
  name: string;
  icon: string;
  biIcon?: string;
  path?: string;
  color?: string;
  route?: string;
  topLinks?: any[];
}

// Generate the list dynamically from the Source of Truth (CategoryEnum + CATEGORY_THEMES)
export const CATEGORY_LIST: CategoryModel[] = Object.entries(CATEGORY_THEMES).map(([key, theme]: [string, any]) => {
  return {
    id: Number(key),
    name: theme.label,
    icon: theme.icon,
    biIcon: theme.biIcon,
    path: theme.path,
    color: theme.color,
    route: theme.route,
    topLinks: theme.topLinks
  };
});

// Helper function to get list with 'All'
export function getCategoriesWithAll(): CategoryModel[] {
  return [
    { id: -1, name: 'All', icon: 'bi-grid-fill', biIcon: 'bi-grid-fill' },
    ...CATEGORY_LIST
  ];
}