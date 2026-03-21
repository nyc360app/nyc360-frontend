import { Routes, UrlMatcher } from '@angular/router';
import { authGuard } from '../guard/auth-guard';
import { CategoryEnum, isDepartmentPath } from '../pages/Public/Widgets/feeds/models/categories';

const loadCategoryHome = () => import('../pages/Public/Widgets/category-home/category-home.component/category-home.component').then(m => m.CategoryHomeComponent);
const loadCommunityHome = () => import('../pages/Public/pages/communities/pages/community/community').then(m => m.CommunityComponent);
const loadCommunityDiscovery = () => import('../pages/Public/pages/communities/pages/community-discovery/community-discovery').then(m => m.CommunityDiscoveryComponent);
const loadCreateCommunity = () => import('../pages/Public/pages/communities/pages/create-community/create-community').then(m => m.CreateCommunityComponent);
const loadCommunityProfile = () => import('../pages/Public/pages/communities/pages/community-profile/community-profile').then(m => m.CommunityProfileComponent);
const loadCommunityManagement = () => import('../pages/Public/pages/communities/pages/community-management/community-management').then(m => m.CommunityManagementComponent);
const loadCreateCommunityPost = () => import('../pages/Public/pages/communities/pages/create-community-post/create-community-post').then(m => m.CreateCommunityPostComponent);
const loadMyCommunities = () => import('../pages/Public/pages/communities/pages/mycommunities/mycommunities').then(m => m.MycommunitiesComponent);
const loadCommunityPostDetails = () => import('../pages/Public/pages/communities/pages/post-details/post-details').then(m => m.PostDetailsComponent);
const loadHousingHome = () => import('../pages/Public/pages/housing/pages/housing-home/housing-home').then(m => m.HousingHomeComponent);
const loadHousingFeed = () => import('../pages/Public/pages/housing/pages/housing-feed/housing-feed').then(m => m.HousingFeedComponent);
const loadCreateHousing = () => import('../pages/Public/pages/housing/pages/create-housing/create-housing').then(m => m.CreateHousingComponent);
const loadCreateSale = () => import('../pages/Public/pages/housing/pages/create-sale/create-sale.component').then(m => m.CreateSaleComponent);
const loadListingAuthorization = () => import('../pages/Public/pages/housing/pages/listing-authorization/listing-authorization.component').then(m => m.ListingAuthorizationComponent);
const loadHousingDetails = () => import('../pages/Public/pages/housing/pages/housing-details/housing-details').then(m => m.HousingDetailsComponent);
const loadAgentDashboard = () => import('../pages/Public/pages/housing/pages/agent-dashboard/agent-dashboard').then(m => m.AgentDashboardComponent);
const loadAgentOverview = () => import('../pages/Public/pages/housing/pages/agent-dashboard/pages/overview/agent-overview').then(m => m.AgentOverviewComponent);
const loadAgentRequests = () => import('../pages/Public/pages/housing/pages/agent-dashboard/pages/agent-requests/agent-requests.component').then(m => m.AgentRequestsComponent);
const loadAgentListings = () => import('../pages/Public/pages/housing/pages/agent-dashboard/pages/agent-listings/agent-listings.component').then(m => m.AgentListingsComponent);
const loadHousingRequests = () => import('../pages/Public/pages/housing/pages/my-requests/my-requests.component').then(m => m.MyRequestsComponent);
const loadEditHousing = () => import('../pages/Public/pages/housing/pages/edit-housing/edit-housing').then(m => m.EditHousingComponent);
const loadEditRenting = () => import('../pages/Public/pages/housing/pages/edit-renting/edit-renting').then(m => m.EditRentingComponent);
const loadEditSale = () => import('../pages/Public/pages/housing/pages/edit-sale/edit-sale').then(m => m.EditSaleComponent);
const loadProfessionsHome = () => import('../pages/Public/pages/jobs/pages/profession-feed/profession-feed').then(m => m.ProfessionFeedComponent);
const loadJobSearch = () => import('../pages/Public/pages/jobs/pages/job-search/job-search').then(m => m.JobSearchComponent);
const loadJobProfile = () => import('../pages/Public/pages/jobs/pages/job-profile/job-profile').then(m => m.JobProfileComponent);
const loadMyApplications = () => import('../pages/Public/pages/jobs/pages/my-applications.component/my-applications.component').then(m => m.MyApplicationsComponent);
const loadCreateOffer = () => import('../pages/Public/pages/jobs/pages/create-offer/create-offer').then(m => m.CreateOfferComponent);
const loadMyOffers = () => import('../pages/Public/pages/jobs/pages/my-offers/my-offers').then(m => m.MyOffersComponent);
const loadEditOffer = () => import('../pages/Public/pages/jobs/pages/edit-offer/edit-offer').then(m => m.EditOfferComponent);
const loadCategoryDashboard = () => import('../pages/Public/pages/category-dashboard/category-dashboard').then(m => m.CategoryDashboardComponent);
const loadCategorySavedPosts = () => import('../pages/Public/pages/category-saved-posts/category-saved-posts').then(m => m.CategorySavedPostsComponent);
const loadFeedLayout = () => import('../pages/Public/Widgets/feeds/feed-layout/feed-layout').then(m => m.FeedLayoutComponent);
const loadPostForm = () => import('../pages/Public/pages/posts/post-form/post-form').then(m => m.PostFormComponent);
const loadConnectRss = () => import('../pages/Public/pages/rss/connect-rss/connect-rss.component').then(m => m.ConnectRssComponent);
const loadForumQuestions = () => import('../pages/Public/pages/forums/pages/forum-questions/forum-questions').then(m => m.ForumQuestionsComponent);
const loadCreateQuestion = () => import('../pages/Public/pages/forums/pages/create-question/create-question.component').then(m => m.CreateQuestionComponent);
const loadQuestionDetails = () => import('../pages/Public/pages/forums/pages/question-details/question-details.component').then(m => m.QuestionDetailsComponent);
const loadPublicLayout = () => import('../pages/Layout/public-layout/public-layout.component').then(m => m.PublicLayoutComponent);

