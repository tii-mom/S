import type {
  ActivityEvent,
  Mission,
  MissionExecution,
  ProofSubmission,
  ShoreRound,
  VerifiedWallet,
} from "@shore/shared";

export type MissionRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  platform: string;
  estimated_minutes: number;
  stable_reward_minor: number;
  stable_reward_currency: string;
  ap_reward: number;
  shore_rights_reward: number;
  risk_level: Mission["riskLevel"];
  verification_method: string;
  proof_instructions: string;
  status: Mission["status"];
};

export type ExecutionRow = {
  id: string;
  mission_id: string;
  status: MissionExecution["status"];
  started_at: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  completed_at: string | null;
  proof_id: string | null;
  proof_evidence_url: string | null;
  proof_r2_object_key: string | null;
  proof_original_filename: string | null;
  proof_note: string | null;
  proof_status: ProofSubmission["status"] | null;
  proof_review_reason: string | null;
  proof_created_at: string | null;
  proof_reviewed_at: string | null;
};

export type RoundRow = {
  round_number: number;
  target_price_decimal: string;
  required_actions: number;
  required_revenue_minor: number;
  required_liquidity_minor: number;
  personal_requirement: string;
  release_amount: number;
  status: ShoreRound["status"];
  price_progress: number;
  action_progress: number;
  revenue_progress: number;
  liquidity_progress: number;
};

export type WalletRow = {
  address_raw: string;
  address_friendly: string;
  network: VerifiedWallet["network"];
  wallet_app: string | null;
  proof_verified_at: string;
};

export type AuditRow = {
  id: string;
  event_type: string;
  detail_json: string;
  created_at: string;
};

export function mapMission(row: MissionRow): Mission {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    platform: row.platform,
    estimatedMinutes: row.estimated_minutes,
    stableRewardMinor: row.stable_reward_minor,
    stableRewardCurrency: row.stable_reward_currency,
    apReward: row.ap_reward,
    shoreRightsReward: row.shore_rights_reward,
    riskLevel: row.risk_level,
    verificationMethod: row.verification_method,
    proofInstructions: row.proof_instructions,
    status: row.status,
  };
}

export function mapExecution(row: ExecutionRow | null): MissionExecution | null {
  if (!row) return null;
  const proof: ProofSubmission | null = row.proof_id
    ? {
        id: row.proof_id,
        executionId: row.id,
        evidenceUrl: row.proof_evidence_url,
        hasPrivateFile: Boolean(row.proof_r2_object_key),
        originalFilename: row.proof_original_filename,
        note: row.proof_note ?? "",
        status: row.proof_status ?? "queued",
        reviewReason: row.proof_review_reason,
        createdAt: row.proof_created_at ?? row.started_at,
        reviewedAt: row.proof_reviewed_at,
      }
    : null;

  return {
    id: row.id,
    missionId: row.mission_id,
    status: row.status,
    startedAt: row.started_at,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    completedAt: row.completed_at,
    proof,
  };
}

export function mapRound(row: RoundRow): ShoreRound {
  return {
    round: row.round_number,
    targetPriceDecimal: row.target_price_decimal,
    requiredActions: row.required_actions,
    requiredRevenueMinor: row.required_revenue_minor,
    requiredLiquidityMinor: row.required_liquidity_minor,
    personalRequirement: row.personal_requirement,
    releaseAmount: row.release_amount,
    status: row.status,
    priceProgress: row.price_progress,
    actionProgress: row.action_progress,
    revenueProgress: row.revenue_progress,
    liquidityProgress: row.liquidity_progress,
  };
}

export function mapWallet(row: WalletRow | null): VerifiedWallet | null {
  if (!row) return null;
  return {
    addressRaw: row.address_raw,
    addressFriendly: row.address_friendly,
    network: row.network,
    walletApp: row.wallet_app,
    proofVerifiedAt: row.proof_verified_at,
  };
}

const activityCopy: Record<string, { title: string; status: ActivityEvent["status"] }> = {
  "session.bootstrap.created": { title: "Staging session created", status: "neutral" },
  "mission.execution.started": { title: "Mission started", status: "neutral" },
  "proof.submitted": { title: "Proof submitted", status: "pending" },
  "proof.review.queued": { title: "Proof entered review queue", status: "pending" },
  "proof.review.manual": { title: "Manual review required", status: "pending" },
  "proof.review.approved": { title: "Proof approved", status: "success" },
  "proof.review.rejected": { title: "Proof rejected", status: "error" },
  "proof.review.resubmission": { title: "Additional proof requested", status: "pending" },
  "wallet.ton_proof.verified": { title: "TON wallet verified", status: "success" },
  "claim.intent.blocked": { title: "Claim preparation blocked", status: "error" },
  "claim.intent.prepared": { title: "Claim intent prepared", status: "success" },
};

export function mapActivity(row: AuditRow): ActivityEvent {
  let detail: string;
  try {
    const parsed = JSON.parse(row.detail_json) as Record<string, unknown>;
    detail = Object.entries(parsed)
      .slice(0, 3)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(" · ");
  } catch {
    detail = "Event detail unavailable";
  }
  const copy = activityCopy[row.event_type] ?? {
    title: row.event_type,
    status: "neutral" as const,
  };
  return {
    id: row.id,
    createdAt: row.created_at,
    eventType: row.event_type,
    title: copy.title,
    detail,
    status: copy.status,
  };
}

export const executionSelectSql = `
  SELECT e.id, e.mission_id, e.status, e.started_at, e.submitted_at,
         e.reviewed_at, e.completed_at,
         p.id AS proof_id, p.evidence_url AS proof_evidence_url,
         p.r2_object_key AS proof_r2_object_key,
         p.original_filename AS proof_original_filename,
         p.note AS proof_note, p.status AS proof_status,
         p.review_reason AS proof_review_reason,
         p.created_at AS proof_created_at, p.reviewed_at AS proof_reviewed_at
    FROM mission_executions e
    LEFT JOIN proof_submissions p ON p.id = (
      SELECT p2.id FROM proof_submissions p2
       WHERE p2.execution_id = e.id
       ORDER BY p2.created_at DESC LIMIT 1
    )
`;
