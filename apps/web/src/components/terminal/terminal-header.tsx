import { formatCny, formatInteger } from "@/lib/shore-terminal/formatters";
import type { TerminalDashboard } from "@/lib/shore-terminal/types";

import { RadioIcon, TerminalMark, WalletIcon } from "./terminal-icons";
import { StatusDot } from "./terminal-primitives";

export function TerminalHeader({ dashboard }: { dashboard: TerminalDashboard }) {
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
            <StatusDot />
            <b>AI VERIFY</b>
            <small>ONLINE</small>
          </span>
          <span>
            <StatusDot />
            <b>TASK NET</b>
            <small>LIVE</small>
          </span>
          <span>
            <StatusDot tone="gold" />
            <b>TON</b>
            <small>TESTNET</small>
          </span>
          <span>
            <StatusDot />
            <b>RISK</b>
            <small>NORMAL</small>
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
          <button type="button" className="wallet-button" aria-label="连接TON钱包">
            <WalletIcon />
            <span>CONNECT</span>
          </button>
        </div>
      </header>

      <div className="terminal-mobile-header">
        <div className="terminal-brand">
          <span className="terminal-brand__mark">
            <TerminalMark />
          </span>
          <span className="terminal-brand__copy">
            <strong>SHORE.TERMINAL</strong>
            <small>STAGING · DEMO DATA</small>
          </span>
        </div>
        <button
          type="button"
          className="wallet-button wallet-button--compact"
          aria-label="连接TON钱包"
        >
          <WalletIcon />
        </button>
      </div>

      <div className="terminal-mobile-status">
        <span>
          <RadioIcon /> AI ONLINE
        </span>
        <span>R{String(dashboard.currentRound).padStart(2, "0")}</span>
        <span>TON TESTNET</span>
      </div>
    </>
  );
}
