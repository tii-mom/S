import { adminProofReviewRequestSchema } from "@shore/shared";
import type { Hono } from "hono";

import { buildAuditStatement } from "../lib/audit";
import { constantTimeEqual } from "../lib/crypto";
import { ApiHttpError, nowIso } from "../lib/http";
import type { Bindings, Variables } from "../types";

type ReviewRow = {
  proof_id: string;
  proof_status: string;
  execution_id: string;
  execution_status: string;
  user_id: string;
  ap_reward: number;
  shore_rights_reward: number;
  stable_reward_minor: number;
  stable_reward_currency: string;
};

function requireAdminToken(provided: string | undefined, configured: string | undefined): void {
  if (!configured?.trim()) {
    throw new ApiHttpError(
      503,
      "ADMIN_REVIEW_NOT_CONFIGURED",
      "ADMIN_REVIEW_TOKEN is not configured for this environment.",
    );
  }
  if (!provided || !constantTimeEqual(provided, configured)) {
    throw new ApiHttpError(403, "ADMIN_FORBIDDEN", "Administrator review authorization failed.");
  }
}

export function registerAdminRoutes(app: Hono<{ Bindings: Bindings; Variables: Variables }>): void {
  app.post("/api/v1/admin/proofs/:proofId/review", async (context) => {
    requireAdminToken(context.req.header("x-shore-admin-token"), context.env.ADMIN_REVIEW_TOKEN);

    const parsed = adminProofReviewRequestSchema.safeParse(
      await context.req.json().catch(() => null),
    );
    if (!parsed.success) {
      throw new ApiHttpError(
        422,
        "INVALID_REVIEW_DECISION",
        "The proof review decision is invalid.",
        parsed.error.flatten(),
      );
    }

    const proofId = context.req.param("proofId");
    const row = await context.env.DB.prepare(
      `SELECT p.id AS proof_id, p.status AS proof_status,
              e.id AS execution_id, e.status AS execution_status,
              e.user_id, m.ap_reward, m.shore_rights_reward,
              m.stable_reward_minor, m.stable_reward_currency
         FROM proof_submissions p
         JOIN mission_executions e ON e.id = p.execution_id
         JOIN missions m ON m.id = e.mission_id
        WHERE p.id = ?1 LIMIT 1`,
    )
      .bind(proofId)
      .first<ReviewRow>();

    if (!row) {
      throw new ApiHttpError(404, "PROOF_NOT_FOUND", "Proof submission was not found.");
    }
    if (!["manual_review", "queued"].includes(row.proof_status)) {
      throw new ApiHttpError(
        409,
        "PROOF_NOT_REVIEWABLE",
        `Proof cannot be reviewed while status is ${row.proof_status}.`,
      );
    }

    const now = nowIso();
    const actorId = "admin-review-api";
    const requestId = context.get("requestId");

    if (parsed.data.decision === "approve") {
      await context.env.DB.batch([
        context.env.DB.prepare(
          `UPDATE proof_submissions
              SET status = 'approved', reviewer_type = 'human_admin',
                  review_reason = ?1, reviewed_at = ?2, updated_at = ?2
            WHERE id = ?3 AND status IN ('queued', 'manual_review')`,
        ).bind(parsed.data.reason, now, proofId),
        context.env.DB.prepare(
          `UPDATE mission_executions
              SET status = 'approved', reviewed_at = ?1, completed_at = ?1, updated_at = ?1
            WHERE id = ?2`,
        ).bind(now, row.execution_id),
        context.env.DB.prepare(
          `INSERT OR IGNORE INTO points_ledger (
             id, user_id, entry_type, amount, reference_type, reference_id,
             idempotency_key, created_at, created_by, reason
           ) VALUES (?1, ?2, 'earn', ?3, 'proof_submission', ?4, ?5, ?6, ?7, ?8)`,
        ).bind(
          `pts_${crypto.randomUUID()}`,
          row.user_id,
          row.ap_reward,
          proofId,
          `proof:${proofId}:ap`,
          now,
          actorId,
          parsed.data.reason,
        ),
        context.env.DB.prepare(
          `INSERT OR IGNORE INTO shore_entitlements (
             id, user_id, source_type, source_id, round_number, amount, status,
             idempotency_key, unlocks_at, claimed_at, created_at, updated_at
           ) VALUES (?1, ?2, 'mission_proof', ?3, 0, ?4, 'locked', ?5, NULL, NULL, ?6, ?6)`,
        ).bind(
          `ent_${crypto.randomUUID()}`,
          row.user_id,
          proofId,
          row.shore_rights_reward,
          `proof:${proofId}:shore`,
          now,
        ),
        context.env.DB.prepare(
          `INSERT OR IGNORE INTO reward_entitlements (
             id, user_id, execution_id, currency, amount_minor, status,
             idempotency_key, created_at, updated_at
           ) VALUES (?1, ?2, ?3, ?4, ?5, 'pending', ?6, ?7, ?7)`,
        ).bind(
          `rew_${crypto.randomUUID()}`,
          row.user_id,
          row.execution_id,
          row.stable_reward_currency,
          row.stable_reward_minor,
          `proof:${proofId}:stable`,
          now,
        ),
        buildAuditStatement(context.env.DB, {
          userId: row.user_id,
          actorType: "admin",
          actorId,
          eventType: "proof.review.approved",
          referenceType: "proof_submission",
          referenceId: proofId,
          detail: {
            executionId: row.execution_id,
            apReward: row.ap_reward,
            shoreRightsReward: row.shore_rights_reward,
            stableRewardMinor: row.stable_reward_minor,
            reason: parsed.data.reason,
          },
          requestId,
          createdAt: now,
        }),
      ]);
    } else {
      const proofStatus = parsed.data.decision === "reject" ? "rejected" : "resubmission_required";
      const eventType =
        parsed.data.decision === "reject" ? "proof.review.rejected" : "proof.review.resubmission";
      await context.env.DB.batch([
        context.env.DB.prepare(
          `UPDATE proof_submissions
              SET status = ?1, reviewer_type = 'human_admin',
                  review_reason = ?2, reviewed_at = ?3, updated_at = ?3
            WHERE id = ?4 AND status IN ('queued', 'manual_review')`,
        ).bind(proofStatus, parsed.data.reason, now, proofId),
        context.env.DB.prepare(
          `UPDATE mission_executions
              SET status = ?1, reviewed_at = ?2, updated_at = ?2
            WHERE id = ?3`,
        ).bind(proofStatus, now, row.execution_id),
        buildAuditStatement(context.env.DB, {
          userId: row.user_id,
          actorType: "admin",
          actorId,
          eventType,
          referenceType: "proof_submission",
          referenceId: proofId,
          detail: { executionId: row.execution_id, reason: parsed.data.reason },
          requestId,
          createdAt: now,
        }),
      ]);
    }

    return context.json(
      {
        ok: true,
        proofId,
        executionId: row.execution_id,
        decision: parsed.data.decision,
        reviewedAt: now,
      },
      200,
      { "cache-control": "no-store" },
    );
  });
}
