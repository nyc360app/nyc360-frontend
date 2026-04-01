export interface CategoryPost {
  id: number;
  title: string;
  content: string | null;
  category: number;
  createdAt: string;
  author: {
    id: number;
    username?: string;
    name?: string;
    imageUrl: string;
    type?: number;
  };
  attachments: { id: number; url: string }[];
  stats: { views: number; likes: number; shares: number; comments: number };
  parentPost?: CategoryPost;
  isSavedByUser: boolean;
  sourceType?: number;

  // New fields for Housing and metadata support
  location?: {
    borough: string;
    neighborhood: string;
    zipCode: number;
  };
  housingMetadata?: {
    Type: string;
    IsRenting: boolean;
    Rooms: number;
    Bathrooms: number;
    SizeSqFt: number;
    Price: number;
  };
  cleanDescription?: string;
  externalLink?: string;
}

export interface CategoryHomeData {
  featured: CategoryPost[];
  latest: CategoryPost[];
  rss?: CategoryPost[];
  trending: CategoryPost[];
  tags?: any[];
}

export interface CategoryHomeResponse {
  isSuccess: boolean;
  data: CategoryHomeData;
  error: any;
}

export interface LatestRssFeedItemDto {
  id: number;
  sourceId: number;
  category: number;
  title: string;
  link: string;
  summary: string | null;
  imageUrl: string | null;
  publishedAt: string;
}

export interface StandardApiResponse<T> {
  isSuccess?: boolean;
  data?: T;
  error?: any;
  IsSuccess?: boolean;
  Data?: T;
  Error?: any;
}
