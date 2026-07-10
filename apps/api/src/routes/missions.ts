import { startMissionResponseSchema, submitProofResponseSchema } from "@shore/shared";
import type { Hono } from "hono";

import { buildAuditStatement } from "../lib/audit";
import { getAuthenticatedUser } from "../lib/auth";
import { ApiHttpError, nowIso, requireIdempotencyKey } from "../lib/http";
import { executionSelectSql, mapExecution, type ExecutionRow } from "../lib/model";
import { validateEvidenceUrl } from "../lib/url-safety";
import type { Bindings, ProofReviewJob, Variables } from "../types";

const MAX_PROOF_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_PROOF_CONTENT_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

async function readExecution(
  db: D1Database,
  executionId: string,
  userId: string,
): Promise<ExecutionRow | null> {
  return db
    .prepare(`${executionSelectSql} WHERE e.id = ?1 AND e.user_id = ?2 LIMIT 1`)
    .bind(executionId, userId)
    .first<ExecutionRow>();
}

export function registerMissionRoutes(
  app: Hono<{ Bindings: Bindings; Variables: Variables }>,
): void {
  app.post("/api/v1/missions/:missionId/start", async (context) => {
    const user = getAuthenticatedUser(context);
    const missionId = context.req.param("missionId");
    const idempotencyKey = requireIdempotencyKey(context);

    const mission = await context.env.DB.prepare(
      `SELECT id FROM missions
        WHERE id = ?1 AND status = 'active'
          AND (starts_at IS NULL OR starts_at <= datetime('now'))
          AND (ends_at IS NULL OR ends_at > datetime('now'))
        LIMIT 1`,
    )
      .bind(missionId)
      .first<{ id: string }>();
    if (!mission) {
      throw new ApiHttpError(
        404,
        "MISSION_NOT_AVAILABLE",
        "The mission is not currently available.",
      );
    }

    let execution = await context.env.DB.prepare(
      `${executionSelectSql} WHERE e.mission_id = ?1 AND e.user_id = ?2 LIMIT 1`,
    )
      .bind(missionId, user.id)
      .first<ExecutionRow>();

    if (!execution) {
      const now = nowIso();
      const executionId = `exe_${crypto.randomUUID()}`;
      await context.env.DB.batch([
        context.env.DB.prepare(
          `INSERT OR IGNORE INTO mission_executions (
             id, mission_id, user_id, status, started_at, submitted_at,
             reviewed_at, completed_at, updated_at
           ) VALUES (?1, ?2, ?3, 'started', ?4, NULL, NULL, NULL, ?4)`,
        ).bind(executionId, missionId, user.id, now),
        buildAuditStatement(context.env.DB, {
          userId: user.id,
          actorType: "user",
          actorId: user.id,
          eventType: "mission.execution.started",
          referenceType: "mission_execution",
          referenceId: executionId,
          detail: { missionId, idempotencyKey },
          requestId: context.get("requestId"),
          createdAt: now,
        }),
      ]);
      execution = await readExecution(context.env.DB, executionId, user.id);
      if (!execution) {
        execution = await context.env.DB.prepare(
          `${executionSelectSql} WHERE e.mission_id = ?1 AND e.user_id = ?2 LIMIT 1`,
        )
          .bind(missionId, user.id)
          .first<ExecutionRow>();
      }
    }

    if (!execution) {
      throw new ApiHttpError(
        500,
        "EXECUTION_CREATE_FAILED",
        "Mission execution could not be created.",
      );
    }

    return context.json(
      startMissionResponseSchema.parse({ execution: mapExecution(execution) }),
      200,
      { "cache-control": "no-store" },
    );
  });

  app.get("/api/v1/executions/:executionId", async (context) => {
    const user = getAuthenticatedUser(context);
    const execution = await readExecution(
      context.env.DB,
      context.req.param("executionId"),
      user.id,
    );
    if (!execution) {
      throw new ApiHttpError(404, "EXECUTION_NOT_FOUND", "Mission execution was not found.");
    }
    return context.json({ execution: mapExecution(execution) }, 200, {
      "cache-control": "no-store",
    });
  });

  app.post("/api/v1/executions/:executionId/proofs", async (context) => {
    const user = getAuthenticatedUser(context);
    const executionId = context.req.param("executionId");
    const idempotencyKey = requireIdempotencyKey(context);
    const execution = await readExecution(context.env.DB, executionId, user.id);

    if (!execution) {
      throw new ApiHttpError(404, "EXECUTION_NOT_FOUND", "Mission execution was not found.");
    }
    if (!["started", "resubmission_required"].includes(execution.status)) {
      throw new ApiHttpError(
        409,
        "EXECUTION_NOT_SUBMITTABLE",
        `Proof cannot be submitted while execution status is ${execution.status}.`,
      );
    }

    const duplicate = await context.env.DB.prepare(
      "SELECT execution_id FROM proof_submissions WHERE idempotency_key = ?1 LIMIT 1",
    )
      .bind(idempotencyKey)
      .first<{ execution_id: string }>();
    if (duplicate) {
      if (duplicate.execution_id !== executionId) {
        throw new ApiHttpError(
          409,
          "IDEMPOTENCY_CONFLICT",
          "The idempotency key belongs to another execution.",
        );
      }
      const existing = await readExecution(context.env.DB, executionId, user.id);
      if (!existing) {
        throw new ApiHttpError(
          500,
          "IDEMPOTENT_PROOF_READ_FAILED",
          "The existing proof could not be read after an idempotent retry.",
        );
      }
      return context.json(
        submitProofResponseSchema.parse({
          execution: mapExecution(existing),
          queuedJobId: `existing_${idempotencyKey}`,
        }),
        200,
        { "cache-control": "no-store" },
      );
    }

    const contentType = context.req.header("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
      throw new ApiHttpError(
        415,
        "MULTIPART_REQUIRED",
        "Proof submission must use multipart/form-data.",
      );
    }

    const form = await context.req.raw.formData();
    const noteValue = form.get("note");
    const urlValue = form.get("evidenceUrl");
    const fileValue = form.get("file");
    const note = typeof noteValue === "string" ? noteValue.trim() : "";
    if (note.length < 20 || note.length > 2000) {
      throw new ApiHttpError(
        422,
        "INVALID_PROOF_NOTE",
        "Proof note must contain 20 to 2000 characters.",
      );
    }

    const evidenceUrl =
      typeof urlValue === "string" && urlValue.trim() ? validateEvidenceUrl(urlValue.trim()) : null;
    const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;
    if (!evidenceUrl && !file) {
      throw new ApiHttpError(
        422,
        "PROOF_EVIDENCE_REQUIRED",
        "Provide an HTTPS evidence URL or a private image file.",
      );
    }

    if (file && !ALLOWED_PROOF_CONTENT_TYPES.has(file.type)) {
      throw new ApiHttpError(
        415,
        "UNSUPPORTED_PROOF_FILE",
        "Proof files must be PNG, JPEG, or WebP images.",
      );
    }
    if (file && file.size > MAX_PROOF_FILE_BYTES) {
      throw new ApiHttpError(413, "PROOF_FILE_TOO_LARGE", "Proof files cannot exceed 5 MiB.");
    }

    const proofId = `prf_${crypto.randomUUID()}`;
    const jobId = `job_${crypto.randomUUID()}`;
    const now = nowIso();
    const objectKey = file ? `proofs/${user.id}/${executionId}/${crypto.randomUUID()}` : null;

    if (file && objectKey) {
      await context.env.PRIVATE_FILES.put(objectKey, file.stream(), {
        httpMetadata: { contentType: file.type },
        customMetadata: {
          ownerUserId: user.id,
          executionId,
          proofId,
          originalFilename: file.name.slice(0, 180),
        },
      });
    }

    try {
      await context.env.DB.batch([
        context.env.DB.prepare(
          `INSERT INTO proof_submissions (
             id, execution_id, user_id, evidence_url, r2_object_key,
             original_filename, content_type, size_bytes, note, status,
             review_reason, reviewer_type, idempotency_key, created_at,
             reviewed_at, updated_at
           ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 'queued',
                     NULL, NULL, ?10, ?11, NULL, ?11)`,
        ).bind(
          proofId,
          executionId,
          user.id,
          evidenceUrl,
          objectKey,
          file?.name.slice(0, 180) ?? null,
          file?.type ?? null,
          file?.size ?? null,
          note,
          idempotencyKey,
          now,
        ),
        context.env.DB.prepare(
          `UPDATE mission_executions
              SET status = 'proof_pending', submitted_at = ?1, updated_at = ?1
            WHERE id = ?2 AND user_id = ?3`,
        ).bind(now, executionId, user.id),
        buildAuditStatement(context.env.DB, {
          userId: user.id,
          actorType: "user",
          actorId: user.id,
          eventType: "proof.submitted",
          referenceType: "proof_submission",
          referenceId: proofId,
          detail: { executionId, hasUrl: Boolean(evidenceUrl), hasPrivateFile: Boolean(objectKey) },
          requestId: context.get("requestId"),
          createdAt: now,
        }),
      ]);
    } catch (error) {
      if (objectKey) await context.env.PRIVATE_FILES.delete(objectKey);
      throw error;
    }

    const job: ProofReviewJob = {
      id: jobId,
      type: "proof-review",
      proofId,
      executionId,
      userId: user.id,
      createdAt: now,
    };

    try {
      await context.env.ASYNC_JOBS.send(job);
      await buildAuditStatement(context.env.DB, {
        userId: user.id,
        actorType: "system",
        actorId: "queue-producer",
        eventType: "proof.review.queued",
        referenceType: "proof_submission",
        referenceId: proofId,
        detail: { jobId },
        requestId: context.get("requestId"),
      }).run();
    } catch (error) {
      console.error("shore_proof_queue_failed", {
        requestId: context.get("requestId"),
        proofId,
        message: error instanceof Error ? error.message : String(error),
      });
      await context.env.DB.batch([
        context.env.DB.prepare(
          `UPDATE proof_submissions
              SET status = 'manual_review', reviewer_type = 'queue_fallback',
                  review_reason = 'Automated review queue unavailable.', updated_at = ?1
            WHERE id = ?2`,
        ).bind(nowIso(), proofId),
        context.env.DB.prepare(
          `UPDATE mission_executions SET status = 'manual_review', updated_at = ?1 WHERE id = ?2`,
        ).bind(nowIso(), executionId),
      ]);
    }

    const updated = await readExecution(context.env.DB, executionId, user.id);
    return context.json(
      submitProofResponseSchema.parse({ execution: mapExecution(updated), queuedJobId: jobId }),
      202,
      { "cache-control": "no-store" },
    );
  });

  app.get("/api/v1/proofs/:proofId/file", async (context) => {
    const user = getAuthenticatedUser(context);
    const proof = await context.env.DB.prepare(
      `SELECT r2_object_key, original_filename, content_type
         FROM proof_submissions
        WHERE id = ?1 AND user_id = ?2 LIMIT 1`,
    )
      .bind(context.req.param("proofId"), user.id)
      .first<{
        r2_object_key: string | null;
        original_filename: string | null;
        content_type: string | null;
      }>();
    if (!proof?.r2_object_key) {
      throw new ApiHttpError(404, "PROOF_FILE_NOT_FOUND", "Private proof file was not found.");
    }

    const object = await context.env.PRIVATE_FILES.get(proof.r2_object_key);
    if (!object) {
      throw new ApiHttpError(404, "PROOF_FILE_NOT_FOUND", "Private proof file was not found.");
    }

    context.executionCtx.waitUntil(
      buildAuditStatement(context.env.DB, {
        userId: user.id,
        actorType: "user",
        actorId: user.id,
        eventType: "proof.file.accessed",
        referenceType: "proof_submission",
        referenceId: context.req.param("proofId"),
        detail: {},
        requestId: context.get("requestId"),
      })
        .run()
        .then(() => undefined),
    );

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("cache-control", "private, no-store");
    headers.set(
      "content-type",
      proof.content_type || headers.get("content-type") || "application/octet-stream",
    );
    headers.set(
      "content-disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(proof.original_filename || "shore-proof")}`,
    );
    return new Response(object.body, { headers });
  });
}
