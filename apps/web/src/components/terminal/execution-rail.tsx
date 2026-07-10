"use client";

import type { ClaimReadiness, MissionExecution, VerifiedWallet } from "@shore/shared";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";

import {
  formatCny,
  formatInteger,
  formatPercent,
  formatRound,
  formatUsd,
} from "@/lib/shore-terminal/formatters";
import type { RoundDefinition, TerminalDashboard } from "@/lib/shore-terminal/types";
import type { RuntimeStatus } from "@/lib/shore-runtime/use-shore-runtime";

import {
  ActionIcon,
  ActivityIcon,
  CheckIcon,
  ProofIcon,
  RoundIcon,
  ShoreIcon,
  WalletIcon,
} from "./terminal-icons";
import { StatusBadge, StatusDot, TerminalPanel } from "./terminal-primitives";

function GateProgress({ label, value }: { label: string; value: number }) {
  return (
    <div className="gate-progress">
      <div>
        <span>{label}</span>
        <strong>{formatPercent(value)}</strong>
      </div>
      <div className="gate-progress__track">
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

const executionCopy: Record<
  MissionExecution["status"],
  { label: string; tone: "green" | "gold" | "red" | "blue" | "muted"; detail: string }
> = {
  started: {
    label: "IN PROGRESS",
    tone: "blue",
    detail: "任务已经写入D1。完成真实动作后提交Proof。",
  },
  proof_pending: {
    label: "QUEUED",
    tone: "gold",
    detail: "Proof已进入Cloudflare Queue，等待规则检查。",
  },
  manual_review: {
    label: "MANUAL REVIEW",
    tone: "gold",
    detail: "存储与格式检查已通过，等待人工批准。批准前不会发放奖励。",
  },
  approved: {
    label: "APPROVED",
    tone: "green",
    detail: "Proof已批准，AP和奖励资格已幂等写入账本。",
  },
  rejected: {
    label: "REJECTED",
    tone: "red",
    detail: "Proof未通过。查看审核原因后重新选择其他任务。",
  },
  resubmission_required: {
    label: "RESUBMIT",
    tone: "red",
    detail: "需要补充新的Proof链接或私有截图。",
  },
  cancelled: {
    label: "CANCELLED",
    tone: "muted",
    detail: "任务执行已取消。",
  },
};

export function MissionExecutionPanel({
  dashboard,
  execution,
  runtimeStatus,
  runtimeLive,
  onStart,
  onSubmitProof,
}: {
  dashboard: TerminalDashboard;
  execution: MissionExecution | null;
  runtimeStatus: RuntimeStatus;
  runtimeLive: boolean;
  onStart: () => Promise<unknown>;
  onSubmitProof: (input: {
    note: string;
    evidenceUrl?: string;
    file?: File | null;
  }) => Promise<unknown>;
}) {
  const mission = dashboard.mission;
  const [note, setNote] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const busy = runtimeStatus === "mutating" || runtimeStatus === "loading";
  const canSubmitProof =
    runtimeLive && execution && ["started", "resubmission_required"].includes(execution.status);

  const submitProofForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await onSubmitProof({ note, evidenceUrl, file });
    if (result) {
      setNote("");
      setEvidenceUrl("");
      setFile(null);
      event.currentTarget.reset();
    }
  };

  return (
    <TerminalPanel title="今日推荐任务" code="MISSION / EXECUTION" className="mission-panel">
      <div className="mission-panel__status">
        <span>
          <StatusDot tone={runtimeLive ? "green" : "gold"} />
          <b>{runtimeLive ? "D1 ACTIVE" : "DEGRADED"}</b>
        </span>
        <StatusBadge
          tone={mission.risk === "LOW" ? "green" : mission.risk === "MEDIUM" ? "gold" : "red"}
        >
          {mission.risk} RISK
        </StatusBadge>
      </div>
      <h3>{mission.title}</h3>
      <div className="mission-panel__tags">
        <span>{mission.category}</span>
        <span>{mission.platform}</span>
        <span>{mission.minutes} MIN</span>
      </div>
      <div className="mission-panel__rewards">
        <div>
          <small>STABLE ENTITLEMENT</small>
          <strong>{formatUsd(mission.stableReward)}</strong>
        </div>
        <div>
          <small>AP REWARD</small>
          <strong>+{formatInteger(mission.apReward)}</strong>
        </div>
        <div>
          <small>SHORE RIGHTS</small>
          <strong>+{formatInteger(mission.shoreRights)}</strong>
        </div>
      </div>
      <div className="mission-panel__verification">
        <ProofIcon />
        <span>
          <small>VERIFICATION</small>
          <strong>{mission.verification}</strong>
        </span>
      </div>

      {execution ? (
        <div className={`mission-runtime mission-runtime--${execution.status}`}>
          <div>
            <small>EXECUTION STATUS</small>
            <StatusBadge tone={executionCopy[execution.status].tone}>
              {executionCopy[execution.status].label}
            </StatusBadge>
          </div>
          <p>{executionCopy[execution.status].detail}</p>
          {execution.proof?.reviewReason ? <em>REVIEW: {execution.proof.reviewReason}</em> : null}
        </div>
      ) : null}

      {!execution ? (
        <button
          type="button"
          className="terminal-primary-action"
          disabled={!runtimeLive || busy}
          onClick={() => void onStart()}
        >
          <ActionIcon />
          <span>{runtimeLive ? "开始真实任务" : "等待D1运行时"}</span>
        </button>
      ) : null}

      {canSubmitProof ? (
        <form className="proof-form" onSubmit={(event) => void submitProofForm(event)}>
          <label>
            <span>HTTPS PROOF URL</span>
            <input
              type="url"
              inputMode="url"
              placeholder="https://..."
              value={evidenceUrl}
              onChange={(event) => setEvidenceUrl(event.target.value)}
            />
          </label>
          <label>
            <span>PRIVATE IMAGE · PNG/JPEG/WEBP · MAX 5 MiB</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <label>
            <span>EXPERIENCE NOTE · 20–2000 CHARACTERS</span>
            <textarea
              required
              minLength={20}
              maxLength={2000}
              rows={4}
              placeholder="描述完成步骤、真实体验和可验证结果…"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
          <button
            type="submit"
            className="terminal-primary-action"
            disabled={busy || (!evidenceUrl.trim() && !file)}
          >
            <ProofIcon />
            <span>提交私有Proof</span>
          </button>
        </form>
      ) : null}

      <p className="terminal-demo-note">
        提交不等于发奖；规则检查后仍需人工批准，稳定奖励仅生成待支付资格。
      </p>
    </TerminalPanel>
  );
}

export function NextRoundPanel({ round }: { round: RoundDefinition }) {
  const overall = Math.min(
    round.priceProgress,
    round.actionProgress,
    round.revenueProgress,
    round.liquidityProgress,
  );

  return (
    <TerminalPanel title="下一轮解锁" code="NEXT ROUND / MULTI GATE" className="next-round-panel">
      <div className="next-round-panel__headline">
        <span className="next-round-panel__round">
          <RoundIcon />
          {formatRound(round.round)}
        </span>
        <span>
          <small>OVERALL</small>
          <strong>{formatPercent(overall)}</strong>
        </span>
      </div>
      <div className="next-round-panel__target">
        <span>目标价格</span>
        <strong>{formatUsd(round.targetPrice)}</strong>
      </div>
      <GateProgress label="PRICE / 价格" value={round.priceProgress} />
      <GateProgress label="ACTIONS / 有效行动" value={round.actionProgress} />
      <GateProgress label="REVENUE / 协议收入" value={round.revenueProgress} />
      <GateProgress label="LIQUIDITY / 流动性" value={round.liquidityProgress} />
      <div className="next-round-panel__footer">
        <span>解锁取最弱条件</span>
        <StatusBadge tone={overall >= 100 ? "green" : "gold"}>
          {overall >= 100 ? "READY" : "TRACKING"}
        </StatusBadge>
      </div>
    </TerminalPanel>
  );
}

const claimStatusCopy: Record<ClaimReadiness["status"], string> = {
  wallet_required: "先连接并验证TON钱包",
  entitlement_required: "暂无可领取权益",
  contract_not_configured: "Testnet领取合约未配置",
  ready_testnet: "准备Testnet领取意图",
  mainnet_disabled: "主网领取已禁用",
};

export function ClaimPanel({
  dashboard,
  claimReadiness,
  verifiedWallet,
  walletButton,
  runtimeStatus,
  onPrepareClaim,
}: {
  dashboard: TerminalDashboard;
  claimReadiness: ClaimReadiness | null;
  verifiedWallet: VerifiedWallet | null;
  walletButton: ReactNode;
  runtimeStatus: RuntimeStatus;
  onPrepareClaim: () => Promise<unknown>;
}) {
  const ready = claimReadiness?.status === "ready_testnet";
  const busy = runtimeStatus === "mutating" || runtimeStatus === "loading";

  return (
    <TerminalPanel title="SHORE领取" code="CLAIM / ENTITLEMENT" className="claim-panel">
      <div className="claim-panel__amount">
        <small>CLAIMABLE FROM D1</small>
        <strong>{formatInteger(dashboard.shoreClaimable)}</strong>
        <span>SHORE</span>
      </div>
      <div className="claim-panel__checks">
        <span>
          <CheckIcon />
          <b>ENTITLEMENT</b>
          <small>{dashboard.shoreClaimable > 0 ? "CLAIMABLE" : "MISSING"}</small>
        </span>
        <span>
          <CheckIcon />
          <b>NETWORK</b>
          <small>TESTNET ONLY</small>
        </span>
        <span>
          <WalletIcon />
          <b>TON PROOF</b>
          <small>{verifiedWallet ? "VERIFIED" : "REQUIRED"}</small>
        </span>
      </div>

      {!verifiedWallet ? walletButton : null}
      {verifiedWallet ? (
        <button
          type="button"
          className="terminal-primary-action terminal-primary-action--gold"
          disabled={!ready || busy}
          onClick={() => void onPrepareClaim()}
        >
          <WalletIcon />
          <span>{claimReadiness ? claimStatusCopy[claimReadiness.status] : "读取领取状态"}</span>
        </button>
      ) : null}
      <p className="terminal-demo-note">
        {claimReadiness?.reason ?? "领取前必须完成D1权益检查、TON地址所有权验证和Testnet合约配置。"}
      </p>
    </TerminalPanel>
  );
}

export function ActivityLog({ dashboard }: { dashboard: TerminalDashboard }) {
  return (
    <TerminalPanel title="活动日志" code="AUDIT / LIVE EVENTS" className="activity-panel">
      <div className="activity-list">
        {dashboard.activity.length === 0 ? (
          <p className="terminal-empty-state">暂无D1审计事件。</p>
        ) : (
          dashboard.activity.map((event) => (
            <div className="activity-row" key={event.id}>
              <span className={`activity-row__icon activity-row__icon--${event.status}`}>
                {event.type === "proof" ? (
                  <ProofIcon />
                ) : event.type === "reward" ? (
                  <ShoreIcon />
                ) : event.type === "round" ? (
                  <RoundIcon />
                ) : event.type === "task" ? (
                  <ActionIcon />
                ) : (
                  <ActivityIcon />
                )}
              </span>
              <span className="activity-row__copy">
                <small>{event.time}</small>
                <strong>{event.title}</strong>
                <em>{event.detail}</em>
              </span>
            </div>
          ))
        )}
      </div>
    </TerminalPanel>
  );
}

export function MobileSummary({ dashboard }: { dashboard: TerminalDashboard }) {
  return (
    <section className="mobile-summary">
      <span>DEBT REMAINING</span>
      <strong>{formatCny(dashboard.debtRemaining)}</strong>
      <div>
        <span>已覆盖 {formatCny(dashboard.debtCovered)}</span>
        <span className="terminal-positive">完成 {formatPercent(dashboard.coveragePercent)}</span>
      </div>
    </section>
  );
}
