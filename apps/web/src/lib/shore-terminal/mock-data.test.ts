import { describe, expect, it } from "vitest";

import { terminalDashboard } from "./mock-data";

function minimumGate(round: (typeof terminalDashboard.rounds)[number]) {
  return Math.min(
    round.priceProgress,
    round.actionProgress,
    round.revenueProgress,
    round.liquidityProgress,
  );
}

describe("terminal dashboard mock model", () => {
  it("keeps debt arithmetic internally consistent", () => {
    expect(terminalDashboard.debtOriginal - terminalDashboard.debtCovered).toBe(
      terminalDashboard.debtRemaining,
    );
    expect(terminalDashboard.coveragePercent).toBeCloseTo(
      (terminalDashboard.debtCovered / terminalDashboard.debtOriginal) * 100,
      1,
    );
  });

  it("defines all eighteen rounds with one active round", () => {
    expect(terminalDashboard.rounds).toHaveLength(18);
    expect(terminalDashboard.rounds.filter((round) => round.status === "active")).toHaveLength(1);
    expect(terminalDashboard.rounds.find((round) => round.status === "active")?.round).toBe(4);
  });

  it("derives the current round from the weakest unlock gate", () => {
    const currentRound = terminalDashboard.rounds[3]!;
    expect(minimumGate(currentRound)).toBe(54);
  });
});
