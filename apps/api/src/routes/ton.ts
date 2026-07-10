import {
  tonProofNonceResponseSchema,
  verifyTonProofRequestSchema,
  verifyTonProofResponseSchema,
} from "@shore/shared";
import type { Hono } from "hono";

import { buildAuditStatement } from "../lib/audit";
import { getAuthenticatedUser } from "../lib/auth";
import { createOpaqueToken, sha256Hex } from "../lib/crypto";
import { ApiHttpError, nowIso } from "../lib/http";
import { parseTonNetwork, verifyTonProofCryptographically } from "../lib/ton-proof";
import type { Bindings, Variables } from "../types";

const NONCE_TTL_MS = 10 * 60 * 1000;

type NonceRow = {
  id: string;
};

export function registerTonRoutes(app: Hono<{ Bindings: Bindings; Variables: Variables }>): void {
  app.post("/api/v1/ton-proof/nonce", async (context) => {
    const user = getAuthenticatedUser(context);
    const nonce = createOpaqueToken(32);
    const nonceHash = await sha256Hex(nonce);
    const now = nowIso();
    const expiresAt = new Date(Date.now() + NONCE_TTL_MS).toISOString();
    const nonceId = `tnp_${crypto.randomUUID()}`;

    await context.env.DB.batch([
      context.env.DB.prepare(
        `INSERT INTO ton_proof_nonces (
           id, user_id, nonce_hash, expires_at, consumed_at, created_at
         ) VALUES (?1, ?2, ?3, ?4, NULL, ?5)`,
      ).bind(nonceId, user.id, nonceHash, expiresAt, now),
      buildAuditStatement(context.env.DB, {
        userId: user.id,
        actorType: "user",
        actorId: user.id,
        eventType: "wallet.ton_proof.nonce_issued",
        referenceType: "ton_proof_nonce",
        referenceId: nonceId,
        detail: { expiresAt, network: context.env.TON_NETWORK },
        requestId: context.get("requestId"),
        createdAt: now,
      }),
    ]);

    context.executionCtx.waitUntil(
      context.env.DB.prepare("DELETE FROM ton_proof_nonces WHERE user_id = ?1 AND expires_at < ?2")
        .bind(user.id, now)
        .run()
        .then(() => undefined),
    );

    return context.json(
      tonProofNonceResponseSchema.parse({
        nonce,
        expiresAt,
        network: context.env.TON_NETWORK,
      }),
      201,
      { "cache-control": "no-store" },
    );
  });

  app.post("/api/v1/ton-proof/verify", async (context) => {
    const user = getAuthenticatedUser(context);
    const parsed = verifyTonProofRequestSchema.safeParse(
      await context.req.json().catch(() => null),
    );
    if (!parsed.success) {
      throw new ApiHttpError(
        422,
        "INVALID_TON_PROOF",
        "TON proof request is invalid.",
        parsed.error.flatten(),
      );
    }

    const network = parseTonNetwork(parsed.data.network, context.env.TON_NETWORK);
    const nonceHash = await sha256Hex(parsed.data.proof.payload);
    const now = nowIso();

    const nonce = await context.env.DB.prepare(
      `SELECT id FROM ton_proof_nonces
        WHERE user_id = ?1 AND nonce_hash = ?2
          AND consumed_at IS NULL AND expires_at > ?3
        LIMIT 1`,
    )
      .bind(user.id, nonceHash, now)
      .first<NonceRow>();
    if (!nonce) {
      throw new ApiHttpError(
        422,
        "TON_PROOF_NONCE_INVALID",
        "TON proof nonce is missing, expired, or already consumed.",
      );
    }

    const verified = verifyTonProofCryptographically(parsed.data, context.env.TON_APP_DOMAIN);

    const existingOwner = await context.env.DB.prepare(
      `SELECT user_id FROM wallets
        WHERE address_raw = ?1 AND network = ?2 LIMIT 1`,
    )
      .bind(verified.addressRaw, network)
      .first<{ user_id: string }>();
    if (existingOwner && existingOwner.user_id !== user.id) {
      throw new ApiHttpError(
        409,
        "TON_WALLET_ALREADY_BOUND",
        "This TON wallet is already bound to another SHORE account.",
      );
    }

    const consumed = await context.env.DB.prepare(
      `UPDATE ton_proof_nonces
          SET consumed_at = ?1
        WHERE id = ?2 AND consumed_at IS NULL
        RETURNING id`,
    )
      .bind(now, nonce.id)
      .first<NonceRow>();
    if (!consumed) {
      throw new ApiHttpError(
        409,
        "TON_PROOF_REPLAYED",
        "TON proof nonce was already consumed by another request.",
      );
    }

    const walletId = `wal_${crypto.randomUUID()}`;
    await context.env.DB.batch([
      context.env.DB.prepare(
        `INSERT INTO wallets (
           id, user_id, address_raw, address_friendly, network,
           proof_verified_at, wallet_app, created_at, updated_at
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?6, ?6)
         ON CONFLICT(user_id, network) DO UPDATE SET
           address_raw = excluded.address_raw,
           address_friendly = excluded.address_friendly,
           proof_verified_at = excluded.proof_verified_at,
           wallet_app = excluded.wallet_app,
           updated_at = excluded.updated_at`,
      ).bind(
        walletId,
        user.id,
        verified.addressRaw,
        verified.addressFriendly,
        network,
        now,
        parsed.data.walletApp?.trim() || null,
      ),
      buildAuditStatement(context.env.DB, {
        userId: user.id,
        actorType: "user",
        actorId: user.id,
        eventType: "wallet.ton_proof.verified",
        referenceType: "wallet",
        referenceId: verified.addressRaw,
        detail: {
          network,
          walletApp: parsed.data.walletApp?.trim() || null,
        },
        requestId: context.get("requestId"),
        createdAt: now,
      }),
    ]);

    return context.json(
      verifyTonProofResponseSchema.parse({
        wallet: {
          addressRaw: verified.addressRaw,
          addressFriendly: verified.addressFriendly,
          network,
          walletApp: parsed.data.walletApp?.trim() || null,
          proofVerifiedAt: now,
        },
      }),
      200,
      { "cache-control": "no-store" },
    );
  });
}
