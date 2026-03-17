export enum WorkArrangement { OnSite = 0, Remote = 1, Hybrid = 2 }
export enum EmploymentType { FullTime = 0, PartTime = 1, Contract = 2, Internship = 3, Freelance = 4 }
export enum EmploymentLevel { Junior = 1, Mid = 2, SeniorMid = 3, Senior = 4 }

export interface LocationSearchResult {
  id: number;
  borough: string;
  neighborhood: string;
  code: string;
}

export interface JobOfferSummary {
  id: number;
  title: string;
  salaryMin: number;
  salaryMax: number;
  workArrangement: WorkArrangement;
  employmentType: EmploymentType;
  employmentLevel: EmploymentLevel;
  companyName: string;
  location?: string;
  authorAvatarUrl?: string; // Updated from imageUrl
  description?: string;
}

export interface JobSearchFilters {
  Search?: string;
  LocationId?: number | null;
  Arrangement?: number | null;
  Type?: number | null;
  Level?: number | null;
  MinSalary?: number | null;
  IsActive: boolean;
  Page: number;
  PageSize: number;
}

export interface JobSearchResponse {
  isSuccess: boolean;
  data: JobOfferSummary[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  error: any;
}