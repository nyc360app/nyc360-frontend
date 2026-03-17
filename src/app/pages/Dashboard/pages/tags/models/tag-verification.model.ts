export interface TagVerificationItem {
    requestId: number;
    reason: string;
    submittedAt: string;
    tag: {
        id: number;
        name: string;
    };
    requester: {
        id: number;
        username: string;
        fullName: string;
        imageUrl: string;
        type: number;
    };
    documents: {
        id: number;
        type: number;
        fileUrl: string;
    }[];
}

export interface TagVerificationResponse {
    isSuccess: boolean;
    data: TagVerificationItem[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    error: any;
}

export interface ResolveTagVerification {
    RequestId: number;
    Approved: boolean;
    AdminComment: string;
}
