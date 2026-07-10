import { claimIntentResponseSchema } from "@shore/shared";
import type { Hono } from "hono";

import { buildAuditStatement } from "../lib/audit";
import { getAuthenticatedUser } from "../lib/auth";
import { nowIso, requireIdempotencyKey } from "../lib/http";
import type { Bindings, Variables } from "../types";

type WalletRow = {
  id: string;
};

type EntitlementRow = {
  id: string;
  amount: number;
};

type ClaimRow = {
  id: string;
  status: "blocked" | "prepared" | "submitted" | "confirmed" | "failed";
  failure_code: string | null;
  amount: number;
};

export function registerClaimRoutes(app: Hono<{ Bindings: Bindings; Variables: Variables }>): void {
  app.post("/api/v1/claims/intents", async (context) => {
    const user = getAuthenticatedUser(context);
    const idempotencyKey = requireIdempotencyKey(context);
    const network = context.env.TON_NETWORK;
    const contractAddress = context.env.SHORE_CLAIM_CONTRACT_ADDRESS?.trim() || null;

    const existing = await context.env.DB.prepare(
      `SELECT c.id, c.status, c.failure_code, e.amount
         FROM token_claims c
         JOIN shore_entitlements e ON e.id = c.entitlement_id
        WHERE c.idempotency_key = ?1 AND c.user_id = ?2 LIMIT 1`,
    )
      .bind(idempotencyKey, user.id)
      .first<ClaimRow>();
    if (existing) {
      return context.json(
        claimIntentResponseSchema.parse({
          status: existing.status === "prepared" ? "prepared" : "blocked",
          code: existing.failure_code ?? "CLAIM_INTENT_EXISTS",
          message:
            existing.status === "prepared"
              ? "The Testnet claim intent is already prepared."
              : "The existing claim intent is not ready for submission.",
          claimId: existing.id,
          network,
          contractAddress,
          amount: existing.amount,
        }),
        200,
        { "cache-control": "no-store" },
      );
    }

    const [wallet, entitlement] = await Promise.all([
      context.env.DB.prepare(
        `SELECT id FROM wallets
          WHERE user_id = ?1 AND network = ?2 LIMIT 1`,
      )
        .bind(user.id, network)
        .first<WalletRow>(),
      context.env.DB.prepare(
        `SELECT id, amount FROM shore_entitlements
          WHERE user_id = ?1 AND status = 'claimable'
          ORDER BY created_at ASC LIMIT 1`,
      )
        .bind(user.id)
        .first<EntitlementRow>(),
    ]);

    let blockCode: string | null = null;
    let blockMessage: string | null = null;
    if (!wallet) {
      blockCode = "WALLET_REQUIRED";
      blockMessage = "Verify a TON wallet before preparing a claim.";
    } else if (!entitlement) {
      blockCode = "ENTITLEMENT_REQUIRED";
      blockMessage = "No claimable SHORE entitlement is available.";
    } else if (network === "mainnet") {
      blockCode = "MAINNET_DISABLED";
      blockMessage = "Mainnet claims remain disabled until contract audit and launch approval.";
    } else if (!contractAddress) {
      blockCode = "CLAIM_CONTRACT_NOT_CONFIGURED";
      blockMessage = "The Testnet claim contract address is not configured.";
    }

    if (blockCode || blockMessage || !wallet || !entitlement || !contractAddress) {
      await buildAuditStatement(context.env.DB, {
        userId: user.id,
        actorType: "user",
        actorId: user.id,
        eventType: "claim.intent.blocked",
        referenceType: "claim_intent",
        referenceId: idempotencyKey,
        detail: { code: blockCode, network },
        requestId: context.get("requestId"),
      }).run();

      return context.json(
        claimIntentResponseSchema.parse({
          status: "blocked",
          code: blockCode ?? "CLAIM_BLOCKED",
          message: blockMessage ?? "Claim preparation is blocked.",
          claimId: null,
          network,
          contractAddress,
          amount: entitlement?.amount ?? 0,
        }),
        200,
        { "cache-control": "no-store" },
      );
    }

    const claimId = `clm_${crypto.randomUUID()}`;
    const now = nowIso();
    const inserted = await context.env.DB.prepare(
      `INSERT OR IGNORE INTO token_claims (
         id, user_id, wallet_id, entitlement_id, network, status,
         transaction_boc, transaction_hash, failure_code,
         idempotency_key, created_at, updated_at
       )
       SELECT ?1, ?2, ?3, ?4, ?5, 'prepared', NULL, NULL, NULL, ?6, ?7, ?7
        WHERE EXISTS (
          SELECT 1 FROM shore_entitlements
           WHERE id = ?4 AND user_id = ?2 AND status = 'claimable'
        )
       RETURNING id`,
    )
      .bind(claimId, user.id, wallet.id, entitlement.id, network, idempotencyKey, now)
      .first<{ id: string }>();

    if (!inserted) {
      const activeClaim = await context.env.DB.prepare(
        `SELECT c.id, c.status, c.failure_code, e.amount
           FROM token_claims c
           JOIN shore_entitlements e ON e.id = c.entitlement_id
          WHERE c.entitlement_id = ?1
            AND c.user_id = ?2
            AND c.status IN ('prepared', 'submitted', 'confirmed')
          LIMIT 1`,
      )
        .bind(entitlement.id, user.id)
        .first<ClaimRow>();

      return context.json(
        claimIntentResponseSchema.parse({
          status: activeClaim?.status === "prepared" ? "prepared" : "blocked",
          code: activeClaim ? "CLAIM_ALREADY_ACTIVE" : "CLAIM_PREPARE_CONFLICT",
          message: activeClaim
            ? "An active claim already exists for this entitlement."
            : "The entitlement changed before claim preparation completed.",
          claimId: activeClaim?.id ?? null,
          network,
          contractAddress,
          amount: activeClaim?.amount ?? entitlement.amount,
        }),
        200,
        { "cache-control": "no-store" },
      );
    }

    await buildAuditStatement(context.env.DB, {
      userId: user.id,
      actorType: "user",
      actorId: user.id,
      eventType: "claim.intent.prepared",
      referenceType: "token_claim",
      referenceId: claimId,
      detail: {
        entitlementId: entitlement.id,
        amount: entitlement.amount,
        network,
        contractAddress,
      },
      requestId: context.get("requestId"),
      createdAt: now,
    }).run();

    return context.json(
      claimIntentResponseSchema.parse({
        status: "prepared",
        code: "TESTNET_CLAIM_INTENT_PREPARED",
        message:
          "The Testnet claim intent is recorded. Transaction payload generation remains blocked until the deployed contract message schema is configured.",
        claimId,
        network,
        contractAddress,
        amount: entitlement.amount,
      }),
      201,
      { "cache-control": "no-store" },
    );
  });
}
