import type { Context } from "hono";

import type { Bindings, Variables } from "../types";

export class ApiHttpError extends Error {
  readonly status: 400 | 401 | 403 | 404 | 409 | 413 | 415 | 422 | 500 | 503;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: ApiHttpError["status"], code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiHttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function errorResponse(
  context: Context<{ Bindings: Bindings; Variables: Variables }>,
  error: ApiHttpError,
) {
  return context.json(
    {
      error: {
        code: error.code,
        message: error.message,
        requestId: context.get("requestId"),
        ...(error.details === undefined ? {} : { details: error.details }),
      },
    },
    error.status,
  );
}

export function requireIdempotencyKey(
  context: Context<{ Bindings: Bindings; Variables: Variables }>,
): string {
  const value = context.req.header("x-idempotency-key")?.trim();
  if (!value || value.length < 8 || value.length > 160) {
    throw new ApiHttpError(
      422,
      "INVALID_IDEMPOTENCY_KEY",
      "X-Idempotency-Key must contain between 8 and 160 characters.",
    );
  }
  return value;
}

export function nowIso(): string {
  return new Date().toISOString();
}
