export enum PostCategory {
  Art = 1, Community = 2, Culture = 3, Education = 4, Events = 5,
  Lifestyle = 6, Media = 7, News = 8, Recruitment = 9, Social = 10,
  Tourism = 11, Tv = 12
}

export const PostCategoryList = [
  { id: 1, name: 'Art' }, { id: 2, name: 'Community' }, { id: 3, name: 'Culture' },
  { id: 4, name: 'Education' }, { id: 5, name: 'Events' }, { id: 6, name: 'Lifestyle' },
  { id: 7, name: 'Media' }, { id: 8, name: 'News' }, { id: 9, name: 'Recruitment' },
  { id: 10, name: 'Social' }, { id: 11, name: 'Tourism' }, { id: 12, name: 'TV' }
];

export enum InteractionType { Like = 1, Dislike = 2 }

// Enum for Report Reasons (Matches Backend)
export enum FlagReasonType {
  Spam = 1,
  HateSpeech = 2,
  Harassment = 3,
  InappropriateContent = 4,
  ScamOrFraud = 5,
  ViolationOfPolicy = 6,
  Other = 7
}

export interface PostAttachment { id: number; url: string; }

export interface PostAuthor {
  id: number; username?: string; fullName?: string; name?: string;
  imageUrl?: string | null; type?: number;
}

export interface PostStats {
  views: number; likes: number; dislikes: number; comments: number; shares: number;
}

export interface Comment {
  id: number; content: string; author: PostAuthor | string;
  createdAt: string; replies?: Comment[]; isReplying?: boolean;
}

export interface Post {
  id: number; title: string; content: string; sourceType?: number;
  postType?: number; category: number; attachments: PostAttachment[];
  imageUrl?: string | null; stats?: PostStats; comments?: Comment[];
  author?: PostAuthor | string; createdAt: string; lastUpdated: string;
  currentUserInteraction?: number;
}

export interface ApiResponse<T> {
  isSuccess: boolean; data: T; error: { code: string; message: string } | null;
  page?: number; pageSize?: number; totalCount?: number; totalPages?: number;
}