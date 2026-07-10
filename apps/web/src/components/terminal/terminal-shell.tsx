"use client";

import { useMemo, useState } from "react";

import { terminalDashboard } from "@/lib/shore-terminal/mock-data";
import type { AccountView, ChartMode, MobileSection } from "@/lib/shore-terminal/types";

import { AccountRail } from "./account-rail";
import {
  ActivityLog,
  ClaimPanel,
  MissionExecutionPanel,
  MobileSummary,
  NextRoundPanel,
} from "./execution-rail";
import { RecoveryChart } from "./recovery-chart";
import { RecoveryHero } from "./recovery-hero";
import { RoundSchedule } from "./round-schedule";
import { TickerTape } from "./ticker-tape";
import { TerminalHeader } from "./terminal-header";
import { ActivityIcon, ActionIcon, ChevronIcon, DebtIcon, RoundIcon } from "./terminal-icons";

const mobileTabs = [
  { id: "overview" as const, label: "概览", icon: DebtIcon },
  { id: "mission" as const, label: "任务", icon: ActionIcon },
  { id: "rounds" as const, label: "18轮", icon: RoundIcon },
  { id: "activity" as const, label: "动态", icon: ActivityIcon },
];

export function TerminalShell() {
  const dashboard = terminalDashboard;
  const [accountView, setAccountView] = useState<AccountView>("recovery");
  const [chartMode, setChartMode] = useState<ChartMode>("recovery");
  const [selectedRound, setSelectedRound] = useState(dashboard.currentRound);
  const [mobileSection, setMobileSection] = useState<MobileSection>("overview");

  const selectedRoundData = useMemo(
    () => dashboard.rounds.find((round) => round.round === selectedRound) ?? dashboard.rounds[3]!,
    [dashboard.rounds, selectedRound],
  );

  return (
    <div className="shore-terminal">
      <div className="terminal-grid-bg" aria-hidden="true" />
      <div className="terminal-scanline" aria-hidden="true" />

      <TerminalHeader dashboard={dashboard} />
      <TickerTape dashboard={dashboard} />

      <div className="terminal-mobile-summary-wrap">
        <MobileSummary dashboard={dashboard} />
        <div className="mobile-kpi-strip">
          <span>
            <small>今日任务</small>
            <strong>01</strong>
          </span>
          <span>
            <small>待领取</small>
            <strong>{dashboard.shoreClaimable / 1000}K</strong>
          </span>
          <span>
            <small>当前轮次</small>
            <strong>R{String(dashboard.currentRound).padStart(2, "0")}</strong>
          </span>
        </div>
      </div>

      <div className="terminal-mobile-tabs" role="tablist" aria-label="移动端区域">
        {mobileTabs.map((tab) => {
          const Icon = tab.icon;
          const active = mobileSection === tab.id;
          return (
            <button
              type="button"
              role="tab"
              aria-selected={active}
              key={tab.id}
              onClick={() => setMobileSection(tab.id)}
            >
              <Icon />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <main className="terminal-layout">
        <AccountRail dashboard={dashboard} active={accountView} onChange={setAccountView} />

        <section className="terminal-workspace">
          <div
            className={`terminal-mobile-section${mobileSection === "overview" ? " terminal-mobile-section--active" : ""}`}
          >
            <RecoveryHero dashboard={dashboard} />
            <RecoveryChart
              mode={chartMode}
              onModeChange={setChartMode}
              recoverySeries={dashboard.recoverySeries}
              rounds={dashboard.rounds}
            />
          </div>

          <div
            className={`terminal-mobile-section${mobileSection === "rounds" ? " terminal-mobile-section--active" : ""}`}
          >
            <RoundSchedule
              rounds={dashboard.rounds}
              selectedRound={selectedRound}
              onSelectRound={setSelectedRound}
            />
          </div>

          <div
            className={`terminal-mobile-section terminal-mobile-only${mobileSection === "mission" ? " terminal-mobile-section--active" : ""}`}
          >
            <MissionExecutionPanel dashboard={dashboard} />
            <NextRoundPanel round={selectedRoundData} />
            <ClaimPanel dashboard={dashboard} />
          </div>

          <div
            className={`terminal-mobile-section terminal-mobile-only${mobileSection === "activity" ? " terminal-mobile-section--active" : ""}`}
          >
            <ActivityLog dashboard={dashboard} />
          </div>
        </section>

        <aside className="execution-rail" aria-label="执行控制栏">
          <MissionExecutionPanel dashboard={dashboard} />
          <NextRoundPanel round={selectedRoundData} />
          <ClaimPanel dashboard={dashboard} />
          <ActivityLog dashboard={dashboard} />
        </aside>
      </main>

      <footer className="terminal-footer">
        <span>
          <i className="terminal-pulse" /> SHORE SYSTEM ONLINE
        </span>
        <span>ENV STAGING</span>
        <span>API MOCK</span>
        <span>TON TESTNET</span>
        <strong>BUILD PHASE 0–3</strong>
      </footer>

      <div className="mobile-action-bar">
        <div>
          <small>NEXT ROUND</small>
          <strong>R{String(selectedRoundData.round).padStart(2, "0")}</strong>
          <span>
            {Math.min(
              selectedRoundData.priceProgress,
              selectedRoundData.actionProgress,
              selectedRoundData.revenueProgress,
              selectedRoundData.liquidityProgress,
            )}
            %
          </span>
        </div>
        <button type="button" onClick={() => setMobileSection("mission")}>
          开始任务
          <ChevronIcon />
        </button>
      </div>
    </div>
  );
}
