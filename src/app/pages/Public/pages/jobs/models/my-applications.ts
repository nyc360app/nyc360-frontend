export enum ApplicationStatus {
  Pending = 0,
  Reviewed = 1,
  Interviewing = 2,
  Rejected = 3,
  Accepted = 4,
  Withdrawn = 5
}

export interface MyApplication {
  applicationId: number;
  offer: {
    id: number;
    title: string;
    salaryMin: number;
    salaryMax: number;
    workArrangement: number;
    employmentType: number;
    employmentLevel: number;
    companyName: string;
  };
  status: ApplicationStatus;
  appliedAt: string;
}

export interface MyApplicationsResponse {
  isSuccess: boolean;
  data: MyApplication[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  error: any;
}