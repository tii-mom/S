import { sessionBootstrapRequestSchema, sessionBootstrapResponseSchema } from "@shore/shared";
import type { Hono } from "hono";

import { buildAuditStatement } from "../lib/audit";
import { createOpaqueToken, sha256Hex } from "../lib/crypto";
import { ApiHttpError, nowIso } from "../lib/http";
import type { Bindings, Variables } from "../types";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function registerSessionRoutes(
  app: Hono<{ Bindings: Bindings; Variables: Variables }>,
): void {
  app.post("/api/v1/session/bootstrap", async (context) => {
    if (context.env.APP_ENV === "production") {
      throw new ApiHttpError(
        403,
        "BOOTSTRAP_DISABLED",
        "Staging bootstrap sessions are disabled in production.",
      );
    }

    const rawBody = await context.req.json().catch(() => ({}));
    const body = sessionBootstrapRequestSchema.safeParse(rawBody);
    if (!body.success) {
      throw new ApiHttpError(
        422,
        "INVALID_SESSION_INPUT",
        "The session input is invalid.",
        body.error.flatten(),
      );
    }

    const now = nowIso();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    const userId = `usr_${crypto.randomUUID()}`;
    const sessionId = `ses_${crypto.randomUUID()}`;
    const debtId = `debt_${crypto.randomUUID()}`;
    const token = createOpaqueToken(32);
    const tokenHash = await sha256Hex(token);

    await context.env.DB.batch([
      context.env.DB.prepare(
        "INSERT INTO users (id, display_name, status, created_at, updated_at) VALUES (?1, ?2, 'active', ?3, ?3)",
      ).bind(userId, body.data.displayName, now),
      context.env.DB.prepare(
        `INSERT INTO sessions (
           id, user_id, token_hash, expires_at, revoked_at, created_at, last_seen_at
         ) VALUES (?1, ?2, ?3, ?4, NULL, ?5, ?5)`,
      ).bind(sessionId, userId, tokenHash, expiresAt, now),
      context.env.DB.prepare(
        `INSERT INTO debt_summaries (
           id, user_id, currency, confirmed_amount_minor, covered_amount_minor,
           status, confirmed_at, created_at, updated_at
         ) VALUES (?1, ?2, 'CNY', 18642000, 1268000, 'confirmed', ?3, ?3, ?3)`,
      ).bind(debtId, userId, now),
      context.env.DB.prepare(
        `INSERT INTO shore_entitlements (
           id, user_id, source_type, source_id, round_number, amount, status,
           idempotency_key, unlocks_at, claimed_at, created_at, updated_at
         ) VALUES (?1, ?2, 'genesis_demo', ?2, 0, 2700000, 'locked', ?3, NULL, NULL, ?4, ?4)`,
      ).bind(`ent_${crypto.randomUUID()}`, userId, `bootstrap:locked:${userId}`, now),
      context.env.DB.prepare(
        `INSERT INTO shore_entitlements (
           id, user_id, source_type, source_id, round_number, amount, status,
           idempotency_key, unlocks_at, claimed_at, created_at, updated_at
         ) VALUES (?1, ?2, 'round_demo', 'round-4', 4, 150000, 'claimable', ?3, ?4, NULL, ?4, ?4)`,
      ).bind(`ent_${crypto.randomUUID()}`, userId, `bootstrap:claimable:${userId}`, now),
      context.env.DB.prepare(
        `INSERT INTO shore_entitlements (
           id, user_id, source_type, source_id, round_number, amount, status,
           idempotency_key, unlocks_at, claimed_at, created_at, updated_at
         ) VALUES (?1, ?2, 'genesis_demo', ?2, 0, 100000, 'claimed', ?3, ?4, ?4, ?4, ?4)`,
      ).bind(`ent_${crypto.randomUUID()}`, userId, `bootstrap:claimed:${userId}`, now),
      buildAuditStatement(context.env.DB, {
        userId,
        actorType: "system",
        actorId: "staging-bootstrap",
        eventType: "session.bootstrap.created",
        referenceType: "session",
        referenceId: sessionId,
        detail: { environment: context.env.APP_ENV },
        requestId: context.get("requestId"),
        createdAt: now,
      }),
    ]);

    const response = sessionBootstrapResponseSchema.parse({
      token,
      expiresAt,
      user: {
        id: userId,
        displayName: body.data.displayName,
      },
    });

    return context.json(response, 201, { "cache-control": "no-store" });
  });
}
