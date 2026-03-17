export interface CreatePostRequest {
  communityId: number;
  content: string;
  location?: string;
  attachments?: File[];
}

export interface CreatePostResponse {
  isSuccess: boolean;
  message?: string;
  data?: any; // يمكن تحديد نوع المنشور الراجع هنا
}