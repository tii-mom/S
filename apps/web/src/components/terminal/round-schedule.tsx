"use client";

import {
  formatCompact,
  formatInteger,
  formatRound,
  formatUsd,
} from "@/lib/shore-terminal/formatters";
import type { RoundDefinition, RoundStatus } from "@/lib/shore-terminal/types";

import { CheckIcon, ChevronIcon, LockIcon } from "./terminal-icons";
import { StatusBadge } from "./terminal-primitives";

const statusLabel: Record<RoundStatus, string> = {
  completed: "COMPLETED",
  claimable: "CLAIMABLE",
  qualified: "QUALIFIED",
  active: "ACTIVE",
  locked: "LOCKED",
};

const statusTone: Record<RoundStatus, "green" | "gold" | "blue" | "muted"> = {
  completed: "green",
  claimable: "gold",
  qualified: "blue",
  active: "gold",
  locked: "muted",
};

function overallProgress(round: RoundDefinition) {
  return Math.min(
    round.priceProgress,
    round.actionProgress,
    round.revenueProgress,
    round.liquidityProgress,
  );
}

export function RoundSchedule({
  rounds,
  selectedRound,
  onSelectRound,
}: {
  rounds: RoundDefinition[];
  selectedRound: number;
  onSelectRound: (round: number) => void;
}) {
  return (
    <section className="round-schedule" aria-label="SHORE十八轮计划">
      <header className="round-schedule__header">
        <div>
          <span>ROUND MATRIX / 18 STAGE RELEASE</span>
          <h2>SHORE 18轮计划表</h2>
        </div>
        <small>ALL VALUES · DEMO</small>
      </header>

      <div className="round-table" role="table" aria-label="十八轮解锁计划">
        <div className="round-table__head" role="row">
          <span role="columnheader">轮次</span>
          <span role="columnheader">目标价</span>
          <span role="columnheader">有效行动</span>
          <span role="columnheader">协议收入</span>
          <span role="columnheader">个人要求</span>
          <span role="columnheader">本轮释放</span>
          <span role="columnheader">状态</span>
          <span role="columnheader" aria-label="操作" />
        </div>

        <div className="round-table__body">
          {rounds.map((round) => {
            const selected = selectedRound === round.round;
            const progress = overallProgress(round);
            return (
              <button
                type="button"
                role="row"
                key={round.round}
                className={`round-row${selected ? " round-row--selected" : ""}`}
                aria-pressed={selected}
                onClick={() => onSelectRound(round.round)}
              >
                <span role="cell" className="round-row__round">
                  <i>
                    {round.status === "completed" ? (
                      <CheckIcon />
                    ) : round.status === "locked" ? (
                      <LockIcon />
                    ) : (
                      progress
                    )}
                  </i>
                  <strong>{formatRound(round.round)}</strong>
                </span>
                <span role="cell">
                  <strong>{formatUsd(round.targetPrice)}</strong>
                </span>
                <span role="cell">{formatCompact(round.requiredActions)}</span>
                <span role="cell">{formatUsd(round.requiredRevenue)}</span>
                <span role="cell">{round.personalRequirement}</span>
                <span role="cell">{formatInteger(round.releaseAmount)}</span>
                <span role="cell">
                  <StatusBadge tone={statusTone[round.status]}>
                    {statusLabel[round.status]}
                  </StatusBadge>
                </span>
                <span role="cell">
                  <ChevronIcon />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="round-card-list">
        {rounds.map((round) => {
          const selected = selectedRound === round.round;
          const progress = overallProgress(round);
          return (
            <button
              type="button"
              key={round.round}
              className={`round-card${selected ? " round-card--selected" : ""}`}
              aria-pressed={selected}
              onClick={() => onSelectRound(round.round)}
            >
              <span className="round-card__number">{formatRound(round.round)}</span>
              <span className="round-card__main">
                <small>TARGET PRICE</small>
                <strong>{formatUsd(round.targetPrice)}</strong>
                <em>{formatInteger(round.releaseAmount)} SHORE RELEASE</em>
              </span>
              <span className="round-card__status">
                <StatusBadge tone={statusTone[round.status]}>
                  {statusLabel[round.status]}
                </StatusBadge>
                <b>{progress}%</b>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
