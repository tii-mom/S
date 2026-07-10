import { SHORE_CLAIM_MESSAGE_VALUE_NANO } from "@shore/contracts";
import {
  claimIntentResponseSchema,
  claimSubmissionRequestSchema,
  claimSubmissionResponseSchema,
  type ClaimIntentResponse,
  type TonConnectTransaction,
} from "@shore/shared";
import { Address } from "@ton/ton";
import type { Hono } from "hono";

import { buildAuditStatement } from "../lib/audit";
import { getAuthenticatedUser } from "../lib/auth";
import { createOnchainClaimId, prepareClaimAuthorization } from "../lib/claim-authorization";
import { validateClaimSubmissionBoc } from "../lib/claim-submission";
import { ApiHttpError, nowIso, requireIdempotencyKey } from "../lib/http";
import type { Bindings, Variables } from "../types";

type WalletRow = {
  id: string;
  address_raw: string;
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
  onchain_claim_id: string | null;
  contract_address: string | null;
  authorization_expires_at: number | null;
  signer_public_key_hex: string | null;
  authorization_payload_boc: string | null;
  transaction_valid_until: number | null;
  updated_at?: string;
};

type StaleClaimRow = {
  id: string;
  entitlement_id: string;
};

type ConfiguredClaimRow = StaleClaimRow & {
  contract_address: string | null;
  signer_public_key_hex: string | null;
};

function sameTonAddress(left: string | null, right: string): boolean {
  if (!left) return false;
  try {
    return Address.parse(left).equals(Address.parse(right));
  } catch {
    return false;
  }
}

function claimConfigurationMatches(
  row: Pick<ClaimRow, "contract_address" | "signer_public_key_hex">,
  contractAddress: string,
  signerPublicKeyHex: string,
): boolean {
  return (
    sameTonAddress(row.contract_address, contractAddress) &&
    row.signer_public_key_hex?.toLowerCase() === signerPublicKeyHex.toLowerCase()
  );
}

function transactionFromClaim(row: ClaimRow): TonConnectTransaction | null {
  if (
    row.status !== "prepared" ||
    !row.contract_address ||
    !row.authorization_payload_boc ||
    !row.transaction_valid_until
  ) {
    return null;
  }
  return {
    validUntil: row.transaction_valid_until,
    network: "-3",
    messages: [
      {
        address: row.contract_address,
        amount: SHORE_CLAIM_MESSAGE_VALUE_NANO.toString(),
        payload: row.authorization_payload_boc,
      },
    ],
  };
}

function intentResponse(input: {
  row?: ClaimRow | null;
  status: "blocked" | "prepared";
  code: string;
  message: string;
  network: "testnet" | "mainnet";
  contractAddress: string | null;
  amount: number;
  claimId?: string | null;
}): ClaimIntentResponse {
  const row = input.row ?? null;
  return claimIntentResponseSchema.parse({
    status: input.status,
    code: input.code,
    message: input.message,
    claimId: input.claimId ?? row?.id ?? null,
    onchainClaimId: row?.onchain_claim_id ?? null,
    network: input.network,
    contractAddress: row?.contract_address ?? input.contractAddress,
    amount: input.amount,
    authorizationExpiresAt: row?.authorization_expires_at
      ? new Date(row.authorization_expires_at * 1000).toISOString()
      : null,
    transaction: input.status === "prepared" && row ? transactionFromClaim(row) : null,
  });
}

async function invalidateMismatchedPreparedClaims(
  db: D1Database,
  userId: string,
  contractAddress: string,
  signerPublicKeyHex: string,
  timestamp: string,
  requestId: string,
): Promise<void> {
  const prepared = await db
    .prepare(
      `SELECT id, entitlement_id, contract_address, signer_public_key_hex
         FROM token_claims
        WHERE user_id = ?1 AND status = 'prepared'`,
    )
    .bind(userId)
    .all<ConfiguredClaimRow>();

  const mismatched = prepared.results.filter(
    (claim) => !claimConfigurationMatches(claim, contractAddress, signerPublicKeyHex),
  );
  if (mismatched.length === 0) return;

  const statements: D1PreparedStatement[] = [];
  for (const claim of mismatched) {
    statements.push(
      db
        .prepare(
          `UPDATE token_claims
              SET status = 'failed',
                  failure_code = 'CLAIM_CONFIGURATION_CHANGED_BEFORE_SUBMISSION',
                  updated_at = ?1
            WHERE id = ?2 AND user_id = ?3 AND status = 'prepared'`,
        )
        .bind(timestamp, claim.id, userId),
      db
        .prepare(
          `UPDATE shore_entitlements
              SET status = 'claimable', updated_at = ?1
            WHERE id = ?2 AND user_id = ?3 AND status = 'claim_pending'`,
        )
        .bind(timestamp, claim.entitlement_id, userId),
      buildAuditStatement(db, {
        userId,
        actorType: "system",
        actorId: "claim-configuration-rotation",
        eventType: "claim.authorization.invalidated",
        referenceType: "token_claim",
        referenceId: claim.id,
        detail: {
          entitlementId: claim.entitlement_id,
          previousContractAddress: claim.contract_address,
          previousSignerPublicKeyHex: claim.signer_public_key_hex,
        },
        requestId,
        createdAt: timestamp,
      }),
    );
  }
  await db.batch(statements);
}

