import { Post, PostComment, PostStats } from "../../posts/models/posts";

export enum UserType {
  Normal = 0, Organization = 1, Admin = 2
}

export enum SocialPlatform {
  Facebook = 0, Twitter = 1, Instagram = 2, LinkedIn = 3, Github = 4, Youtube = 5, Website = 6, Other = 7
}

// --- UI Helper Models ---
export interface DashboardCard {
  type: string;
  status: string;
  title: string;
  sub: string;
  detail: string;
  action: string;
  isEvent?: boolean;
}

// --- Domain Models based on your JSON ---
export interface UserSocialLink {
  id?: number;
  linkId?: number;
  platform: SocialPlatform;
  url: string;
}

export interface Position {
  id: number;
  title: string;
  company: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
}

export interface Education {
  id: number;
  school: string;
  degree: string;
  fieldOfStudy?: string;
  startDate: string;
  endDate?: string;
}

export interface CommunitySummary {
  id: number;
  name: string;
  slug?: string;
  // MembersCount removed because it's not in your JSON, we will handle it in UI
}

export interface UserStats {
  postsCount: number;
  followersCount: number;
  followingCount: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  applicationsCount?: number;
  isVerified: boolean | null;
}

// Updated Post interface to match the nesting in your JSON
export interface ProfilePost {
  id: number;
  title: string | null;
  content: string | null;
  sourceType: number;
  postType: number;
  category: number;
  createdAt: string;
  attachments: any[];
  imageUrl?: string | null;

  parentPost?: ProfilePost | null; // For shared posts
  author?: {
    id: number;
    username: string;
    fullName: string;
    imageUrl: string;
  };
  stats?: PostStats;
  userInteraction?: number | null;
  showComments?: boolean;
  newCommentContent?: string;
  comments?: PostComment[];
}

export interface UserLocation {
  id: number;
  borough: string;
  neighborhood: string;
  zipCode: number;
  neighborhoodNet?: string;
  code?: string;
}

export interface UserProfileData {
  id: number;
  type: UserType;
  imageUrl: string | null;
  coverImageUrl: string | null;
  firstName: string;
  lastName: string;
  headline: string;
  bio: string;
  email: string;
  phoneNumber: string;
  locationId: number | null;
  location: UserLocation | null;
  positions: Position[];
  education: Education[];
  topCommunities: CommunitySummary[];
  recentPosts: ProfilePost[];
  socialLinks: UserSocialLink[];
  stats?: UserStats | null;
  tags?: any[];
  interests?: number[];
}

// --- Request DTOs ---
export interface UpdateBasicProfileDto {
  FirstName: string;
  LastName: string;
  Headline: string;
  Bio: string;
  LocationId: number;
}

export interface AddEducationDto {
  School: string;
  Degree: string;
  FieldOfStudy: string;
  StartDate: string;
  EndDate?: string;
}

export interface UpdateEducationDto {
  EducationId: number;
  School: string;
  Degree: string;
  FieldOfStudy: string;
  StartDate: string;
  EndDate?: string;
}

export interface AddPositionDto {
  Title: string;
  Company: string;
  StartDate: string;
  EndDate?: string;
  IsCurrent: boolean;
}

export interface UpdatePositionDto {
  PositionId: number;
  Title: string;
  Company: string;
  StartDate: string;
  EndDate?: string;
  IsCurrent: boolean;
}

export interface SocialLinkDto {
  LinkId?: number;
  Platform: SocialPlatform;
  Url: string;
}

export interface Toggle2FADto {
  Enable: boolean;
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
  error: { code: string; message: string } | null;
}