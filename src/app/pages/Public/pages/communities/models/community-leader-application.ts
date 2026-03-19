export interface CommunityLeaderApplicationPayload {
  fullName: string;
  email: string;
  phoneNumber: string;
  communityName: string;
  location: string;
  verificationFile: File;
  profileLink?: string;
  motivation: string;
  experience: string;
  ledBefore: boolean;
  weeklyAvailability: string;
  agreedToGuidelines: boolean;
}

export interface CommunityLeaderApplicationResponseData {
  applicationId: number;
  status: string;
  submittedAt: string;
}
