export enum WorkArrangement { OnSite = 0, Remote = 1, Hybrid = 2 }
export enum EmploymentType { FullTime = 0, PartTime = 1, Contract = 2, Internship = 3, Freelance = 4 }
export enum EmploymentLevel { Junior = 1, Mid = 2, SeniorMid = 3, Senior = 4 }

export interface AddressInputDto {
  AddressId: number;
  LocationId: number;
  Street?: string;
  BuildingNumber?: string;
  ZipCode?: string;
}

export interface CreateOfferRequest {
  Title: string;
  Description: string;
  Requirements?: string;
  Benefits?: string;
  Responsibilities?: string;
  SalaryMin?: number;
  SalaryMax?: number;
  WorkArrangement: number;
  EmploymentType: number;
  EmploymentLevel: number;
  Address?: AddressInputDto;
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
  error: { code: string; message: string } | null;
}