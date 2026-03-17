export interface FeedArticle {
  id: number;
  title: string;
  content: string;
  category: number;
  attachments: { id: number; url: string }[];
  author: { id: number; username: string; imageUrl: string; fullName?: string; type?: number };
  createdAt: string;
  isSavedByUser: boolean;
  imageUrl?: string;
  parentPost?: any;
}

export interface HiringJob {
  id: number;
  title: string;
  salaryMin: number;
  salaryMax: number;
  workArrangement: number;
  employmentType: number;
  employmentLevel: number;
  companyName: string;
  authorAvatarUrl?: string;
}

// Basic tag interface
export interface UserTag {
  id: number;
  name: string;
}

export interface ProfessionFeedData {
  heroArticle: FeedArticle;
  careerArticles: FeedArticle[];
  hiringNews: HiringJob[];
  tags?: UserTag[];
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
  error: any;
}