export interface ModeratorDto {
    id: number;
    username: string;
    fullName: string;
    imageUrl: string;
    type: number;
}

export interface ForumDashboardDto {
    id: number;
    title: string;
    description: string;
    slug: string;
    iconUrl: string;
    questionsCount: number;
    isActive: boolean;
    moderators: ModeratorDto[];
}

export interface StandardResponse<T> {
    isSuccess: boolean;
    data: T;
    error?: {
        code: string;
        message: string;
    };
}

export interface ForumListResponse extends StandardResponse<ForumDashboardDto[]> { }

export interface UpdateModeratorsRequest {
    forumId: number;
    moderatorIds: number[];
}

export interface UpdateForumRequest {
    id: number;
    title: string;
    slug: string;
    description: string;
    iconFile?: File;
    isActive: boolean;
}

export interface CreateForumRequest {
    title: string;
    slug: string;
    description: string;
    iconFile?: File;
}

export interface CreateForumResponse extends StandardResponse<number> { }

