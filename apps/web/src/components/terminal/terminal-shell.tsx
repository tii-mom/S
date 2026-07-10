"use client";

import { useMemo, useState } from "react";

import { useShoreRuntime } from "@/lib/shore-runtime/use-shore-runtime";
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
import { TonWalletButton, useTonWalletBridge } from "./ton-wallet-control";

const mobileTabs = [
  { id: "overview" as const, label: "概览", icon: DebtIcon },
  { id: "mission" as const, label: "任务", icon: ActionIcon },
  { id: "rounds" as const, label: "18轮", icon: RoundIcon },
  { id: "activity" as const, label: "动态", icon: ActivityIcon },
];

export function TerminalShell() {
  const runtime = useShoreRuntime();
  const dashboard = runtime.dashboard;
  const [accountView, setAccountView] = useState<AccountView>("recovery");
  const [chartMode, setChartMode] = useState<ChartMode>("recovery");
  const [selectedRound, setSelectedRound] = useState(dashboard.currentRound);
  const [mobileSection, setMobileSection] = useState<MobileSection>("overview");

  const selectedRoundData = useMemo(
    () =>
      dashboard.rounds.find((round) => round.round === selectedRound) ??
      dashboard.rounds.find((round) => round.status === "active") ??
      dashboard.rounds[0]!,
    [dashboard.rounds, selectedRound],
  );

  const walletBridge = useTonWalletBridge({
    verifiedWallet: runtime.rawDashboard?.wallet ?? null,
    disabled: !runtime.isLive,
    issueNonce: runtime.issueTonProofNonce,
    bindWallet: runtime.bindTonWallet,
  });

  const missionPanel = (
    <MissionExecutionPanel
      dashboard={dashboard}
      execution={runtime.rawDashboard?.execution ?? null}
      runtimeStatus={runtime.status}
      runtimeLive={runtime.isLive}
      onStart={runtime.startCurrentMission}
      onSubmitProof={runtime.submitCurrentProof}
    />
  );

  const claimPanel = (
    <ClaimPanel
      dashboard={dashboard}
      claimReadiness={runtime.rawDashboard?.claimReadiness ?? null}
      verifiedWallet={runtime.rawDashboard?.wallet ?? null}
      walletButton={
        <TonWalletButton
          bridge={walletBridge}
          className="terminal-primary-action terminal-primary-action--gold claim-wallet-button"
        />
      }
      runtimeStatus={runtime.status}
      onPrepareClaim={runtime.prepareClaim}
    />
  );

  return (
    <div className="shore-terminal">
      <div className="terminal-grid-bg" aria-hidden="true" />
      <div className="terminal-scanline" aria-hidden="true" />

      <TerminalHeader
        dashboard={dashboard}
        runtimeLive={runtime.isLive}
        desktopWalletControl={<TonWalletButton bridge={walletBridge} />}
        mobileWalletControl={<TonWalletButton bridge={walletBridge} compact />}
      />
      <TickerTape dashboard={dashboard} />

      {runtime.notice ? (
        <div className={`runtime-notice runtime-notice--${runtime.notice.tone}`} role="status">
          <span>{runtime.notice.message}</span>
          <button type="button" onClick={runtime.clearNotice} aria-label="关闭运行时提示">
            ×
          </button>
        </div>
      ) : null}

      <div className="terminal-mobile-summary-wrap">
        <MobileSummary dashboard={dashboard} />
        <div className="mobile-kpi-strip">
          <span>
            <small>任务状态</small>
            <strong>{runtime.rawDashboard?.execution ? "01" : "00"}</strong>
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
            {missionPanel}
            <NextRoundPanel round={selectedRoundData} />
            {claimPanel}
          </div>

          <div
            className={`terminal-mobile-section terminal-mobile-only${mobileSection === "activity" ? " terminal-mobile-section--active" : ""}`}
          >
            <ActivityLog dashboard={dashboard} />
          </div>
        </section>

        <aside className="execution-rail" aria-label="执行控制栏">
          {missionPanel}
          <NextRoundPanel round={selectedRoundData} />
          {claimPanel}
          <ActivityLog dashboard={dashboard} />
        </aside>
      </main>

      <footer className="terminal-footer">
        <span>
          <i className="terminal-pulse" /> SHORE SYSTEM {runtime.isLive ? "ONLINE" : "DEGRADED"}
        </span>
        <span>ENV STAGING</span>
        <span>API {runtime.isLive ? "D1 LIVE" : "FALLBACK"}</span>
        <span>TON TESTNET</span>
        <strong>BUILD PHASE 4–6</strong>
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
          {runtime.rawDashboard?.execution ? "查看任务" : "开始任务"}
          <ChevronIcon />
        </button>
      </div>
    </div>
  );
}
