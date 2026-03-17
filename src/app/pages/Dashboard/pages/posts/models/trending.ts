// src/app/pages/Dashboard/pages/trending/models/trending.models.ts

export interface TrendingResponse {
  isSuccess: boolean;
  data: TrendingPost[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  error: any;
}

export interface TrendingPost {
  id: number;
  title: string;
  content: string;
  sourceType: number; // 0: Internal, 2: External/RSS
  postType: number;
  category: number;
  attachments: PostAttachment[];
  stats: PostStats;
  createdAt: string;
  lastUpdated: string;
  author: PostAuthor;
  currentUserInteraction: number | null;
}

export interface PostAttachment {
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

export interface PostAuthor {
  id: number;
  username?: string;
  name?: string; // API sometimes returns 'name' for RSS
  fullName?: string;
  imageUrl: string | null;
  type?: number;
}

// قائمة التصنيفات (يمكنك تعديلها حسب نظامك)
export const CategoryMap: { [key: number]: string } = {
  1: 'General',
  10: 'Education',
  12: 'TV & Media',
  // أضف باقي التصنيفات هنا
};