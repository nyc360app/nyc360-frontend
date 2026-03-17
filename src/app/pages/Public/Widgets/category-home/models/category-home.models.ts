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
}

export interface CategoryHomeData {
  featured: CategoryPost[];
  latest: CategoryPost[];
  trending: CategoryPost[];
}

export interface CategoryHomeResponse {
  isSuccess: boolean;
  data: CategoryHomeData;
  error: any;
}