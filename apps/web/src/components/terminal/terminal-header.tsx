import type { ReactNode } from "react";

import { formatCny, formatInteger } from "@/lib/shore-terminal/formatters";
import type { TerminalDashboard } from "@/lib/shore-terminal/types";

import { RadioIcon, TerminalMark } from "./terminal-icons";
import { StatusDot } from "./terminal-primitives";

export function TerminalHeader({
  dashboard,
  desktopWalletControl,
  mobileWalletControl,
  runtimeLive,
}: {
  dashboard: TerminalDashboard;
  desktopWalletControl: ReactNode;
  mobileWalletControl: ReactNode;
  runtimeLive: boolean;
}) {
  return (
    <>
      <header className="terminal-header">
        <div className="terminal-brand">
          <span className="terminal-brand__mark">
            <TerminalMark />
          </span>
          <span className="terminal-brand__copy">
            <strong>SHORE.TERMINAL</strong>
            <small>上岸执行终端</small>
          </span>
        </div>

        <div className="terminal-status-cluster" aria-label="系统状态">
          <span>
            <StatusDot tone={runtimeLive ? "green" : "gold"} />
            <b>D1 RUNTIME</b>
            <small>{runtimeLive ? "LIVE" : "DEGRADED"}</small>
          </span>
          <span>
            <StatusDot tone={runtimeLive ? "green" : "gold"} />
            <b>PROOF QUEUE</b>
            <small>{runtimeLive ? "READY" : "OFFLINE"}</small>
          </span>
          <span>
            <StatusDot tone="gold" />
            <b>TON</b>
            <small>TESTNET</small>
          </span>
          <span>
            <StatusDot />
            <b>RISK</b>
            <small>FAIL-CLOSED</small>
          </span>
        </div>

        <div className="terminal-account-summary">
          <span>
            <small>DEBT REMAINING</small>
            <strong>{formatCny(dashboard.debtRemaining)}</strong>
          </span>
          <span>
            <small>CLAIMABLE SHORE</small>
            <strong>{formatInteger(dashboard.shoreClaimable)}</strong>
          </span>
          {desktopWalletControl}
        </div>
      </header>

      <div className="terminal-mobile-header">
        <div className="terminal-brand">
          <span className="terminal-brand__mark">
            <TerminalMark />
          </span>
          <span className="terminal-brand__copy">
            <strong>SHORE.TERMINAL</strong>
            <small>{runtimeLive ? "STAGING · D1 LIVE" : "STAGING · DEGRADED DATA"}</small>
          </span>
        </div>
        {mobileWalletControl}
      </div>

      <div className="terminal-mobile-status">
        <span>
          <RadioIcon /> {runtimeLive ? "D1 LIVE" : "DEGRADED"}
        </span>
        <span>R{String(dashboard.currentRound).padStart(2, "0")}</span>
        <span>TON TESTNET</span>
      </div>
    </>
  );
}
