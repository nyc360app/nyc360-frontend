export interface MyCommunity {
  id: number;
  name: string;
  slug: string;
  description: string;
  avatarUrl: string | null;
  type: number;
  memberCount: number;
  isPrivate: boolean;
  // UI States
  isJoined?: boolean; 
  isLoadingJoin?: boolean;
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  error: any;
}

export interface MyCommunitiesParams {
  search?: string;
  type?: number;
  locationId?: number;
  page?: number;
  pageSize?: number;
  Page?: number;
  PageSize?: number;
}

export interface CommunityMyRequest {
  communityId: number;
  communityName?: string;
  communitySlug?: string;
  status?: string;
  requestedAt?: string;
  reviewedAt?: string | null;
  memberRole?: number | string | null;
  isPrivate?: boolean;
}
