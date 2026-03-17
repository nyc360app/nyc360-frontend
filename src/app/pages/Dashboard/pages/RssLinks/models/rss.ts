// Main Entity - Backend returns ALL properties in camelCase
export interface RssSource {
  id: number;
  name: string;
  rssUrl: string;
  category: number;
  description: string;
  imageUrl: string | null;
  isActive: boolean;
  lastChecked: string;
}

// Create Request (Frontend uses camelCase, Service converts to PascalCase for Backend)
// Backend expects: Url, Category, Name, Description, ImageUrl, Image
export interface CreateRssRequest {
  url: string;
  category: number;
  name: string;
  description?: string;
  imageUrl?: string;
  image?: File;
}

// Response Wrapper for List (Backend returns ALL camelCase)
export interface RssResponse {
  isSuccess: boolean;
  data: RssSource[];
  error: { code: string; message: string } | null;
}

// Response Wrapper for Single Source (Test) (Backend returns ALL camelCase)
export interface RssSingleResponse {
  isSuccess: boolean;
  data: RssSource;
  error: { code: string; message: string } | null;
}

// Requester Info
export interface Requester {
  id: number;
  username: string;
  fullName: string;
  imageUrl: string;
  type: number;
}

// RSS Request Entity - Backend returns ALL properties in camelCase
export interface RssRequest {
  id: number;
  url: string;
  category: number;
  name: string;
  description: string;
  imageUrl: string;
  status: number; // 0 = Pending, 1 = Approved, 2 = Rejected etc.
  adminNote: string | null;
  requesterId: number;
  requester: Requester;
  createdAt: string;
  processedAt: string | null;
  _expanded?: boolean; // UI state for expandable details (mobile)
  _showDetails?: boolean; // UI state for expandable details (desktop)
}

// Paginated Response for Requests (Backend returns ALL camelCase)
export interface RssRequestResponse {
  isSuccess: boolean;
  data: RssRequest[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  error: { code: string; message: string } | null;
}

// Update Request Status (Frontend uses camelCase, Service converts to PascalCase)
// Backend expects: { Id, Status, AdminNote }
export interface RssRequestUpdate {
  id: number;
  status: number;
  adminNote: string;
}

