// src/app/pages/Public/pages/community/models/community.models.ts

// --- Shared Types ---
export interface Author {
  id: number;
  name: string;
  imageUrl?: string;
}

export interface Attachment {
  id: number;
  url: string;
}

export interface PostStats {
  views: number;
  likes: number;
  dislikes: number;
  comments: number;
  shares: number;
}

// --- Feed Post ---
export interface CommunityPost {
  id: number;
  title: string;
  content: string;
  category: number;
  createdAt: string;
  author: Author | string;
  attachments: Attachment[];
  stats: PostStats;
  tags?: string[];
}

// --- Community Suggestion (Matches your JSON Data item) ---
export interface CommunitySuggestion {
  id: number;
  name: string;
  slug: string;
  description: string;
  avatarUrl: string; // Matches JSON
  type: number;
  memberCount: number;
  isPrivate: boolean; // Matches JSON

  // UI State (Not from API, added locally)
  isJoined?: boolean;
  isLoadingJoin?: boolean;
}

// --- Feed Response ---
export interface FeedResponse {
  isSuccess: boolean;
  data: CommunityPost[];
  totalCount: number;
}

export interface UserTag {
  id: number;
  name: string;
  type?: number;
}

export interface CommunityHomeData {
  feed: FeedResponse;
  suggestions: CommunitySuggestion[];
  tags?: UserTag[];
}

// --- ✅ Generic API Response (Updated strictly for your JSON) ---
export interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
  error: { code: string; message: string } | null;

  // Pagination Fields (Root level in your JSON)
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}

// Join Request Body
export interface JoinCommunityDto {
  communityId: number;
}