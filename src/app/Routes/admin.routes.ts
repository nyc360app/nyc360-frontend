// src/app/routes/admin.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from '../guard/auth-guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/Layout/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [authGuard],
    data: { roles: ['Admin', 'SuperAdmin'] },
    children: [
      // Dashboard
      { path: 'dashboard', loadComponent: () => import('../pages/Dashboard/pages/dashboard/dashboard/dashboard.component').then(m => m.DashboardComponent) },

      // Users
      { path: 'User', loadComponent: () => import('../pages/Dashboard/pages/users/userlist/userlist').then(m => m.UserList) },

      // Roles
      { path: 'Role', loadComponent: () => import('../pages/Dashboard/pages/Roles/roles-list/roles-list').then(m => m.RolesListComponent) },
      { path: 'roles/create', loadComponent: () => import('../pages/Dashboard/pages/Roles/role-form/role-form').then(m => m.RoleFormComponent) },
      { path: 'roles/edit/:id', loadComponent: () => import('../pages/Dashboard/pages/Roles/edit-role/edit-role').then(m => m.EditRoleComponent) },

      // RSS
      { path: 'rss', loadComponent: () => import('../pages/Dashboard/pages/RssLinks/pages/rss-list/rss-list').then(m => m.RssListComponent) },
      { path: 'rss/create', loadComponent: () => import('../pages/Dashboard/pages/RssLinks/pages/rss-form/rss-form').then(m => m.RssFormComponent) },
      { path: 'rss/edit', loadComponent: () => import('../pages/Dashboard/pages/RssLinks/pages/rss-form/rss-form').then(m => m.RssFormComponent) },
      { path: 'rss/requests', loadComponent: () => import('../pages/Dashboard/pages/RssLinks/pages/rss-requests/rss-requests').then(m => m.RssRequestsComponent) },


      // Posts Management
      { path: 'posts', loadComponent: () => import('../pages/Dashboard/pages/posts/post-list/post-list').then(m => m.PostListComponent) },
      { path: 'posts/create', loadComponent: () => import('../pages/Dashboard/pages/posts/post-form/post-form').then(m => m.PostFormComponent) },
      { path: 'posts/edit/:id', loadComponent: () => import('../pages/Dashboard/pages/posts/post-form/post-form').then(m => m.PostFormComponent) },
      { path: 'posts/details/:id', loadComponent: () => import('../pages/Public/pages/posts/post-details/post-details').then(m => m.PostDetailsComponent) },

      // Trending & Flags
      { path: 'trending', loadComponent: () => import('../pages/Dashboard/pages/trending/trending').then(m => m.TrendingComponent) },
      { path: 'flags', loadComponent: () => import('../pages/Dashboard/pages/flags-list/flags-list').then(m => m.FlagsListComponent) },

      //tags 
      { path: 'tags', loadComponent: () => import('../pages/Dashboard/pages/tags/pages/tags-list/tags-list').then(m => m.TagsListComponent) },
      { path: 'tags/create', loadComponent: () => import('../pages/Dashboard/pages/tags/pages/tag-create/tag-create').then(m => m.TagCreateComponent) },
      { path: 'tags/update/:id', loadComponent: () => import('../pages/Dashboard/pages/tags/pages/tag-update/tag-update').then(m => m.TagUpdateComponent) },
      { path: 'tags/verifications', loadComponent: () => import('../pages/Dashboard/pages/tags/pages/tag-verifications/tag-verifications').then(m => m.TagVerificationsComponent) },

      // Topics
      { path: 'topics', loadComponent: () => import('../pages/Dashboard/pages/Topics/pages/topics-list/topics-list').then(m => m.TopicsListComponent) },

      // Locations
      { path: 'locations', loadComponent: () => import('../pages/Dashboard/pages/locations/pages/locations-list/locations-list').then(m => m.LocationsListComponent) },
      { path: 'locations/create', loadComponent: () => import('../pages/Dashboard/pages/locations/pages/location-form/location-form').then(m => m.LocationFormComponent) },
      { path: 'locations/edit/:id', loadComponent: () => import('../pages/Dashboard/pages/locations/pages/location-form/location-form').then(m => m.LocationFormComponent) },

      // Housing
      { path: 'housing', loadComponent: () => import('../pages/Dashboard/pages/housing/housing-dashboard.component').then(m => m.HousingDashboardComponent) },

      // Communities
      { path: 'communities/list', loadComponent: () => import('../pages/Dashboard/pages/communities/pages/communities-list/communities-list').then(m => m.CommunitiesListComponent) },
      { path: 'communities/disband-requests', loadComponent: () => import('../pages/Dashboard/pages/communities/pages/disband-requests/disband-requests').then(m => m.DisbandRequestsComponent) },
      { path: 'communities/moderation/:id', loadComponent: () => import('../pages/Dashboard/pages/communities/pages/community-moderation/community-moderation').then(m => m.CommunityModerationComponent) },

      // Forums
      { path: 'forums', loadComponent: () => import('../pages/Dashboard/pages/forums/pages/forums-list/forums-list').then(m => m.ForumsListComponent) },

      // Support Tickets
      { path: 'support', loadComponent: () => import('../pages/Dashboard/pages/support-tickets/pages/support-list/support-list').then(m => m.SupportListComponent) }
    ]
  }
];