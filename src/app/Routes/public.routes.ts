// src/app/routes/public.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from '../guard/auth-guard';

export const PUBLIC_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/Layout/public-layout/public-layout.component').then(m => m.PublicLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },

      // Feed
      { path: 'home', data: { breadcrumb: 'Home' }, loadComponent: () => import('../pages/Public/pages/home/home').then(m => m.Home) },
      { path: 'posts/details/:id', data: { breadcrumb: 'Post Details' }, loadComponent: () => import('../pages/Public/pages/posts/post-details/post-details').then(m => m.PostDetailsComponent) },
      { path: 'posts/tags/:tag', data: { breadcrumb: 'Tagged Posts' }, loadComponent: () => import('../pages/Public/pages/posts/tag-posts/tag-posts').then(m => m.TagPostsComponent) },
      { path: 'posts/create', data: { breadcrumb: 'Create Post' }, loadComponent: () => import('../pages/Public/pages/posts/post-form/post-form').then(m => m.PostFormComponent) },
      { path: 'posts/edit/:id', data: { breadcrumb: 'Edit Post' }, loadComponent: () => import('../pages/Public/pages/posts/post-form/post-form').then(m => m.PostFormComponent) },

      // Community
      { path: 'community', data: { breadcrumb: 'Communities' }, loadComponent: () => import('../pages/Public/pages/communities/pages/community/community').then(m => m.CommunityComponent) },
      { path: 'create-community', data: { breadcrumb: 'Create Community' }, loadComponent: () => import('../pages/Public/pages/communities/pages/create-community/create-community').then(m => m.CreateCommunityComponent) },
      { path: 'community/:slug', data: { breadcrumb: 'Community Profile' }, loadComponent: () => import('../pages/Public/pages/communities/pages/community-profile/community-profile').then(m => m.CommunityProfileComponent) },
      { path: 'community/:slug/manage', data: { breadcrumb: 'Manage Community' }, loadComponent: () => import('../pages/Public/pages/communities/pages/community-management/community-management').then(m => m.CommunityManagementComponent) },
      { path: 'discover', data: { breadcrumb: 'Discover' }, loadComponent: () => import('../pages/Public/pages/communities/pages/community-discovery/community-discovery').then(m => m.CommunityDiscoveryComponent) },
      { path: 'community/:id/create-post', data: { breadcrumb: 'Create Post' }, loadComponent: () => import('../pages/Public/pages/communities/pages/create-community-post/create-community-post').then(m => m.CreateCommunityPostComponent) },
      { path: 'my-communities', data: { breadcrumb: 'My Communities' }, loadComponent: () => import('../pages/Public/pages/communities/pages/mycommunities/mycommunities').then(m => m.MycommunitiesComponent) },
      { path: 'post/:id', data: { breadcrumb: 'Post Details' }, loadComponent: () => import('../pages/Public/pages/communities/pages/post-details/post-details').then(m => m.PostDetailsComponent) },

      // Jobs
      { path: 'profession/feed', data: { breadcrumb: 'Profession' }, loadComponent: () => import('../pages/Public/pages/jobs/pages/profession-feed/profession-feed').then(m => m.ProfessionFeedComponent) },
      { path: 'profession/my-applications', data: { breadcrumb: 'My Applications' }, loadComponent: () => import('../pages/Public/pages/jobs/pages/my-applications.component/my-applications.component').then(m => m.MyApplicationsComponent) },
      { path: 'create-offer', data: { breadcrumb: 'Create Offer' }, loadComponent: () => import('../pages/Public/pages/jobs/pages/create-offer/create-offer').then(m => m.CreateOfferComponent) },
      { path: 'job-profile/:id', data: { breadcrumb: 'Job Details' }, loadComponent: () => import('../pages/Public/pages/jobs/pages/job-profile/job-profile').then(m => m.JobProfileComponent) },
      { path: 'profession/jobs', data: { breadcrumb: 'Job Search' }, loadComponent: () => import('../pages/Public/pages/jobs/pages/job-search/job-search').then(m => m.JobSearchComponent) },
      { path: 'profession/my-offers', data: { breadcrumb: 'My Offers' }, loadComponent: () => import('../pages/Public/pages/jobs/pages/my-offers/my-offers').then(m => m.MyOffersComponent) },
      { path: 'edit-offer/:id', data: { breadcrumb: 'Edit Offer' }, loadComponent: () => import('../pages/Public/pages/jobs/pages/edit-offer/edit-offer').then(m => m.EditOfferComponent) },

      // Events
      {
        path: 'events',
        data: { breadcrumb: 'Events' },
        loadComponent: () => import('../pages/Public/pages/events/pages/event-layout/event-layout').then(m => m.EventLayoutComponent),
        children: [
          { path: 'home', data: { breadcrumb: 'Event Home' }, loadComponent: () => import('../pages/Public/pages/events/pages/event-home/event-home').then(m => m.EventHomeComponent) },
          { path: 'list', data: { breadcrumb: 'Events List' }, loadComponent: () => import('../pages/Public/pages/events/pages/events-list/events-list').then(m => m.EventsListComponent) },
          { path: 'details/:id', data: { breadcrumb: 'Event Details' }, loadComponent: () => import('../pages/Public/pages/events/pages/event-details/event-details').then(m => m.EventDetailsComponent) },
          { path: 'create', data: { breadcrumb: 'Create Event' }, loadComponent: () => import('../pages/Public/pages/events/pages/create-event/create-event').then(m => m.CreateEventComponent) },
          { path: '', redirectTo: 'home', pathMatch: 'full' }
        ]
      },

      // Housing
      { path: 'housing/home', data: { breadcrumb: 'Housing' }, loadComponent: () => import('../pages/Public/pages/housing/pages/housing-home/housing-home').then(m => m.HousingHomeComponent) },
      { path: 'housing/feed', data: { breadcrumb: 'Housing Feed' }, loadComponent: () => import('../pages/Public/pages/housing/pages/housing-feed/housing-feed').then(m => m.HousingFeedComponent) },
      { path: 'housing/create/renting', data: { breadcrumb: 'List for Rent' }, loadComponent: () => import('../pages/Public/pages/housing/pages/create-housing/create-housing').then(m => m.CreateHousingComponent) },
      { path: 'housing/create/sale', data: { breadcrumb: 'List for Sale' }, loadComponent: () => import('../pages/Public/pages/housing/pages/create-sale/create-sale.component').then(m => m.CreateSaleComponent) },
      { path: 'housing/create', redirectTo: 'housing/create/renting', pathMatch: 'full' },
      { path: 'housing/listing-authorization', data: { breadcrumb: 'Listing Authorization' }, loadComponent: () => import('../pages/Public/pages/housing/pages/listing-authorization/listing-authorization.component').then(m => m.ListingAuthorizationComponent) },
      { path: 'housing/details/:id', data: { breadcrumb: 'Listing Details' }, loadComponent: () => import('../pages/Public/pages/housing/pages/housing-details/housing-details').then(m => m.HousingDetailsComponent) },
      { path: 'housing/agent/requests', redirectTo: 'housing/agent/dashboard/requests', pathMatch: 'full' },
      {
        path: 'housing/agent/dashboard',
        data: { breadcrumb: 'Agent Dashboard' },
        loadComponent: () => import('../pages/Public/pages/housing/pages/agent-dashboard/agent-dashboard').then(m => m.AgentDashboardComponent),
        children: [
          { path: '', loadComponent: () => import('../pages/Public/pages/housing/pages/agent-dashboard/pages/overview/agent-overview').then(m => m.AgentOverviewComponent) },
          { path: 'requests', data: { breadcrumb: 'Requests' }, loadComponent: () => import('../pages/Public/pages/housing/pages/agent-dashboard/pages/agent-requests/agent-requests.component').then(m => m.AgentRequestsComponent) },
          { path: 'listings', data: { breadcrumb: 'Listings' }, loadComponent: () => import('../pages/Public/pages/housing/pages/agent-dashboard/pages/agent-listings/agent-listings.component').then(m => m.AgentListingsComponent) }
        ]
      },
      { path: 'housing/my-requests', data: { breadcrumb: 'My Requests' }, loadComponent: () => import('../pages/Public/pages/housing/pages/my-requests/my-requests.component').then(m => m.MyRequestsComponent) },
      { path: 'housing/edit/:id', data: { breadcrumb: 'Edit Listing' }, loadComponent: () => import('../pages/Public/pages/housing/pages/edit-housing/edit-housing').then(m => m.EditHousingComponent) },
      { path: 'housing/edit/renting/:id', data: { breadcrumb: 'Edit Rental' }, loadComponent: () => import('../pages/Public/pages/housing/pages/edit-renting/edit-renting').then(m => m.EditRentingComponent) },
      { path: 'housing/edit/sale/:id', data: { breadcrumb: 'Edit Sale' }, loadComponent: () => import('../pages/Public/pages/housing/pages/edit-sale/edit-sale').then(m => m.EditSaleComponent) },
      { path: 'housing', redirectTo: 'housing/home', pathMatch: 'full' },

      // Category
      {
        path: 'category/:categoryPath',
        data: { breadcrumb: 'Category' },
        loadComponent: () => import('../pages/Public/Widgets/category-home/category-home.component/category-home.component').then(m => m.CategoryHomeComponent)
      },
      {
        path: 'category/:categoryPath/dashboard',
        data: { breadcrumb: 'Dashboard' },
        loadComponent: () => import('../pages/Public/pages/category-dashboard/category-dashboard').then(m => m.CategoryDashboardComponent)
      },
      {
        path: 'category/:categoryPath/saved',
        data: { breadcrumb: 'My Inquiries' },
        loadComponent: () => import('../pages/Public/pages/category-saved-posts/category-saved-posts').then(m => m.CategorySavedPostsComponent)
      },

      // Feed layout route
      {
        path: 'feed',
        loadChildren: () => import('../Routes/feed.routes').then(m => m.PostsRoutingModule)
      },

      // Initiatives layout route
      {
        path: 'initiatives',
        loadChildren: () => import('../pages/Public/Widgets/initiatives/initiatives-routing.module').then(m => m.InitiativesRoutingModule)
      },

      // Profile & Misc
      { path: 'coming-soon', data: { breadcrumb: 'Coming Soon' }, loadComponent: () => import('../pages/Public/Widgets/coming-soon/coming-soon').then(m => m.ComingSoonComponent) },
      { path: 'profile/settings', data: { breadcrumb: 'Settings' }, loadComponent: () => import('../pages/Public/pages/settings/settings').then(m => m.SettingsComponent) },
      { path: 'profile/:username', data: { breadcrumb: 'Profile' }, loadComponent: () => import('../pages/Public/pages/profile/profile/profile').then(m => m.ProfileComponent) },

      // RSS
      { path: 'rss/connect', data: { breadcrumb: 'Connect RSS' }, loadComponent: () => import('../pages/Public/pages/rss/connect-rss/connect-rss.component').then(m => m.ConnectRssComponent) },

      // Forums
      {
        path: 'forums',
        data: { breadcrumb: 'Forums' },
        children: [
          { path: '', loadComponent: () => import('../pages/Public/pages/forums/pages/forums-list/forums-list').then(m => m.ForumsListComponent) },
          { path: 'questions/:id', data: { breadcrumb: 'Question' }, loadComponent: () => import('../pages/Public/pages/forums/pages/question-details/question-details.component').then(m => m.QuestionDetailsComponent) },
          { path: ':slug/create', data: { breadcrumb: 'Ask a Question' }, loadComponent: () => import('../pages/Public/pages/forums/pages/create-question/create-question.component').then(m => m.CreateQuestionComponent) },
          { path: ':slug', data: { breadcrumb: 'Forum' }, loadComponent: () => import('../pages/Public/pages/forums/pages/forum-questions/forum-questions').then(m => m.ForumQuestionsComponent) },
        ]
      }
    ]
  }
];