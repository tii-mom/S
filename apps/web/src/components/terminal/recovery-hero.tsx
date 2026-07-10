import { formatCny, formatInteger, formatPercent } from "@/lib/shore-terminal/formatters";
import type { TerminalDashboard } from "@/lib/shore-terminal/types";

import { MetricCell, StatusBadge } from "./terminal-primitives";

export function RecoveryHero({ dashboard }: { dashboard: TerminalDashboard }) {
  return (
    <section className="recovery-hero">
      <div className="recovery-hero__primary">
        <div className="recovery-hero__label-row">
          <span>DEBT REMAINING / 剩余负债</span>
          <StatusBadge tone="gold">STAGING DATA</StatusBadge>
        </div>
        <strong className="recovery-hero__amount">{formatCny(dashboard.debtRemaining)}</strong>
        <div className="recovery-hero__subline">
          <span>原始目标 {formatCny(dashboard.debtOriginal)}</span>
          <span className="terminal-positive">已覆盖 {formatCny(dashboard.debtCovered)}</span>
          <span>完成 {formatPercent(dashboard.coveragePercent)}</span>
        </div>
        <div
          className="recovery-hero__progress"
          aria-label={`上岸进度 ${dashboard.coveragePercent}%`}
        >
          <span style={{ width: `${dashboard.coveragePercent}%` }} />
        </div>
      </div>

      <div className="recovery-hero__metrics">
        <MetricCell
          label="TODAY ACTION INCOME"
          value={formatCny(dashboard.todayActionIncome)}
          delta="+1 VERIFIED"
          tone="green"
        />
        <MetricCell
          label="AP BALANCE"
          value={formatInteger(dashboard.apBalance)}
          delta="+300 TODAY"
          tone="gold"
        />
        <MetricCell
          label="SHORE RIGHTS"
          value={formatInteger(dashboard.shoreBalance + dashboard.shoreClaimable)}
          delta={`${formatInteger(dashboard.shoreClaimable)} CLAIMABLE`}
          tone="gold"
        />
        <MetricCell
          label="PENDING PROOFS"
          value={String(dashboard.pendingProofs).padStart(2, "0")}
          delta="AI REVIEW"
          tone="default"
        />
      </div>
    </section>
  );
}
