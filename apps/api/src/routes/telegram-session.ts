import { sessionBootstrapResponseSchema, telegramSessionRequestSchema } from "@shore/shared";
import type { Hono } from "hono";

import { buildAuditStatement } from "../lib/audit";
import { createOpaqueToken, sha256Hex } from "../lib/crypto";
import { ApiHttpError, nowIso } from "../lib/http";
import { validateTelegramInitData } from "../lib/telegram-auth";
import type { Bindings, Variables } from "../types";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function registerTelegramSessionRoute(
  app: Hono<{ Bindings: Bindings; Variables: Variables }>,
): void {
  app.post("/api/v1/session/telegram", async (context) => {
    const body = telegramSessionRequestSchema.safeParse(await context.req.json().catch(() => null));
    if (!body.success) {
      throw new ApiHttpError(
        422,
        "INVALID_TELEGRAM_SESSION_INPUT",
        "Telegram session input is invalid.",
        body.error.flatten(),
      );
    }

    const configuredCredential = context.env.TELEGRAM_BOT_TOKEN?.trim();
    if (!configuredCredential) {
      throw new ApiHttpError(
        503,
        "TELEGRAM_AUTH_NOT_CONFIGURED",
        "Telegram authentication is not configured for this environment.",
      );
    }

    const validated = await validateTelegramInitData(body.data.initData, configuredCredential);
    const userId = `tg_${validated.user.id}`;
    const displayName = [validated.user.first_name, validated.user.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();
    const now = nowIso();
    const token = createOpaqueToken(32);
    const tokenHash = await sha256Hex(token);
    const sessionId = `ses_${crypto.randomUUID()}`;
    const debtId = `debt_${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

    await context.env.DB.batch([
      context.env.DB.prepare(
        `INSERT INTO users (id, display_name, status, created_at, updated_at)
           VALUES (?1, ?2, 'active', ?3, ?3)
           ON CONFLICT(id) DO UPDATE SET
             display_name = excluded.display_name,
             updated_at = excluded.updated_at`,
      ).bind(userId, displayName, now),
      context.env.DB.prepare(
        `INSERT INTO sessions (
             id, user_id, token_hash, expires_at, revoked_at, created_at, last_seen_at
           ) VALUES (?1, ?2, ?3, ?4, NULL, ?5, ?5)`,
      ).bind(sessionId, userId, tokenHash, expiresAt, now),
      context.env.DB.prepare(
        `INSERT OR IGNORE INTO debt_summaries (
             id, user_id, currency, confirmed_amount_minor, covered_amount_minor,
             status, confirmed_at, created_at, updated_at
           ) VALUES (?1, ?2, 'CNY', 0, 0, 'confirmed', ?3, ?3, ?3)`,
      ).bind(debtId, userId, now),
      buildAuditStatement(context.env.DB, {
        userId,
        actorType: "telegram_user",
        actorId: String(validated.user.id),
        eventType: "session.telegram.created",
        referenceType: "session",
        referenceId: sessionId,
        detail: {
          authDate: validated.authDate.toISOString(),
          queryId: validated.queryId,
          startParam: validated.startParam,
          username: validated.user.username ?? null,
        },
        requestId: context.get("requestId"),
        createdAt: now,
      }),
    ]);

    return context.json(
      sessionBootstrapResponseSchema.parse({
        token,
        expiresAt,
        user: { id: userId, displayName },
      }),
      201,
      { "cache-control": "no-store" },
    );
  });
}
