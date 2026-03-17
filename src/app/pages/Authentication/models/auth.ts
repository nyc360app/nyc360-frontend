// Request model for Registration
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  isOrganization: boolean;
}

// Request model for Login
export interface LoginRequest {
  email: string;
  password: string;
}



// Request model for Forgot Password
export interface ForgotPasswordRequest {
  email: string;
}

// Generic API Response Wrapper
export interface AuthResponse<T = any> {
  isSuccess: boolean;
  data: T;
  error?: {
    code?: string;
    message?: string;
  } | null;
}

export interface ConfirmEmailRequest {
  email: string;
  token: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}
export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  token: string;
}

// Update LoginResponseData if not already updated
export interface LoginResponseData {
  accessToken: string;
  refreshToken: string; // Ensure this exists
  twoFactorRequired: boolean;
}
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// --- Existing interfaces... ---

// 1. Normal User Registration Payload
// 1. Normal User Registration Payload
export interface RegisterNormalUserRequest {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  userType: 'Visitor' | 'NewYorker'; // To distinguish between the first two options
  interests: number[];
}

// 2. Organization Registration Payload
export interface RegisterOrganizationRequest {
  Name: string;
  username: string;
  email: string;
  password: string;
  profitModel: number;
  organizationType: number;
  industry: number;
  interests: number[];
}