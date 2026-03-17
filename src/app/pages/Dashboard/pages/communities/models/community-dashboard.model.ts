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

export enum DisbandRequestStatus {
    Pending = 0,
    Approved = 1,
    Rejected = 2
}

export interface CommunityDashboardDto {
    id: number;
    name: string;
    slug: string;
    type?: CommunityType;
    memberCount: number;
    leaderCount: number;
    moderatorCount: number;
    isActive: boolean;
    isPrivate: boolean;
    createdAt: string;
    hasPendingDisbandRequest: boolean;
}

export interface CommunityDetailsDto {
    id: number;
    name: string;
    slug: string;
    description: string;
    type?: CommunityType;
    avatarUrl?: string;
    coverUrl?: string;
    isActive: boolean;
    isPrivate: boolean;
    requiresApproval: boolean;
    memberCount: number;
    leaderCount: number;
    moderatorCount: number;
    locationId?: number;
    location?: any;
    createdAt: string;
    lastUpdated: string;
    pendingDisbandRequest?: CommunityDisbandRequestDto;
}

export interface CommunityDisbandRequestDto {
    id: number;
    communityId: number;
    communityName: string;
    requestedByUserId: number;
    requestedByUserName: string;
    reason: string;
    status: DisbandRequestStatus;
    requestedAt: string;
    processedAt?: string;
    processedByUserId?: number;
    processedByUserName?: string;
    adminNotes?: string;
}

export interface CommunityMemberDto {
    userId: number;
    name: string;
    avatarUrl?: string;
    role: string;
    joinedAt: string;
}

export interface PagedResponse<T> {
    data: T[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    isSuccess: boolean;
    error?: any;
}

export interface StandardResponse<T> {
    isSuccess: boolean;
    data: T;
    error?: any;
}

export type CommunityListResponse = StandardResponse<PagedResponse<CommunityDashboardDto>>;
export type DisbandRequestListResponse = StandardResponse<PagedResponse<CommunityDisbandRequestDto>>;
export type LeaderListResponse = StandardResponse<PagedResponse<CommunityMemberDto>>;
export type CommunitySingleResponse = StandardResponse<CommunityDetailsDto>;

export interface ProcessDisbandRequestRequest {
    approved: boolean;
    adminNotes?: string;
}
