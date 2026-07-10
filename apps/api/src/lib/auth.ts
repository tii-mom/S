import type { MiddlewareHandler } from "hono";

import { sha256Hex } from "./crypto";
import { ApiHttpError, nowIso } from "./http";
import type { Bindings, Variables } from "../types";

type SessionRow = {
  session_id: string;
  user_id: string;
  display_name: string;
};

export const requireSession: MiddlewareHandler<{
  Bindings: Bindings;
  Variables: Variables;
}> = async (context, next) => {
  const header = context.req.header("authorization")?.trim();
  if (!header?.startsWith("Bearer ")) {
    throw new ApiHttpError(401, "AUTH_REQUIRED", "A valid SHORE session is required.");
  }

  const token = header.slice("Bearer ".length).trim();
  if (token.length < 32) {
    throw new ApiHttpError(401, "INVALID_SESSION", "The SHORE session token is invalid.");
  }

  const tokenHash = await sha256Hex(token);
  const now = nowIso();
  const row = await context.env.DB.prepare(
    `SELECT s.id AS session_id, u.id AS user_id, u.display_name
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ?1
        AND s.revoked_at IS NULL
        AND s.expires_at > ?2
        AND u.status = 'active'
      LIMIT 1`,
  )
    .bind(tokenHash, now)
    .first<SessionRow>();

  if (!row) {
    throw new ApiHttpError(401, "SESSION_EXPIRED", "The SHORE session is missing or expired.");
  }

  context.set("user", {
    id: row.user_id,
    displayName: row.display_name,
    sessionId: row.session_id,
  });

  context.executionCtx.waitUntil(
    context.env.DB.prepare("UPDATE sessions SET last_seen_at = ?1 WHERE id = ?2")
      .bind(now, row.session_id)
      .run()
      .then(() => undefined),
  );

  await next();
};

export function getAuthenticatedUser(context: { get(key: "user"): Variables["user"] }) {
  const user = context.get("user");
  if (!user) {
    throw new ApiHttpError(401, "AUTH_REQUIRED", "A valid SHORE session is required.");
  }
  return user;
}
