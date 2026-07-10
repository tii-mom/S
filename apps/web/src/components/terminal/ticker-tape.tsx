import { formatCompact, formatUsd } from "@/lib/shore-terminal/formatters";
import type { TerminalDashboard } from "@/lib/shore-terminal/types";

const labels = {
  shore: "SHORE/USDT",
  ton: "TON/USDT",
  tasks: "VERIFIED ACTIONS",
  budget: "ADVERTISER BUDGET",
  revenue: "PROTOCOL REVENUE",
  round: "CURRENT ROUND",
} as const;

export function TickerTape({ dashboard }: { dashboard: TerminalDashboard }) {
  const items = [
    { label: labels.shore, value: formatUsd(dashboard.shorePrice), delta: "+8.4%", tone: "up" },
    { label: labels.ton, value: formatUsd(dashboard.tonPrice), delta: "+1.7%", tone: "up" },
    {
      label: labels.tasks,
      value: formatCompact(dashboard.networkActions),
      delta: "+2.1K",
      tone: "up",
    },
    {
      label: labels.budget,
      value: formatUsd(dashboard.advertiserBudget),
      delta: "STAGING",
      tone: "neutral",
    },
    {
      label: labels.revenue,
      value: formatUsd(dashboard.protocolRevenue),
      delta: "+4.6%",
      tone: "up",
    },
    {
      label: labels.round,
      value: `R${String(dashboard.currentRound).padStart(2, "0")}`,
      delta: "ACTIVE",
      tone: "gold",
    },
  ] as const;

  return (
    <div className="ticker-tape" aria-label="上岸网络状态">
      <div className="ticker-tape__track">
        {[...items, ...items].map((item, index) => (
          <span className="ticker-item" key={`${item.label}-${index}`}>
            <b>{item.label}</b>
            <strong>{item.value}</strong>
            <small className={`ticker-item__delta ticker-item__delta--${item.tone}`}>
              {item.delta}
            </small>
          </span>
        ))}
      </div>
      <span className="ticker-demo">DEMO DATA</span>
    </div>
  );
}
