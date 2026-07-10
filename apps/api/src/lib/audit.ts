import { nowIso } from "./http";

export function buildAuditStatement(
  db: D1Database,
  input: {
    userId: string | null;
    actorType: string;
    actorId: string;
    eventType: string;
    referenceType: string;
    referenceId: string;
    detail: Record<string, unknown>;
    requestId?: string;
    createdAt?: string;
  },
): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO audit_logs (
         id, user_id, actor_type, actor_id, event_type,
         reference_type, reference_id, detail_json, request_id, created_at
       ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
    )
    .bind(
      crypto.randomUUID(),
      input.userId,
      input.actorType,
      input.actorId,
      input.eventType,
      input.referenceType,
      input.referenceId,
      JSON.stringify(input.detail),
      input.requestId ?? null,
      input.createdAt ?? nowIso(),
    );
}
