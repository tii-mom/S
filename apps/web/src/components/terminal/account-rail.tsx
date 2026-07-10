import { formatCny, formatInteger } from "@/lib/shore-terminal/formatters";
import type { AccountView, TerminalDashboard } from "@/lib/shore-terminal/types";

import { ActionIcon, ChevronIcon, DebtIcon, ShoreIcon } from "./terminal-icons";
import { StatusBadge } from "./terminal-primitives";

const accountItems = [
  {
    id: "recovery" as const,
    label: "RECOVERY PLAN",
    title: "上岸计划",
    icon: DebtIcon,
  },
  {
    id: "actions" as const,
    label: "ACTION ACCOUNT",
    title: "行动账户",
    icon: ActionIcon,
  },
  {
    id: "shore" as const,
    label: "SHORE RIGHTS",
    title: "SHORE权益",
    icon: ShoreIcon,
  },
];

export function AccountRail({
  dashboard,
  active,
  onChange,
}: {
  dashboard: TerminalDashboard;
  active: AccountView;
  onChange: (view: AccountView) => void;
}) {
  const values: Record<AccountView, { main: string; secondary: string; status: string }> = {
    recovery: {
      main: formatCny(dashboard.debtRemaining),
      secondary: `${dashboard.coveragePercent}% covered`,
      status: "ACTIVE",
    },
    actions: {
      main: `${dashboard.verifiedActions} verified`,
      secondary: `${dashboard.pendingProofs} pending proof`,
      status: "LIVE",
    },
    shore: {
      main: formatInteger(dashboard.shoreBalance),
      secondary: `${formatInteger(dashboard.shoreClaimable)} claimable`,
      status: `R${String(dashboard.currentRound).padStart(2, "0")}`,
    },
  };

  return (
    <aside className="account-rail" aria-label="账户视图">
      <div className="account-rail__heading">
        <span>ACCOUNT DESKS</span>
        <small>03 ACTIVE</small>
      </div>

      <div className="account-rail__list">
        {accountItems.map((item) => {
          const Icon = item.icon;
          const selected = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`account-card${selected ? " account-card--active" : ""}`}
              aria-pressed={selected}
              onClick={() => onChange(item.id)}
            >
              <span className="account-card__icon">
                <Icon />
              </span>
              <span className="account-card__copy">
                <small>{item.label}</small>
                <strong>{item.title}</strong>
                <b>{values[item.id].main}</b>
                <em>{values[item.id].secondary}</em>
              </span>
              <span className="account-card__meta">
                <StatusBadge tone={item.id === "shore" ? "gold" : "green"}>
                  {values[item.id].status}
                </StatusBadge>
                <ChevronIcon />
              </span>
            </button>
          );
        })}
      </div>

      <div className="account-rail__summary">
        <div>
          <span>ORIGINAL DEBT</span>
          <strong>{formatCny(dashboard.debtOriginal)}</strong>
        </div>
        <div>
          <span>DEBT COVERED</span>
          <strong className="terminal-positive">{formatCny(dashboard.debtCovered)}</strong>
        </div>
        <div>
          <span>MONTH ACTION INCOME</span>
          <strong>{formatCny(dashboard.monthlyActionIncome)}</strong>
        </div>
        <div>
          <span>AP BALANCE</span>
          <strong>{formatInteger(dashboard.apBalance)}</strong>
        </div>
      </div>

      <div className="account-rail__footer">
        <span className="terminal-pulse" />
        <span>SESSION 7D STREAK</span>
        <strong>{dashboard.streakDays}D</strong>
      </div>
    </aside>
  );
}
