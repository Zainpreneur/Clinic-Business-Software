export class AppError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const notFound = (entity = "Resource") => new AppError(`${entity} not found`, 404);
export const unauthorized = (message = "Unauthorized") => new AppError(message, 401);
export const forbidden = (message = "Forbidden") => new AppError(message, 403);
export const badRequest = (message = "Bad request", details?: unknown) =>
  new AppError(message, 400, details);