const departmentShellMatcher: UrlMatcher = (segments) => {
  if (!segments.length || !isDepartmentPath(segments[0]?.path)) {
    return null;
  }

  return { consumed: [] };
};

type GenericDepartmentRouteConfig = {
  categoryId: CategoryEnum;
  path: string;
  label: string;
};

const GENERIC_DEPARTMENT_ROUTE_CONFIGS: GenericDepartmentRouteConfig[] = [
  { categoryId: CategoryEnum.Culture, path: 'culture', label: 'Culture' },
  { categoryId: CategoryEnum.Education, path: 'education', label: 'Education' },
  { categoryId: CategoryEnum.Health, path: 'health', label: 'Health' },
  { categoryId: CategoryEnum.Lifestyle, path: 'lifestyle', label: 'Lifestyle' },
  { categoryId: CategoryEnum.Legal, path: 'legal', label: 'Legal' },
  { categoryId: CategoryEnum.News, path: 'news', label: 'News' },
  { categoryId: CategoryEnum.Social, path: 'social', label: 'Social' },
  { categoryId: CategoryEnum.Transportation, path: 'transportation', label: 'Transportation' },
  { categoryId: CategoryEnum.Tv, path: 'tv', label: 'TV' }
];

const buildGenericDepartmentRoutes = ({ categoryId, path, label }: GenericDepartmentRouteConfig): Routes => ([
  {
    path: `${path}/discussions/create`,
    canActivate: [authGuard],
    data: { breadcrumb: 'Ask a Question', slug: path },
    loadComponent: loadCreateQuestion
  },
  {
    path: `${path}/discussions/questions/:id`,
    canActivate: [authGuard],
    data: { breadcrumb: 'Question', slug: path },
    loadComponent: loadQuestionDetails
  },
  {
    path: `${path}/discussions`,
    canActivate: [authGuard],
    data: { breadcrumb: 'Forum', slug: path },
    loadComponent: loadForumQuestions
  },
  {
    path: `${path}/rss/connect`,
    canActivate: [authGuard],
    data: { breadcrumb: 'Connect RSS', categoryId, categoryPath: path },
    loadComponent: loadConnectRss
  },
  {
    path: `${path}/create`,
    canActivate: [authGuard],
    data: { breadcrumb: 'Create Post', categoryId, categoryPath: path },
    loadComponent: loadPostForm
  },
  {
    path: `${path}/saved`,
    canActivate: [authGuard],
    data: { breadcrumb: 'My Inquiries', categoryPath: path },
    loadComponent: loadCategorySavedPosts
  },
  {
    path: `${path}/dashboard`,
    canActivate: [authGuard],
    data: { breadcrumb: 'Dashboard', categoryPath: path },
    loadComponent: loadCategoryDashboard
  },
  {
    path: `${path}/explore`,
    canActivate: [authGuard],
    data: { breadcrumb: 'Explore', categoryEnum: categoryId, title: label },
    loadComponent: loadFeedLayout
  },
  {
    path,
    pathMatch: 'full',
    canActivate: [authGuard],
    data: { breadcrumb: 'Category', categoryPath: path },
    loadComponent: loadCategoryHome
  }
]);

