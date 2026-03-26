export interface UserInfo {
  type: number;
  roles: string[];
  firstName: string;
  lastName: string;
  headline: string;
  bio: string;
  email: string;
  phoneNumber: string;
  avatarUrl: string;
  coverImageUrl: string;
  twoFactorEnabled: boolean;
  emailConfirmed?: boolean;
  isVerified: boolean;
  isPending: boolean;
  location: UserLocation | null;
  interests: number[];
  socialLinks: SocialLink[];
  positions: Position[];
  education: Education[];
  tags: Tag[];
  businessInfo: BusinessInfo | null;
  applicationsCount?: number;
}

export interface UserLocation {
  id: number;
  borough: string;
  code: string;
  neighborhoodNet: string;
  neighborhood: string;
  zipCode: number;
}

export interface SocialLink {
  id: number;
  platform: number;
  url: string;
}

export interface Position {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface Education {
  school: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface BusinessInfo {
  organizationType: number;
  profitModel: number;
  industry: number;
}
