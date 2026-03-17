export enum ApplicationStatus {
  Pending = 0,
  Reviewed = 1,
  Interviewing = 2,
  Rejected = 3,
  Accepted = 4,
  Withdrawn = 5
}

export interface Location {
  id: number;
  borough: string;
  code: string;
  neighborhoodNet: string;
  neighborhood: string;
  zipCode: number;
}

export interface Address {
  id: number;
  street: string;
  buildingNumber: string;
  zipCode: string;
  location: Location;
  managedByUser: any | null;
}

export interface Author {
  id: number;
  username: string;
  fullName: string;
  imageUrl: string;
  type: number;
}

export interface JobProfile {
  id: number;
  title: string;
  description: string;
  requirements: string;
  benefits: string;
  responsibilities: string;
  salaryMin: number;
  salaryMax: number;
  workArrangement: number;
  employmentType: number;
  employmentLevel: number;
  address?: Address | null;
  author: Author;
  createdAt: string;
  isApplied: boolean;
  applicationsCount: number;
}

export interface RelatedJob {
  id: number;
  title: string;
  salaryMin: number;
  salaryMax: number;
  workArrangement: number;
  employmentType: number;
  employmentLevel: number;
  companyName: string;
}

export interface ApplicantExperience {
  title: string;
  company: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description?: string;
}

export interface ApplicantEducation {
  school: string;
  degree: string;
  fieldOfStudy?: string;
  startDate: string;
  endDate: string | null;
  isCurrent?: boolean;
}

export interface Applicant {
  applicationId: number;
  status: ApplicationStatus;
  appliedAt: string;
  coverLetter: string;
  resumeUrl: string | null;
  applicantId: number;
  applicantUsername: string;
  applicantFullName: string;
  applicantAvatarUrl: string;
  applicantBio: string;
  applicantEducations: ApplicantEducation[];
  applicantExperiences: ApplicantExperience[];
}

export interface JobProfileResponse {
  offer: JobProfile;
  relatedJobs: RelatedJob[];
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
  error: any;
}