const ROOT_DEPARTMENT_ROUTES: Routes = [
  ...GENERIC_DEPARTMENT_ROUTE_CONFIGS.flatMap(buildGenericDepartmentRoutes),
  {
    path: 'community/discussions/create',
    canActivate: [authGuard],
    data: { breadcrumb: 'Ask a Question', slug: 'community' },
    loadComponent: loadCreateQuestion
  },
  {
    path: 'community/discussions/questions/:id',
    canActivate: [authGuard],
    data: { breadcrumb: 'Question', slug: 'community' },
    loadComponent: loadQuestionDetails
  },
  {
    path: 'community/discussions',
    canActivate: [authGuard],
    data: { breadcrumb: 'Forum', slug: 'community' },
    loadComponent: loadForumQuestions
  },
  {
    path: 'community/rss/connect',
    canActivate: [authGuard],
    data: { breadcrumb: 'Connect RSS', categoryId: CategoryEnum.Community, categoryPath: 'community' },
    loadComponent: loadConnectRss
  },
  {
    path: 'community/create/article',
    canActivate: [authGuard],
    data: { breadcrumb: 'Create Post', categoryId: CategoryEnum.Community, categoryPath: 'community' },
    loadComponent: loadPostForm
  },
  {
    path: 'community/create/community',
    canActivate: [authGuard],
    data: { breadcrumb: 'Create Community' },
    loadComponent: loadCreateCommunity
  },
  {
    path: 'community/saved',
    canActivate: [authGuard],
    data: { breadcrumb: 'My Inquiries', categoryPath: 'community' },
    loadComponent: loadCategorySavedPosts
  },
  {
    path: 'community/dashboard',
    canActivate: [authGuard],
    data: { breadcrumb: 'Dashboard', categoryPath: 'community' },
    loadComponent: loadCategoryDashboard
  },
  {
    path: 'community/explore',
    canActivate: [authGuard],
    data: { breadcrumb: 'Explore' },
    loadComponent: loadCommunityDiscovery
  },
  {
    path: 'community/my-communities',
    canActivate: [authGuard],
    data: { breadcrumb: 'My Communities' },
    loadComponent: loadMyCommunities
  },
  {
    path: 'community/post/:id',
    canActivate: [authGuard],
    data: { breadcrumb: 'Post Details' },
    loadComponent: loadCommunityPostDetails
  },
  {
    path: 'community/:id/create-post',
    canActivate: [authGuard],
    data: { breadcrumb: 'Create Post' },
    loadComponent: loadCreateCommunityPost
  },
  {
    path: 'community/:slug/manage',
    canActivate: [authGuard],
    data: { breadcrumb: 'Manage Community' },
    loadComponent: loadCommunityManagement
  },
  {
    path: 'community/:slug',
    canActivate: [authGuard],
    data: { breadcrumb: 'Community Profile' },
    loadComponent: loadCommunityProfile
  },
  {
    path: 'community',
    pathMatch: 'full',
    canActivate: [authGuard],
    data: { breadcrumb: 'Communities' },
    loadComponent: loadCommunityHome
  },
  {
    path: 'housing/discussions/create',
    canActivate: [authGuard],
    data: { breadcrumb: 'Ask a Question', slug: 'housing' },
    loadComponent: loadCreateQuestion
  },
  {
    path: 'housing/discussions/questions/:id',
    canActivate: [authGuard],
    data: { breadcrumb: 'Question', slug: 'housing' },
    loadComponent: loadQuestionDetails
  },
  {
    path: 'housing/discussions',
    canActivate: [authGuard],
    data: { breadcrumb: 'Forum', slug: 'housing' },
    loadComponent: loadForumQuestions
  },
  {
    path: 'housing/rss/connect',
    canActivate: [authGuard],
    data: { breadcrumb: 'Connect RSS', categoryId: CategoryEnum.Housing, categoryPath: 'housing' },
    loadComponent: loadConnectRss
  },
  {
    path: 'housing/create/article',
    canActivate: [authGuard],
    data: { breadcrumb: 'Create Post', categoryId: CategoryEnum.Housing, categoryPath: 'housing' },
    loadComponent: loadPostForm
  },
  {
    path: 'housing/saved',
    canActivate: [authGuard],
    data: { breadcrumb: 'My Inquiries', categoryPath: 'housing' },
    loadComponent: loadCategorySavedPosts
  },
  {
    path: 'housing/dashboard',
    canActivate: [authGuard],
    data: { breadcrumb: 'Agent Dashboard' },
    loadComponent: loadAgentDashboard,
    children: [
      { path: '', loadComponent: loadAgentOverview },
      { path: 'requests', data: { breadcrumb: 'Requests' }, loadComponent: loadAgentRequests },
      { path: 'listings', data: { breadcrumb: 'Listings' }, loadComponent: loadAgentListings }
    ]
  },
  {
    path: 'housing/explore',
    canActivate: [authGuard],
    data: { breadcrumb: 'Housing Feed' },
    loadComponent: loadHousingFeed
  },
  {
    path: 'housing/create/renting',
    canActivate: [authGuard],
    data: { breadcrumb: 'List for Rent' },
    loadComponent: loadCreateHousing
  },
  {
    path: 'housing/create/sale',
    canActivate: [authGuard],
    data: { breadcrumb: 'List for Sale' },
    loadComponent: loadCreateSale
  },
  { path: 'housing/create', redirectTo: 'housing/create/renting', pathMatch: 'full' },
  {
    path: 'housing/listing-authorization',
    canActivate: [authGuard],
    data: { breadcrumb: 'Listing Authorization' },
    loadComponent: loadListingAuthorization
  },
  {
    path: 'housing/details/:id',
    canActivate: [authGuard],
    data: { breadcrumb: 'Listing Details' },
    loadComponent: loadHousingDetails
  },
  {
    path: 'housing/my-requests',
    canActivate: [authGuard],
    data: { breadcrumb: 'My Requests' },
    loadComponent: loadHousingRequests
  },
  {
    path: 'housing/edit/:id',
    canActivate: [authGuard],
    data: { breadcrumb: 'Edit Listing' },
    loadComponent: loadEditHousing
  },
  {
    path: 'housing/edit/renting/:id',
    canActivate: [authGuard],
    data: { breadcrumb: 'Edit Rental' },
    loadComponent: loadEditRenting
  },
  {
    path: 'housing/edit/sale/:id',
    canActivate: [authGuard],
    data: { breadcrumb: 'Edit Sale' },
    loadComponent: loadEditSale
  },
  {
    path: 'housing',
    pathMatch: 'full',
    canActivate: [authGuard],
    data: { breadcrumb: 'Housing' },
    loadComponent: loadHousingHome
  },
  {
    path: 'professions/discussions/create',
    canActivate: [authGuard],
    data: { breadcrumb: 'Ask a Question', slug: 'professions' },
    loadComponent: loadCreateQuestion
  },
  {
    path: 'professions/discussions/questions/:id',
    canActivate: [authGuard],
    data: { breadcrumb: 'Question', slug: 'professions' },
    loadComponent: loadQuestionDetails
  },
  {
    path: 'professions/discussions',
    canActivate: [authGuard],
    data: { breadcrumb: 'Forum', slug: 'professions' },
    loadComponent: loadForumQuestions
  },
  {
    path: 'professions/rss/connect',
    canActivate: [authGuard],
    data: { breadcrumb: 'Connect RSS', categoryId: CategoryEnum.Professions, categoryPath: 'professions' },
    loadComponent: loadConnectRss
  },
  {
    path: 'professions/create/article',
    canActivate: [authGuard],
    data: { breadcrumb: 'Create Post', categoryId: CategoryEnum.Professions, categoryPath: 'professions' },
    loadComponent: loadPostForm
  },
  {
    path: 'professions/saved',
    canActivate: [authGuard],
    data: { breadcrumb: 'My Inquiries', categoryPath: 'professions' },
    loadComponent: loadCategorySavedPosts
  },
  {
    path: 'professions/dashboard',
    canActivate: [authGuard],
    data: { breadcrumb: 'Dashboard', categoryPath: 'professions' },
    loadComponent: loadCategoryDashboard
  },
  {
    path: 'professions/jobs/:id',
    canActivate: [authGuard],
    data: { breadcrumb: 'Job Details' },
    loadComponent: loadJobProfile
  },
  {
    path: 'professions/jobs',
    canActivate: [authGuard],
    data: { breadcrumb: 'Job Search' },
    loadComponent: loadJobSearch
  },
  {
    path: 'professions/applications',
    canActivate: [authGuard],
    data: { breadcrumb: 'My Applications' },
    loadComponent: loadMyApplications
  },
  {
    path: 'professions/offers/create',
    canActivate: [authGuard],
    data: { breadcrumb: 'Create Offer' },
    loadComponent: loadCreateOffer
  },
  {
    path: 'professions/offers/edit/:id',
    canActivate: [authGuard],
    data: { breadcrumb: 'Edit Offer' },
    loadComponent: loadEditOffer
  },
  {
    path: 'professions/offers',
    canActivate: [authGuard],
    data: { breadcrumb: 'My Offers' },
    loadComponent: loadMyOffers
  },
  {
    path: 'professions',
    pathMatch: 'full',
    canActivate: [authGuard],
    data: { breadcrumb: 'Profession' },
    loadComponent: loadProfessionsHome
  }
];

