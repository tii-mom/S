import { buildAuditStatement } from "../lib/audit";
import { nowIso } from "../lib/http";
import type { Bindings, ProofReviewJob } from "../types";

type ProofRow = {
  id: string;
  execution_id: string;
  user_id: string;
  evidence_url: string | null;
  r2_object_key: string | null;
  note: string;
  status: string;
};

export async function processProofReviewJob(env: Bindings, job: ProofReviewJob): Promise<void> {
  const proof = await env.DB.prepare(
    `SELECT id, execution_id, user_id, evidence_url, r2_object_key, note, status
       FROM proof_submissions WHERE id = ?1 LIMIT 1`,
  )
    .bind(job.proofId)
    .first<ProofRow>();

  if (!proof || proof.execution_id !== job.executionId || proof.user_id !== job.userId) {
    throw new Error(`Proof review job ${job.id} does not match a stored proof.`);
  }
  if (proof.status !== "queued") return;

  const fileExists = proof.r2_object_key
    ? Boolean(await env.PRIVATE_FILES.head(proof.r2_object_key))
    : false;
  const evidencePresent = Boolean(proof.evidence_url) || fileExists;
  const resubmissionRequired = !evidencePresent || proof.note.trim().length < 20;
  const now = nowIso();
  const proofStatus = resubmissionRequired ? "resubmission_required" : "manual_review";
  const executionStatus = resubmissionRequired ? "resubmission_required" : "manual_review";
  const reason = resubmissionRequired
    ? "Stored evidence is missing or incomplete. Submit a new private proof."
    : "Evidence passed storage and format checks. Human review is required before rewards are issued.";

  await env.DB.batch([
    env.DB.prepare(
      `UPDATE proof_submissions
          SET status = ?1, reviewer_type = 'rules_v1', review_reason = ?2,
              reviewed_at = ?3, updated_at = ?3
        WHERE id = ?4 AND status = 'queued'`,
    ).bind(proofStatus, reason, now, proof.id),
    env.DB.prepare(
      `UPDATE mission_executions
          SET status = ?1, reviewed_at = ?2, updated_at = ?2
        WHERE id = ?3`,
    ).bind(executionStatus, now, proof.execution_id),
    buildAuditStatement(env.DB, {
      userId: proof.user_id,
      actorType: "system",
      actorId: "proof-rules-v1",
      eventType: resubmissionRequired ? "proof.review.resubmission" : "proof.review.manual",
      referenceType: "proof_submission",
      referenceId: proof.id,
      detail: { jobId: job.id, reason },
      createdAt: now,
    }),
  ]);
}
