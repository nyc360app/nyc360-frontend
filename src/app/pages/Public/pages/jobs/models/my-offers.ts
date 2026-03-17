export interface MyOffer {
  id: number;
  title: string;
  salaryMin: number;
  salaryMax: number;
  isActive: boolean;
  createdAt: string;
  applicationCount: number;
}

export interface MyOffersResponse {
  isSuccess: boolean;
  data: MyOffer[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  error: any;
}