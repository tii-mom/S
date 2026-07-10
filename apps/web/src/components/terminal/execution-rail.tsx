import {
  formatCny,
  formatInteger,
  formatPercent,
  formatRound,
  formatUsd,
} from "@/lib/shore-terminal/formatters";
import type { RoundDefinition, TerminalDashboard } from "@/lib/shore-terminal/types";

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

export function MissionExecutionPanel({ dashboard }: { dashboard: TerminalDashboard }) {
  const mission = dashboard.mission;
  return (
    <TerminalPanel title="今日推荐任务" code="MISSION / EXECUTION" className="mission-panel">
      <div className="mission-panel__status">
        <span>
          <StatusDot />
          <b>AVAILABLE</b>
        </span>
        <StatusBadge tone="green">{mission.risk} RISK</StatusBadge>
      </div>
      <h3>{mission.title}</h3>
      <div className="mission-panel__tags">
        <span>{mission.category}</span>
        <span>{mission.platform}</span>
        <span>{mission.minutes} MIN</span>
      </div>
      <div className="mission-panel__rewards">
        <div>
          <small>STABLE REWARD</small>
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
      <button type="button" className="terminal-primary-action">
        <ActionIcon />
        <span>开始任务</span>
      </button>
      <p className="terminal-demo-note">Phase 4 接入真实任务与Proof流程</p>
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

export function ClaimPanel({ dashboard }: { dashboard: TerminalDashboard }) {
  return (
    <TerminalPanel title="SHORE领取" code="CLAIM / ENTITLEMENT" className="claim-panel">
      <div className="claim-panel__amount">
        <small>CLAIMABLE</small>
        <strong>{formatInteger(dashboard.shoreClaimable)}</strong>
        <span>SHORE</span>
      </div>
      <div className="claim-panel__checks">
        <span>
          <CheckIcon />
          <b>ROUND GATE</b>
          <small>QUALIFIED</small>
        </span>
        <span>
          <CheckIcon />
          <b>PERSONAL ACTION</b>
          <small>COMPLETED</small>
        </span>
        <span>
          <WalletIcon />
          <b>WALLET</b>
          <small>NOT CONNECTED</small>
        </span>
      </div>
      <button type="button" className="terminal-primary-action terminal-primary-action--gold">
        <WalletIcon />
        <span>连接钱包</span>
      </button>
      <p className="terminal-demo-note">TON Connect 与真实领取将在视觉验收后接入</p>
    </TerminalPanel>
  );
}

export function ActivityLog({ dashboard }: { dashboard: TerminalDashboard }) {
  return (
    <TerminalPanel title="活动日志" code="AUDIT / LIVE EVENTS" className="activity-panel">
      <div className="activity-list">
        {dashboard.activity.map((event) => (
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
        ))}
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
