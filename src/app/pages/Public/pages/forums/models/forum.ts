export interface Forum {
    id: number;
    title: string;
    description: string;
    slug: string;
    iconUrl: string;
    questionsCount: number;
    isActive: boolean;
}

export interface ApiResponse<T> {
    isSuccess: boolean;
    data: T;
    error: any | null;
}

export interface PagedResponse<T> {
    isSuccess: boolean;
    data: T[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    error: any | null;
}

export interface Question {
    id: number;
    forumId: number;
    title: string;
    content: string;
    slug: string;
    isLocked: boolean;
    isPinned: boolean;
    createdAt: string;
    author: {
        id: number;
        username: string;
        fullName: string;
        imageUrl: string;
        type: number;
    };
    answersCount: number;
}

export interface ForumDetailsData {
    forum: Forum;
    questions: PagedResponse<Question>;
}

export interface Answer {
    id: number;
    questionId: number;
    content: string;
    isCorrectAnswer: boolean;
    createdAt: string;
    author: {
        id: number;
        username: string;
        fullName: string;
        imageUrl: string;
        type: number;
    };
}

export interface QuestionDetailsData {
    question: Question;
    answers: Answer[];
}
