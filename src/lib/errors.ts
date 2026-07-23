/**
 * Domain error hierarchy for Boosta.
 *
 * All expected, "operational" errors extend {@link AppError} and carry a stable
 * machine-readable `code`, an HTTP `status`, and an `isOperational` flag that
 * distinguishes them from unexpected programmer errors. API layers should map
 * these onto HTTP responses; anything that is not an `AppError` is a bug and
 * should surface as a 500.
 */

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export interface AppErrorOptions {
  /** Machine-readable error code, stable across releases. */
  code?: ErrorCode;
  /** HTTP status code to respond with. */
  status?: number;
  /** Additional structured detail safe to expose to clients. */
  details?: Record<string, unknown>;
  /** The underlying error, preserved for logging. */
  cause?: unknown;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;
  readonly isOperational = true;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.code = options.code ?? "INTERNAL_ERROR";
    this.status = options.status ?? 500;
    this.details = options.details;
    Error.captureStackTrace?.(this, new.target);
  }

  /** Serialize into a client-safe response body. */
  toJSON(): {
    error: {
      code: ErrorCode;
      message: string;
      details?: Record<string, unknown>;
    };
  } {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details ? { details: this.details } : {}),
      },
    };
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "The provided input is invalid.",
    options: Omit<AppErrorOptions, "code" | "status"> = {},
  ) {
    super(message, { ...options, code: "VALIDATION_ERROR", status: 422 });
  }
}

export class UnauthorizedError extends AppError {
  constructor(
    message = "Authentication is required.",
    options: Omit<AppErrorOptions, "code" | "status"> = {},
  ) {
    super(message, { ...options, code: "UNAUTHORIZED", status: 401 });
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message = "You do not have permission to perform this action.",
    options: Omit<AppErrorOptions, "code" | "status"> = {},
  ) {
    super(message, { ...options, code: "FORBIDDEN", status: 403 });
  }
}

export class NotFoundError extends AppError {
  constructor(
    message = "The requested resource was not found.",
    options: Omit<AppErrorOptions, "code" | "status"> = {},
  ) {
    super(message, { ...options, code: "NOT_FOUND", status: 404 });
  }
}

export class ConflictError extends AppError {
  constructor(
    message = "The request conflicts with the current state.",
    options: Omit<AppErrorOptions, "code" | "status"> = {},
  ) {
    super(message, { ...options, code: "CONFLICT", status: 409 });
  }
}

export class RateLimitError extends AppError {
  constructor(
    message = "Too many requests. Please try again later.",
    options: Omit<AppErrorOptions, "code" | "status"> = {},
  ) {
    super(message, { ...options, code: "RATE_LIMITED", status: 429 });
  }
}

/** Type guard: is this value one of our operational errors? */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Normalize any thrown value into an {@link AppError}. Unknown errors become a
 * generic 500 so that internal details are never leaked to clients.
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error;
  return new AppError("An unexpected error occurred.", {
    code: "INTERNAL_ERROR",
    status: 500,
    cause: error,
  });
}
