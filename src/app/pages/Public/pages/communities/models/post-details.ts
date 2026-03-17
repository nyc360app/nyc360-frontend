export interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
  error: any;
}

export interface PostDetailsData {
  post: Post;
  comments: PostComment[]; 
  relatedPosts: RelatedPost[];
}

export interface Author {
  id: number;
  name: string;
  imageUrl: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  sourceType: number;
  postType: number;
  category: number;
  location: any;
  parentPost: any;
  attachments: Attachment[];
  stats: Stats;
  createdAt: string;
  lastUpdated: string;
  author: Author; 
  tags: any[];
  isSavedByUser: boolean;
  currentUserInteraction: any; // سيحمل قيمة 0 أو 1 أو 2
  linkedResource: any;
}

export interface Attachment {
  id: number;
  url: string;
}

export interface Stats {
  views: number;
  likes: number;
  dislikes: number;
  comments: number;
  shares: number;
}

export interface PostComment {
  id: number;
  content: string;
  author: Author;
  createdAt: string;
  replies: any[];
}

export interface RelatedPost {
  id: number;
  title: string;
  imageUrl: string;
  commentsCount: number;
}

// قمنا بإضافة هذا الـ Enum للتعامل مع التفاعل في الكود
export enum InteractionType {
  None = 0,
  Like = 1,
  Dislike = 2
}