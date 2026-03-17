export interface TopicModel {
    id: number;
    name: string;
    description: string | null;
    category: number;
}

export interface TopicRequest {
    Name: string;
    Description: string;
    Category: number;
}

export interface TopicsResponse {
    isSuccess: boolean;
    data: TopicModel[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    error: any;
}
