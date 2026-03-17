// src/app/shared/models/api-response.model.ts

/**
 * Maps the C# ApiError record.
 * Represents a standardized error object for API failures.
 */
export interface ApiError {
  /** A specific code for the error type (e.g., 'POST_NOT_FOUND', 'VALIDATION_ERROR'). */
  code: string;
  /** A human-readable message explaining the error. */
  message: string;
}

/**
 * Maps the C# StandardResponse<T> record.
 * This is the generic wrapper for all successful or failed API calls that return data.
 */
export interface StandardResponse<T> {
  /** True if the operation succeeded, False otherwise. */
  isSuccess: boolean;
  /** The actual data returned by the API call, present only if isSuccess is true. */
  data?: T;
  /** The error details, present only if isSuccess is false. */
  error?: ApiError;
}

/**
 * Maps the non-generic C# StandardResponse record.
 * Used for API calls that do not return data (e.g., create, update, delete operations).
 */
export interface StandardResponseNoData {
  /** True if the operation succeeded, False otherwise. */
  isSuccess: boolean;
  /** The error details, present only if isSuccess is false. */
  error?: ApiError;
}