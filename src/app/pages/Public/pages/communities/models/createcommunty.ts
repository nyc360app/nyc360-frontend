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

export interface CommunityTypeOption {
  id: number;
  name: string;
}

export interface CommunityCategoryOption {
  code: string;
  name: string;
  types: CommunityTypeOption[];
}

export interface CommunityDivisionTagOption {
  id: string;
  name: string;
  className: string;
  biIcon: string;
}

export interface CommunityNeighborhoodOption {
  name: string;
  zipCode: string;
}

export interface CommunityBoroughOption {
  name: string;
  neighborhoods: CommunityNeighborhoodOption[];
}

export const COMMUNITY_CATEGORY_OPTIONS: CommunityCategoryOption[] = [
  {
    code: 'A',
    name: 'Geographic Communities',
    types: [
      { id: 101, name: 'City Community' },
      { id: 102, name: 'District Community' },
      { id: 103, name: 'Borough Community' },
      { id: 104, name: 'Ward Community' },
      { id: 105, name: 'Zone Community' },
      { id: 106, name: 'Neighborhood Community' }
    ]
  },
  {
    code: 'B',
    name: 'Government & Civic Communities',
    types: [
      { id: 201, name: 'Local Governance Community' },
      { id: 202, name: 'City Council Community' },
      { id: 203, name: 'Civic Engagement Community' },
      { id: 204, name: 'Public Services Community' },
      { id: 205, name: 'Safety Community' },
      { id: 206, name: 'Public Meetings Community' },
      { id: 207, name: 'Regulatory Community' },
      { id: 208, name: 'Policy Community' }
    ]
  },
  {
    code: 'C',
    name: 'Public & Social Service Communities',
    types: [
      { id: 301, name: 'Local Services Community' },
      { id: 302, name: 'Housing Support Community' },
      { id: 303, name: 'Family Support Community' },
      { id: 304, name: 'Youth Community' },
      { id: 305, name: 'Senior Community' },
      { id: 306, name: 'Accessibility Community' },
      { id: 307, name: 'Education Support Community' },
      { id: 308, name: 'Employment Support Community' },
      { id: 309, name: 'Health Support Community' },
      { id: 310, name: 'Emergency Support Community' },
      { id: 311, name: 'Food Assistance Community' },
      { id: 312, name: 'Legal Aid Community' }
    ]
  },
  {
    code: 'D',
    name: 'Economic & Professional Communities',
    types: [
      { id: 401, name: 'Business Community' },
      { id: 402, name: 'Professional Community' },
      { id: 403, name: 'Entrepreneur Community' },
      { id: 404, name: 'Skilled Trade Community' },
      { id: 405, name: 'Workforce Community' },
      { id: 406, name: 'Startup Community' },
      { id: 407, name: 'Freelancer Community' },
      { id: 408, name: 'Industry Community' }
    ]
  },
  {
    code: 'E',
    name: 'Social & Relationship Communities',
    types: [
      { id: 501, name: 'Friends Community' },
      { id: 502, name: 'Networking Community' },
      { id: 503, name: 'Volunteer Community' },
      { id: 504, name: 'Peer Support Community' },
      { id: 505, name: 'Parent Community' },
      { id: 506, name: 'Student Community' },
      { id: 507, name: 'Alumni Community' },
      { id: 508, name: 'Advocacy Community' },
      { id: 509, name: 'Civic Initiative Community' },
      { id: 510, name: 'Mentorship Community' }
    ]
  }
];

export const COMMUNITY_CATEGORY_TYPE_LIST: CommunityTypeOption[] =
  COMMUNITY_CATEGORY_OPTIONS.flatMap((category) => category.types);

export const COMMUNITY_DIVISION_TAG_OPTIONS: CommunityDivisionTagOption[] = [
  { id: 'community', name: 'Community', className: 'tag-community', biIcon: 'bi-people-fill' },
  { id: 'culture', name: 'Culture', className: 'tag-culture', biIcon: 'bi-palette-fill' },
  { id: 'education', name: 'Education', className: 'tag-education', biIcon: 'bi-mortarboard-fill' },
  { id: 'health', name: 'Health', className: 'tag-health', biIcon: 'bi-heart-pulse-fill' },
  { id: 'housing', name: 'Housing', className: 'tag-housing', biIcon: 'bi-house-heart-fill' },
  { id: 'lifestyle', name: 'Lifestyle', className: 'tag-lifestyle', biIcon: 'bi-cup-hot-fill' },
  { id: 'legal', name: 'Legal', className: 'tag-legal', biIcon: 'bi-hammer' },
  { id: 'news', name: 'News', className: 'tag-news', biIcon: 'bi-newspaper' },
  { id: 'professions', name: 'Professions', className: 'tag-professions', biIcon: 'bi-briefcase-fill' },
  { id: 'social', name: 'Social', className: 'tag-social', biIcon: 'bi-chat-heart-fill' },
  { id: 'transportation', name: 'Transportation', className: 'tag-transportation', biIcon: 'bi-bus-front-fill' },
  { id: 'tv', name: 'TV', className: 'tag-tv', biIcon: 'bi-tv-fill' }
];

export const COMMUNITY_BOROUGH_OPTIONS: CommunityBoroughOption[] = [
  {
    name: 'Citywide',
    neighborhoods: [
      { name: 'All Neighborhoods', zipCode: '10017' },
      { name: 'Midtown Core', zipCode: '10018' },
      { name: 'Lower Manhattan Hub', zipCode: '10007' }
    ]
  },
  {
    name: 'Manhattan',
    neighborhoods: [
      { name: 'Harlem', zipCode: '10027' },
      { name: 'Upper East Side', zipCode: '10028' },
      { name: 'Midtown East', zipCode: '10017' },
      { name: 'Chelsea', zipCode: '10011' }
    ]
  },
  {
    name: 'Brooklyn',
    neighborhoods: [
      { name: 'Williamsburg', zipCode: '11211' },
      { name: 'Downtown Brooklyn', zipCode: '11201' },
      { name: 'Park Slope', zipCode: '11215' },
      { name: 'Bushwick', zipCode: '11237' }
    ]
  },
  {
    name: 'Queens',
    neighborhoods: [
      { name: 'Astoria', zipCode: '11102' },
      { name: 'Flushing', zipCode: '11354' },
      { name: 'Long Island City', zipCode: '11101' },
      { name: 'Jamaica', zipCode: '11432' }
    ]
  },
  {
    name: 'Bronx',
    neighborhoods: [
      { name: 'Fordham', zipCode: '10458' },
      { name: 'Riverdale', zipCode: '10471' },
      { name: 'Mott Haven', zipCode: '10454' },
      { name: 'Pelham Bay', zipCode: '10461' }
    ]
  },
  {
    name: 'Staten Island',
    neighborhoods: [
      { name: 'St. George', zipCode: '10301' },
      { name: 'Tottenville', zipCode: '10307' },
      { name: 'Great Kills', zipCode: '10308' },
      { name: 'New Dorp', zipCode: '10306' }
    ]
  }
];

export function getCommunityTypeLabel(typeId: number | string | null | undefined): string {
  const normalizedTypeId = Number(typeId);
  const matchedType = COMMUNITY_TYPES_LIST.find((item) => item.id === normalizedTypeId);
  if (matchedType) {
    return matchedType.name;
  }

  const matchedCategoryType = COMMUNITY_CATEGORY_TYPE_LIST.find((item) => item.id === normalizedTypeId);
  return matchedCategoryType?.name || 'Community';
}

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
