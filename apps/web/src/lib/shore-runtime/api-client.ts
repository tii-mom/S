import {
  apiErrorSchema,
  claimIntentResponseSchema,
  claimSubmissionResponseSchema,
  dashboardResponseSchema,
  sessionBootstrapResponseSchema,
  startMissionResponseSchema,
  submitProofResponseSchema,
  tonProofNonceResponseSchema,
  verifyTonProofResponseSchema,
  type ClaimIntentResponse,
  type ClaimSubmissionResponse,
  type DashboardResponse,
  type SessionBootstrapResponse,
  type StartMissionResponse,
  type SubmitProofResponse,
  type TonProofNonceResponse,
  type VerifyTonProofRequest,
  type VerifyTonProofResponse,
} from "@shore/shared";
import type { z } from "zod";

const SESSION_STORAGE_KEY = "shore.runtime.session.v1";
const apiBaseUrl = (process.env.NEXT_PUBLIC_SHORE_API_BASE_URL || "http://localhost:8787").replace(
  /\/$/,
  "",
);

export class ShoreApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId: string | undefined;
  readonly details: unknown;

  constructor(input: {
    code: string;
    message: string;
    status: number;
    requestId?: string;
    details?: unknown;
  }) {
    super(input.message);
    this.name = "ShoreApiError";
    this.code = input.code;
    this.status = input.status;
    this.requestId = input.requestId;
    this.details = input.details;
  }
}

type StoredSession = SessionBootstrapResponse;

function getStoredSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = sessionBootstrapResponseSchema.parse(JSON.parse(raw));
    if (Date.parse(parsed.expiresAt) <= Date.now()) {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

function storeSession(session: StoredSession): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function createIdempotencyKey(scope: string): string {
  return `${scope}:${crypto.randomUUID()}`;
}

async function parseApiError(response: Response): Promise<never> {
  const fallback = {
    code: `HTTP_${response.status}`,
    message: `SHORE API request failed with status ${response.status}.`,
    requestId: response.headers.get("x-request-id") ?? undefined,
  };
  try {
    const parsed = apiErrorSchema.parse(await response.json());
    throw new ShoreApiError({
      code: parsed.error.code,
      message: parsed.error.message,
      status: response.status,
      requestId: parsed.error.requestId,
      details: parsed.error.details,
    });
  } catch (error) {
    if (error instanceof ShoreApiError) throw error;
    throw new ShoreApiError({
      code: fallback.code,
      message: fallback.message,
      status: response.status,
      ...(fallback.requestId ? { requestId: fallback.requestId } : {}),
    });
  }
}

async function parseResponse<TSchema extends z.ZodTypeAny>(
  response: Response,
  schema: TSchema,
): Promise<z.infer<TSchema>> {
  if (!response.ok) return parseApiError(response);
  return schema.parse(await response.json());
}

async function bootstrapSession(): Promise<StoredSession> {
  const telegramWebApp = typeof window === "undefined" ? undefined : window.Telegram?.WebApp;
  const telegramInitData = telegramWebApp?.initData.trim();
  const response = telegramInitData
    ? await fetch(`${apiBaseUrl}/api/v1/session/telegram`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initData: telegramInitData }),
      })
    : await fetch(`${apiBaseUrl}/api/v1/session/bootstrap`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName: "SHORE Staging User" }),
      });
  const session = await parseResponse(response, sessionBootstrapResponseSchema);
  telegramWebApp?.ready?.();
  telegramWebApp?.expand?.();
  storeSession(session);
  return session;
}

export async function ensureShoreSession(): Promise<StoredSession> {
  return getStoredSession() ?? bootstrapSession();
}

async function authenticatedFetch(
  path: string,
  init: RequestInit = {},
  retryOnUnauthorized = true,
): Promise<Response> {
  const session = await ensureShoreSession();
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${session.token}`);
  headers.set("x-request-id", crypto.randomUUID());

  const response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers });
  if (response.status === 401 && retryOnUnauthorized && typeof window !== "undefined") {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return authenticatedFetch(path, init, false);
  }
  return response;
}

export async function fetchDashboard(): Promise<DashboardResponse> {
  return parseResponse(
    await authenticatedFetch("/api/v1/dashboard", { cache: "no-store" }),
    dashboardResponseSchema,
  );
}

export async function startMission(missionId: string): Promise<StartMissionResponse> {
  return parseResponse(
    await authenticatedFetch(`/api/v1/missions/${encodeURIComponent(missionId)}/start`, {
      method: "POST",
      headers: { "x-idempotency-key": createIdempotencyKey("mission-start") },
    }),
    startMissionResponseSchema,
  );
}

export async function submitProof(input: {
  executionId: string;
  note: string;
  evidenceUrl?: string;
  file?: File | null;
}): Promise<SubmitProofResponse> {
  const form = new FormData();
  form.set("note", input.note);
  if (input.evidenceUrl?.trim()) form.set("evidenceUrl", input.evidenceUrl.trim());
  if (input.file) form.set("file", input.file);

  return parseResponse(
    await authenticatedFetch(`/api/v1/executions/${encodeURIComponent(input.executionId)}/proofs`, {
      method: "POST",
      headers: { "x-idempotency-key": createIdempotencyKey("proof-submit") },
      body: form,
    }),
    submitProofResponseSchema,
  );
}

export async function requestTonProofNonce(): Promise<TonProofNonceResponse> {
  return parseResponse(
    await authenticatedFetch("/api/v1/ton-proof/nonce", { method: "POST" }),
    tonProofNonceResponseSchema,
  );
}

export async function verifyTonProof(
  input: VerifyTonProofRequest,
): Promise<VerifyTonProofResponse> {
  return parseResponse(
    await authenticatedFetch("/api/v1/ton-proof/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }),
    verifyTonProofResponseSchema,
  );
}

export async function createClaimIntent(): Promise<ClaimIntentResponse> {
  return parseResponse(
    await authenticatedFetch("/api/v1/claims/intents", {
      method: "POST",
      headers: { "x-idempotency-key": createIdempotencyKey("claim-intent") },
    }),
    claimIntentResponseSchema,
  );
}

export async function recordClaimSubmission(
  claimId: string,
  boc: string,
): Promise<ClaimSubmissionResponse> {
  return parseResponse(
    await authenticatedFetch(`/api/v1/claims/${encodeURIComponent(claimId)}/submitted`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ boc }),
    }),
    claimSubmissionResponseSchema,
  );
}

export function clearShoreSession(): void {
  if (typeof window !== "undefined") window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
}
