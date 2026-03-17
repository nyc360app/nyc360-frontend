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
  Search?: string;
  Type?: number;
  Page?: number;
  PageSize?: number;
}