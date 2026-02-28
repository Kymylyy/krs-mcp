export class KrsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KrsValidationError";
  }
}

export class KrsNetworkError extends Error {
  public override readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "KrsNetworkError";
    this.cause = cause;
  }
}

export class KrsApiError extends Error {
  public readonly statusCode: number;
  public readonly details: unknown;
  public readonly url: string;

  constructor(message: string, statusCode: number, url: string, details?: unknown) {
    super(message);
    this.name = "KrsApiError";
    this.statusCode = statusCode;
    this.url = url;
    this.details = details;
  }
}

export class KrsAuthError extends KrsApiError {
  constructor(message: string, statusCode: number, url: string, details?: unknown) {
    super(message, statusCode, url, details);
    this.name = "KrsAuthError";
  }
}

export function formatErrorMessage(error: unknown): string {
  if (error instanceof KrsValidationError) {
    return `Invalid input: ${error.message}`;
  }

  if (error instanceof KrsAuthError) {
    return `Authentication failed (${error.statusCode}): ${error.message}`;
  }

  if (error instanceof KrsApiError) {
    return `Upstream API error (${error.statusCode}): ${error.message}`;
  }

  if (error instanceof KrsNetworkError) {
    return `Network error: ${error.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}
