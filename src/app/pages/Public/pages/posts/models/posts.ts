// src/app/pages/Dashboard/pages/posts/models/posts.ts

export enum InteractionType {
  Like = 1,
  Dislike = 2
}

export enum FlagReasonType {
  Spam = 1,
  HateSpeech = 2,
  Harassment = 3,
  InappropriateContent = 4,
  ScamOrFraud = 5,
  ViolationOfPolicy = 6,
  Other = 7
}

// --- Shared Interfaces ---

export interface PostAttachment {
  id: number;
  url: string;
  type?: number;
}

export interface PostAuthor {
  id: number;
  username?: string;
  fullName?: string;
  name?: string; // ✅ Added based on API Response
  imageUrl?: string;
  type?: number;
}

export interface PostStats {
  views: number;
  likes: number;
  dislikes: number;
  comments: number;
  shares: number;
}

export interface PostComment {
  id: number;
  content: string;
  author: PostAuthor | string;
  createdAt: string;
  replies?: PostComment[];
  isReplying?: boolean;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  category: number;
  createdAt: string;
  imageUrl?: string | null;
  lastUpdated?: string;
  sourceType?: number;
  postType?: number;
  tags?: string[];
  author?: PostAuthor | string;
  stats?: PostStats;
  comments?: PostComment[];
  attachments?: PostAttachment[];
  location?: any;

  // Interaction & State
  currentUserInteraction?: InteractionType | null;
  userInteraction?: InteractionType | null; // For UI mapping

  parentPost?: Post;

  // ✅ Backend Field
  isSavedByUser?: boolean;
  // ✅ UI State Field
  isSaved?: boolean;

  // UI State for feed/profile
  showComments?: boolean;
  newCommentContent?: string;
}

export interface InterestGroup {
  category: number;
  posts: Post[];
}

export interface CommunitySuggestion {
  id: number;
  name: string;
  slug: string;
  memberCount?: number;
  isJoined?: boolean;
  isLoadingJoin?: boolean;
}

export interface FeedData {
  featuredPosts: Post[];
  interestGroups: InterestGroup[];
  discoveryPosts: Post[];
  suggestedCommunities: CommunitySuggestion[];
  trendingTags: string[];
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
  error: { code: string; message: string } | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}