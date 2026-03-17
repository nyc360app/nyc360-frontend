// src/app/pages/Public/pages/communities/models/create-community.models.ts

export enum CommunityType {
  District = 1,
  Neighborhood = 2,
  LocalService = 3,
  HousingHelp = 4,
  PublicResources = 5,
  CivicNotices = 6,
  SafetyAlerts = 7,
  CommunityBoards = 8,
  YouthResources = 9,
  SeniorResources = 10,
  FamilySupport = 11,
  Accessibility = 12
}

export const COMMUNITY_TYPES_LIST = [
  { id: 1, name: 'District' },
  { id: 2, name: 'Neighborhood' },
  { id: 3, name: 'Local Service' },
  { id: 4, name: 'Housing Help' },
  { id: 5, name: 'Public Resources' },
  { id: 6, name: 'Civic Notices' },
  { id: 7, name: 'Safety Alerts' },
  { id: 8, name: 'Community Boards' },
  { id: 9, name: 'Youth Resources' },
  { id: 10, name: 'Senior Resources' },
  { id: 11, name: 'Family Support' },
  { id: 12, name: 'Accessibility' }
];

// ✅ New: Location Search Result Interface
export interface LocationSearchResult {
  id: number;
  borough: string;
  code: string;
  neighborhoodNet: string;
  neighborhood: string;
  zipCode: number;
}

export interface Tag {
  id: number;
  name: string;
  type: number;
  division?: number | null;
  parent?: string | null;
  children?: string[] | null;
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
  error: { code: string; message: string } | null;
}