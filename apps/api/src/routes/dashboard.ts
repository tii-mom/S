import { dashboardResponseSchema } from "@shore/shared";
import type { Hono } from "hono";

import { getAuthenticatedUser } from "../lib/auth";
import { ApiHttpError } from "../lib/http";
import {
  executionSelectSql,
  mapActivity,
  mapExecution,
  mapMission,
  mapRound,
  mapWallet,
  type AuditRow,
  type ExecutionRow,
  type MissionRow,
  type RoundRow,
  type WalletRow,
} from "../lib/model";
import type { Bindings, Variables } from "../types";

type DebtRow = {
  currency: "CNY";
  confirmed_amount_minor: number;
  covered_amount_minor: number;
};

type BalanceRow = {
  ap: number;
  shore_locked: number;
  shore_claimable: number;
  shore_claimed: number;
};

type CountRow = {
  verified_actions: number;
  pending_proofs: number;
};

type PreparedClaimRow = {
  amount: number;
  authorization_expires_at: number | null;
};

export function registerDashboardRoutes(
  app: Hono<{ Bindings: Bindings; Variables: Variables }>,
): void {
  app.get("/api/v1/dashboard", async (context) => {
    const user = getAuthenticatedUser(context);
    const network = context.env.TON_NETWORK;

    const [debt, mission, balances, counts, roundsResult, activitiesResult, wallet, preparedClaim] =
      await Promise.all([
        context.env.DB.prepare(
          `SELECT currency, confirmed_amount_minor, covered_amount_minor
           FROM debt_summaries
          WHERE user_id = ?1 AND status = 'confirmed'
          ORDER BY updated_at DESC LIMIT 1`,
        )
          .bind(user.id)
          .first<DebtRow>(),
        context.env.DB.prepare(
          `SELECT id, title, description, category, platform, estimated_minutes,
                stable_reward_minor, stable_reward_currency, ap_reward,
                shore_rights_reward, risk_level, verification_method,
                proof_instructions, status
           FROM missions
          WHERE status = 'active'
            AND (starts_at IS NULL OR starts_at <= datetime('now'))
            AND (ends_at IS NULL OR ends_at > datetime('now'))
          ORDER BY created_at ASC LIMIT 1`,
        ).first<MissionRow>(),
        context.env.DB.prepare(
          `SELECT
           COALESCE((SELECT SUM(amount) FROM points_ledger WHERE user_id = ?1), 0) AS ap,
           COALESCE((SELECT SUM(amount) FROM shore_entitlements WHERE user_id = ?1 AND status = 'locked'), 0) AS shore_locked,
           COALESCE((SELECT SUM(amount) FROM shore_entitlements WHERE user_id = ?1 AND status = 'claimable'), 0) AS shore_claimable,
           COALESCE((SELECT SUM(amount) FROM shore_entitlements WHERE user_id = ?1 AND status = 'claimed'), 0) AS shore_claimed`,
        )
          .bind(user.id)
          .first<BalanceRow>(),
        context.env.DB.prepare(
          `SELECT
           COALESCE((SELECT COUNT(*) FROM mission_executions WHERE user_id = ?1 AND status = 'approved'), 0) AS verified_actions,
           COALESCE((SELECT COUNT(*) FROM proof_submissions WHERE user_id = ?1 AND status IN ('queued', 'manual_review')), 0) AS pending_proofs`,
        )
          .bind(user.id)
          .first<CountRow>(),
        context.env.DB.prepare(
          `SELECT round_number, target_price_decimal, required_actions,
                required_revenue_minor, required_liquidity_minor,
                personal_requirement, release_amount, status,
                price_progress, action_progress, revenue_progress,
                liquidity_progress
           FROM rounds ORDER BY round_number ASC`,
        ).all<RoundRow>(),
        context.env.DB.prepare(
          `SELECT id, event_type, detail_json, created_at
           FROM audit_logs
          WHERE user_id = ?1
          ORDER BY created_at DESC LIMIT 12`,
        )
          .bind(user.id)
          .all<AuditRow>(),
        context.env.DB.prepare(
          `SELECT address_raw, address_friendly, network, wallet_app, proof_verified_at
           FROM wallets WHERE user_id = ?1 AND network = ?2 LIMIT 1`,
        )
          .bind(user.id, network)
          .first<WalletRow>(),
        context.env.DB.prepare(
          `SELECT e.amount, c.authorization_expires_at
             FROM token_claims c
             JOIN shore_entitlements e ON e.id = c.entitlement_id
            WHERE c.user_id = ?1 AND c.status = 'prepared'
            ORDER BY c.created_at DESC LIMIT 1`,
        )
          .bind(user.id)
          .first<PreparedClaimRow>(),
      ]);

    if (!debt || !mission || !balances || !counts) {
      throw new ApiHttpError(
        503,
        "DASHBOARD_NOT_READY",
        "The operational D1 dataset is incomplete. Apply migrations and bootstrap a session.",
      );
    }

    const execution = await context.env.DB.prepare(
      `${executionSelectSql}
        WHERE e.user_id = ?1 AND e.mission_id = ?2
        LIMIT 1`,
    )
      .bind(user.id, mission.id)
      .first<ExecutionRow>();

    const originalMinor = debt.confirmed_amount_minor;
    const coveredMinor = Math.min(debt.covered_amount_minor, originalMinor);
    const remainingMinor = Math.max(0, originalMinor - coveredMinor);
    const coverageBasisPoints =
      originalMinor === 0
        ? 10000
        : Math.min(10000, Math.round((coveredMinor * 10000) / originalMinor));
    const mappedWallet = mapWallet(wallet);
    const contractAddress = context.env.SHORE_CLAIM_CONTRACT_ADDRESS?.trim() || null;

    const claimReadiness = !mappedWallet
      ? {
          status: "wallet_required" as const,
          reason: "Connect and verify a TON wallet before preparing a claim.",
        }
      : network === "mainnet"
        ? {
            status: "mainnet_disabled" as const,
            reason: "Mainnet claims remain disabled until contract audit and launch approval.",
          }
        : !contractAddress
          ? {
              status: "contract_not_configured" as const,
              reason: "The Testnet claim contract address has not been configured.",
            }
          : !context.env.SHORE_CLAIM_SIGNER_PUBLIC_KEY_HEX?.trim() ||
              !context.env.SHORE_CLAIM_SIGNER_SEED_BASE64?.trim()
            ? {
                status: "signer_not_configured" as const,
                reason: "The Testnet claim signer has not been configured.",
              }
            : preparedClaim
              ? {
                  status: "ready_testnet" as const,
                  reason:
                    preparedClaim.authorization_expires_at &&
                    preparedClaim.authorization_expires_at < Math.floor(Date.now() / 1000)
                      ? "The previous wallet authorization expired and will be refreshed on the next explicit claim action."
                      : "A signed Testnet claim transaction is ready to reopen in the wallet.",
                }
              : balances.shore_claimable <= 0
                ? {
                    status: "entitlement_required" as const,
                    reason: "No claimable SHORE entitlement is available.",
                  }
                : {
                    status: "ready_testnet" as const,
                    reason:
                      "Wallet, entitlement, contract and signer checks passed for Testnet claim preparation.",
                  };

    const response = dashboardResponseSchema.parse({
      source: "d1",
      environment: context.env.APP_ENV,
      user: {
        id: user.id,
        displayName: user.displayName,
      },
      debt: {
        currency: debt.currency,
        originalMinor,
        coveredMinor,
        remainingMinor,
        coverageBasisPoints,
      },
      balances: {
        ap: balances.ap,
        shoreLocked: balances.shore_locked,
        shoreClaimable: balances.shore_claimable,
        shoreClaimed: balances.shore_claimed,
      },
      counts: {
        verifiedActions: counts.verified_actions,
        pendingProofs: counts.pending_proofs,
      },
      mission: mapMission(mission),
      execution: mapExecution(execution),
      rounds: roundsResult.results.map(mapRound),
      activities: activitiesResult.results.map(mapActivity),
      wallet: mappedWallet,
      claimReadiness: {
        ...claimReadiness,
        claimableAmount: preparedClaim?.amount ?? balances.shore_claimable,
        contractAddress,
        network,
      },
      generatedAt: new Date().toISOString(),
    });

    return context.json(response, 200, { "cache-control": "no-store" });
  });
}
