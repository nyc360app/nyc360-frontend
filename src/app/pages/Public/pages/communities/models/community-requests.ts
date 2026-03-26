export interface CommunityRequestDto {
  userId: number;
  userName: string;
  userAvatar: string | null;
  requestedAt: string;
}

export interface RequestApiResponse<T> {
  isSuccess: boolean;
  data: T;
  error: any;
}