/**
 * NYC-360 Main Routing Table
 * Standardized with Maximum Lazy Loading for optimal performance.
 */
export const routes: Routes = [
  // ============================================================
  // 1. AUTH MODULE (Lazy Loaded)
  // ============================================================
  {
    path: 'auth',
    loadChildren: () => import('./auth.routes').then(m => m.AUTH_ROUTES)
  },

  // ============================================================
  // 2. DEPARTMENT ROUTES (Clean root URLs inside public shell)
  // ============================================================
  {
    matcher: departmentShellMatcher,
    loadComponent: loadPublicLayout,
    canActivate: [authGuard],
    children: ROOT_DEPARTMENT_ROUTES
  },

  // ============================================================
  // 3. LANDING & GENERAL (Minimal initial bundle)
  // ============================================================
  {
    path: '',
    loadComponent: () => import('../pages/Layout/landing-layout/landing-layout').then(m => m.LandingLayout),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('../pages/landing/pages/landing-page/landing-page').then(m => m.LandingPage)
      },
      {
        path: 'about',
        loadComponent: () => import('../pages/landing/pages/about-us/about-us').then(m => m.AboutUsComponent)
      }
    ]
  },

  // ============================================================
  // 4. PUBLIC MODULE (Legacy Lazy Loaded with Layout & Guards)
  // ============================================================
  {
    path: 'public',
    loadChildren: () => import('./public.routes').then(m => m.PUBLIC_ROUTES)
  },

  // ============================================================
  // 5. ADMIN DASHBOARD (Lazy Loaded with RBAC Guards)
  // ============================================================
  {
    path: 'admin',
    loadChildren: () => import('./admin.routes').then(m => m.ADMIN_ROUTES)
  },

  // ============================================================
  // 6. SYSTEM ROUTES
  // ============================================================
  {
    path: 'access-denied',
    loadComponent: () => import('../pages/Public/Widgets/access-denied/access-denied.component').then(m => m.AccessDeniedComponent)
  },

  {
    path: '**',
    loadComponent: () => import('../pages/Public/Widgets/not-found/not-found').then(m => m.NotFoundComponent)
  }
];
