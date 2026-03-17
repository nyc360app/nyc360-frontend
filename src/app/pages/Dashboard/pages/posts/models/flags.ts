// Enum for Reason (Matches Backend)
export enum FlagReasonType {
  Spam = 1,
  HateSpeech = 2,
  Harassment = 3,
  InappropriateContent = 4,
  ScamOrFraud = 5,
  ViolationOfPolicy = 6,
  Other = 7
}

// Enum for Status (Matches Backend)
export enum FlagStatus {
  Pending = 1,
  UnderReview = 2,
  Rejected = 3,    // Admin reviewed, report ignored
  ActionTaken = 4  // Admin reviewed, post removed/punished
}

// Helper to map IDs to Text
export const FlagReasonLabel: { [key: number]: string } = {
  1: 'Spam',
  2: 'Hate Speech',
  3: 'Harassment',
  4: 'Inappropriate',
  5: 'Scam/Fraud',
  6: 'Policy Violation',
  7: 'Other'
};

// Interface for the Flag Data (GET Response)
export interface FlaggedPost {
  id: number;          // The Flag ID
  postId: number;
  postTitle: string;
  postContentSnippet: string;
  userId: number;      // Reporter ID
  username: string;    // Reporter Name
  reason: number;      // FlagReasonType
  details: string;
  createdAt: string;
  status: number;      // FlagStatus
}

// Interface for API Response Wrapper
export interface FlagsApiResponse {
  isSuccess: boolean;
  data: FlaggedPost[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  error: any;
}

// Interface for Review Request (POST Body)
export interface ReviewFlagRequest {
  newStatus: number; // 3 (Rejected) or 4 (ActionTaken)
  adminNote: string;
}