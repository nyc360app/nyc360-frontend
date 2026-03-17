// tags.model.ts
export enum TagType {
  Identity = 1,
  Professional = 2,
  Interest = 3,
  Location = 4
}

export interface TagModel {
  id: number;
  name: string;
  type: TagType;
  division: number;
  parent: string | null;
  parentTagId?: number;
  children: string[] | null;
}

// للـ POST والـ PUT
export interface TagRequest {
  Name: string;
  Type: number;
  Division: number;
  ParentTagId: number;
}

export interface TagsResponse {
  isSuccess: boolean; // الحروف صغيرة بناءً على صورة الـ Response Body
  data: TagModel[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  error: any;
}