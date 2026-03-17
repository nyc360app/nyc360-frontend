// ✅ 1. Enum for Roles (Matching Backend)
export enum CommunityRole {
  Owner = 1,
  Moderator = 2,
  Member = 3
}

// ✅ 2. Community Basic Details
export interface CommunityDetails {
  id: number;
  name: string;
  slug: string;
  description: string;
  type: number;
  imageUrl: string; 
  coverUrl: string; 
  memberCount: number;
}

// ✅ 3. Post Author Interface
export interface PostAuthor {
  id: number;
  name: string;
  avatarUrl?: string;
}

// ✅ 4. Post Interface
export interface Post {
  id: number;
  content: string;
  createdAt: string;
  // Author can be an object or string depending on API, safe typing:
  author: PostAuthor | any; 
  attachments: { id: number; url: string; type?: string }[];
  location?: string;
  stats: { 
    likes: number; 
    comments: number; 
    shares: number; 
  };
}

// ✅ 5. Member Interface (For Members Tab)
export interface CommunityMember {
  userId: number;
  name: string;
  avatarUrl: string | null;
  role: string; // The list API usually returns role name "Admin", "Member"
  joinedAt: string;
}

// ✅ 6. Main Profile Response Data
export interface CommunityProfileData {
  community: CommunityDetails;
  posts: {
    isSuccess: boolean;
    data: Post[];
    page: number;      // Added for pagination
    pageSize: number;  // Added for pagination
    totalCount: number;
    totalPages: number;// Added for pagination
  } | null;
  ownerId: number;
  // This is the current user's role (1, 2, 3)
  memberRole: number | null; 
}

// ✅ 7. Generic API Response Wrapper
export interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
  error: any;
}

// ✅ 8. Create Post Request
export interface CreatePostRequest {
  communityId: number;
  content: string;
  location?: string;
  // Using 'any' here because when sending FormData, we append files manually
  attachments?: File[] | any; 
}