export function registerClaimRoutes(app: Hono<{ Bindings: Bindings; Variables: Variables }>): void {
  app.post("/api/v1/claims/intents", async (context) => {
    const user = getAuthenticatedUser(context);
    const idempotencyKey = requireIdempotencyKey(context);
    const network = context.env.TON_NETWORK;
    const contractAddress = context.env.SHORE_CLAIM_CONTRACT_ADDRESS?.trim() || null;
    const signerPublicKeyHex =
      context.env.SHORE_CLAIM_SIGNER_PUBLIC_KEY_HEX?.trim().toLowerCase() || null;
    const now = nowIso();
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (contractAddress && signerPublicKeyHex) {
      await invalidateMismatchedPreparedClaims(
        context.env.DB,
        user.id,
        contractAddress,
        signerPublicKeyHex,
        now,
        context.get("requestId"),
      );
    }

    const existing = await context.env.DB.prepare(
      `SELECT c.id, c.status, c.failure_code, e.amount,
                c.onchain_claim_id, c.contract_address,
                c.authorization_expires_at, c.signer_public_key_hex,
                c.authorization_payload_boc,
                c.transaction_valid_until, c.updated_at
           FROM token_claims c
           JOIN shore_entitlements e ON e.id = c.entitlement_id
          WHERE c.idempotency_key = ?1 AND c.user_id = ?2 LIMIT 1`,
    )
      .bind(idempotencyKey, user.id)
      .first<ClaimRow>();
    if (existing) {
      const prepared = Boolean(
        existing.status === "prepared" &&
        contractAddress &&
        signerPublicKeyHex &&
        claimConfigurationMatches(existing, contractAddress, signerPublicKeyHex) &&
        transactionFromClaim(existing),
      );
      return context.json(
        intentResponse({
          row: existing,
          status: prepared ? "prepared" : "blocked",
          code: existing.failure_code ?? (prepared ? "CLAIM_INTENT_EXISTS" : "CLAIM_NOT_PREPARED"),
          message: prepared
            ? "The Testnet claim transaction is already prepared."
            : "The existing claim is not available for a new wallet signature.",
          network,
          contractAddress,
          amount: existing.amount,
        }),
        200,
        { "cache-control": "no-store" },
      );
    }

    const reusableClaim = await context.env.DB.prepare(
      `SELECT c.id, c.status, c.failure_code, e.amount,
                c.onchain_claim_id, c.contract_address,
                c.authorization_expires_at, c.signer_public_key_hex,
                c.authorization_payload_boc,
                c.transaction_valid_until, c.updated_at
           FROM token_claims c
           JOIN shore_entitlements e ON e.id = c.entitlement_id
          WHERE c.user_id = ?1 AND c.status = 'prepared'
          ORDER BY c.created_at DESC LIMIT 1`,
    )
      .bind(user.id)
      .first<ClaimRow>();
    if (
      reusableClaim &&
      contractAddress &&
      signerPublicKeyHex &&
      claimConfigurationMatches(reusableClaim, contractAddress, signerPublicKeyHex) &&
      transactionFromClaim(reusableClaim)
    ) {
      return context.json(
        intentResponse({
          row: reusableClaim,
          status: "prepared",
          code: "CLAIM_ALREADY_ACTIVE",
          message:
            "The existing Testnet claim authorization is still valid and can be reopened in the wallet.",
          network,
          contractAddress,
          amount: reusableClaim.amount,
        }),
        200,
        { "cache-control": "no-store" },
      );
    }

    const [wallet, entitlement] = await Promise.all([
      context.env.DB.prepare(
        `SELECT id, address_raw FROM wallets
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
    } else if (!context.env.SHORE_CLAIM_SIGNER_SEED_BASE64?.trim() || !signerPublicKeyHex) {
      blockCode = "CLAIM_SIGNER_NOT_CONFIGURED";
      blockMessage = "The Testnet claim signer is not configured.";
    }

    if (
      blockCode ||
      blockMessage ||
      !wallet ||
      !entitlement ||
      !contractAddress ||
      !signerPublicKeyHex
    ) {
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
        intentResponse({
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

    if (!Number.isSafeInteger(entitlement.amount) || entitlement.amount <= 0) {
      throw new ApiHttpError(
        422,
        "ENTITLEMENT_AMOUNT_INVALID",
        "The claimable entitlement cannot be represented safely.",
      );
    }

    const activeClaim = await context.env.DB.prepare(
      `SELECT c.id, c.status, c.failure_code, e.amount,
                c.onchain_claim_id, c.contract_address,
                c.authorization_expires_at, c.signer_public_key_hex,
                c.authorization_payload_boc,
                c.transaction_valid_until, c.updated_at
           FROM token_claims c
           JOIN shore_entitlements e ON e.id = c.entitlement_id
          WHERE c.entitlement_id = ?1
            AND c.user_id = ?2
            AND c.status IN ('prepared', 'submitted', 'confirmed')
          LIMIT 1`,
    )
      .bind(entitlement.id, user.id)
      .first<ClaimRow>();
    if (activeClaim) {
      const prepared =
        activeClaim.status === "prepared" && Boolean(transactionFromClaim(activeClaim));
      return context.json(
        intentResponse({
          row: activeClaim,
          status: prepared ? "prepared" : "blocked",
          code: prepared ? "CLAIM_ALREADY_ACTIVE" : "CLAIM_ALREADY_SUBMITTED",
          message: prepared
            ? "An active Testnet claim transaction already exists for this entitlement."
            : "This entitlement already has a submitted or confirmed claim.",
          network,
          contractAddress,
          amount: activeClaim.amount,
        }),
        200,
        { "cache-control": "no-store" },
      );
    }

    const claimId = `clm_${crypto.randomUUID()}`;
    let inserted: { id: string } | null = null;
    let prepared: ReturnType<typeof prepareClaimAuthorization> | null = null;

    for (let attempt = 0; attempt < 5 && !inserted; attempt += 1) {
      prepared = prepareClaimAuthorization({
        contractAddress,
        claimantAddress: wallet.address_raw,
        amount: BigInt(entitlement.amount),
        onchainClaimId: createOnchainClaimId(),
        nowSeconds,
        signer: {
          seedBase64: context.env.SHORE_CLAIM_SIGNER_SEED_BASE64,
          expectedPublicKeyHex: signerPublicKeyHex,
        },
      });

      inserted = await context.env.DB.prepare(
        `INSERT OR IGNORE INTO token_claims (
             id, user_id, wallet_id, entitlement_id, network, status,
             transaction_boc, transaction_hash, failure_code,
             idempotency_key, created_at, updated_at,
             onchain_claim_id, contract_address,
             authorization_valid_after, authorization_expires_at,
             authorization_hash, signer_public_key_hex,
             authorization_payload_boc, transaction_valid_until
           )
           SELECT ?1, ?2, ?3, ?4, ?5, 'prepared',
                  NULL, NULL, NULL, ?6, ?7, ?7,
                  ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15
            WHERE EXISTS (
              SELECT 1 FROM shore_entitlements
               WHERE id = ?4 AND user_id = ?2 AND status = 'claimable'
            )
           RETURNING id`,
      )
        .bind(
          claimId,
          user.id,
          wallet.id,
          entitlement.id,
          network,
          idempotencyKey,
          now,
          prepared.onchainClaimId,
          prepared.transaction.messages[0]!.address,
          prepared.validAfter,
          prepared.expiresAt,
          prepared.authorizationHashHex,
          signerPublicKeyHex,
          prepared.payloadBoc,
          prepared.transaction.validUntil,
        )
        .first<{ id: string }>();
    }

    if (!inserted || !prepared) {
      throw new ApiHttpError(
        409,
        "CLAIM_PREPARE_CONFLICT",
        "The entitlement changed or a unique on-chain claim ID could not be reserved.",
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
        contractAddress: prepared.transaction.messages[0]!.address,
        onchainClaimId: prepared.onchainClaimId,
        authorizationExpiresAt: prepared.expiresAt,
      },
      requestId: context.get("requestId"),
      createdAt: now,
    }).run();

    const row: ClaimRow = {
      id: claimId,
      status: "prepared",
      failure_code: null,
      amount: entitlement.amount,
      onchain_claim_id: prepared.onchainClaimId,
      contract_address: prepared.transaction.messages[0]!.address,
      authorization_expires_at: prepared.expiresAt,
      signer_public_key_hex: signerPublicKeyHex,
      authorization_payload_boc: prepared.payloadBoc,
      transaction_valid_until: prepared.transaction.validUntil,
      updated_at: now,
    };

    return context.json(
      intentResponse({
        row,
        status: "prepared",
        code: "TESTNET_CLAIM_TRANSACTION_PREPARED",
        message: "The signed Testnet claim transaction is ready for explicit wallet approval.",
        network,
        contractAddress,
        amount: entitlement.amount,
      }),
      201,
      { "cache-control": "no-store" },
    );
  });

  app.post("/api/v1/claims/:claimId/submitted", async (context) => {
    const user = getAuthenticatedUser(context);
    const claimId = context.req.param("claimId");
    const body = claimSubmissionRequestSchema.safeParse(await context.req.json().catch(() => null));
    if (!body.success) {
      throw new ApiHttpError(
        422,
        "INVALID_CLAIM_SUBMISSION",
        "The wallet submission result is invalid.",
        body.error.flatten(),
      );
    }

    const claim = await context.env.DB.prepare(
      `SELECT id, status, authorization_expires_at,
                contract_address, authorization_payload_boc, updated_at
           FROM token_claims
          WHERE id = ?1 AND user_id = ?2 LIMIT 1`,
    )
      .bind(claimId, user.id)
      .first<{
        id: string;
        status: ClaimRow["status"];
        authorization_expires_at: number | null;
        contract_address: string | null;
        authorization_payload_boc: string | null;
        updated_at: string;
      }>();
    if (!claim) {
      throw new ApiHttpError(404, "CLAIM_NOT_FOUND", "Claim intent was not found.");
    }
    if (claim.status === "submitted") {
      return context.json(
        claimSubmissionResponseSchema.parse({
          claimId,
          status: "submitted",
          submittedAt: claim.updated_at,
        }),
        200,
        { "cache-control": "no-store" },
      );
    }
    if (claim.status !== "prepared") {
      throw new ApiHttpError(
        409,
        "CLAIM_NOT_SUBMITTABLE",
        `Claim cannot be submitted while status is ${claim.status}.`,
      );
    }
    if (
      !claim.authorization_expires_at ||
      claim.authorization_expires_at < Math.floor(Date.now() / 1000)
    ) {
      throw new ApiHttpError(
        409,
        "CLAIM_AUTHORIZATION_EXPIRED",
        "The claim authorization expired before wallet submission was recorded.",
      );
    }
    if (!claim.contract_address || !claim.authorization_payload_boc) {
      throw new ApiHttpError(
        500,
        "CLAIM_SUBMISSION_EXPECTATION_MISSING",
        "The prepared claim is missing its contract address or authorization payload.",
      );
    }

    const validatedSubmission = validateClaimSubmissionBoc({
      bocBase64: body.data.boc,
      contractAddress: claim.contract_address,
      authorizationPayloadBoc: claim.authorization_payload_boc,
    });
    const submittedAt = nowIso();
    const updated = await context.env.DB.prepare(
      `UPDATE token_claims
            SET status = 'submitted', transaction_boc = ?1,
                submission_boc_hash = ?2, updated_at = ?3
          WHERE id = ?4 AND user_id = ?5 AND status = 'prepared'
          RETURNING id`,
    )
      .bind(body.data.boc, validatedSubmission.bocHashHex, submittedAt, claimId, user.id)
      .first<{ id: string }>();
    if (!updated) {
      throw new ApiHttpError(
        409,
        "CLAIM_SUBMISSION_CONFLICT",
        "The claim state changed before submission could be recorded.",
      );
    }

    await buildAuditStatement(context.env.DB, {
      userId: user.id,
      actorType: "user",
      actorId: user.id,
      eventType: "claim.transaction.submitted",
      referenceType: "token_claim",
      referenceId: claimId,
      detail: {
        network: context.env.TON_NETWORK,
        submissionBocHash: validatedSubmission.bocHashHex,
        visitedCells: validatedSubmission.visitedCells,
      },
      requestId: context.get("requestId"),
      createdAt: submittedAt,
    }).run();

    return context.json(
      claimSubmissionResponseSchema.parse({
        claimId,
        status: "submitted",
        submittedAt,
      }),
      200,
      { "cache-control": "no-store" },
    );
  });
}
