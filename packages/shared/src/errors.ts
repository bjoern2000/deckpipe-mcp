export type ErrorCode = 'validation_error' | 'not_found' | 'rate_limited' | 'server_error';

const STATUS_MAP: Record<ErrorCode, number> = {
  validation_error: 400,
  not_found: 404,
  rate_limited: 429,
  server_error: 500,
};

export class ApiError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly field?: string;

  constructor(code: ErrorCode, message: string, field?: string) {
    super(message);
    this.code = code;
    this.statusCode = STATUS_MAP[code];
    this.field = field;
  }
}

export function errorResponse(error: ApiError) {
  return {
    error: {
      code: error.code,
      message: error.message,
      ...(error.field && { field: error.field }),
    },
  };
}
