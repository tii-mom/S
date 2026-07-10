import type { DashboardResponse } from "@shore/shared";

import { terminalDashboard } from "@/lib/shore-terminal/mock-data";
import type {
  ActivityEvent,
  RecoverySnapshot,
  TerminalDashboard,
} from "@/lib/shore-terminal/types";

function buildRecoverySeries(
  original: number,
  covered: number,
  verifiedActions: number,
): RecoverySnapshot[] {
  const pointCount = 20;
  return Array.from({ length: pointCount }, (_, index) => {
    const progress = index / (pointCount - 1);
    const eased = progress ** 1.18;
    const coveredValue = Math.round(covered * eased);
    const actionFactor = Math.min(0.92, 0.58 + verifiedActions * 0.006 + progress * 0.08);
    return {
      label: `W${index + 1}`,
      debtRemaining: Math.max(0, original - coveredValue),
      coveredValue,
      verifiedActionValue: Math.round(coveredValue * actionFactor),
    };
  });
}

function inferActivityType(eventType: string): ActivityEvent["type"] {
  if (eventType.includes("proof")) return "proof";
  if (eventType.includes("mission")) return "task";
  if (eventType.includes("reward") || eventType.includes("entitlement")) return "reward";
  if (eventType.includes("round") || eventType.includes("claim")) return "round";
  return "system";
}

function formatEventTime(createdAt: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(createdAt));
}

export function mapD1Dashboard(input: DashboardResponse): TerminalDashboard {
  const debtOriginal = input.debt.originalMinor / 100;
  const debtCovered = input.debt.coveredMinor / 100;
  const debtRemaining = input.debt.remainingMinor / 100;
  const currentRound = input.rounds.find((round) => round.status === "active")?.round ?? 1;
  const completedRounds = input.rounds.filter((round) => round.status === "completed").length;

  return {
    debtOriginal,
    debtCovered,
    debtRemaining,
    coveragePercent: input.debt.coverageBasisPoints / 100,
    monthlyActionIncome: 0,
    todayActionIncome: 0,
    apBalance: input.balances.ap,
    shoreBalance: input.balances.shoreClaimed,
    shoreClaimable: Math.max(input.balances.shoreClaimable, input.claimReadiness.claimableAmount),
    shoreLocked: input.balances.shoreLocked,
    currentRound,
    completedRounds,
    verifiedActions: input.counts.verifiedActions,
    pendingProofs: input.counts.pendingProofs,
    streakDays: terminalDashboard.streakDays,
    protocolRevenue: terminalDashboard.protocolRevenue,
    networkActions: terminalDashboard.networkActions,
    advertiserBudget: terminalDashboard.advertiserBudget,
    shorePrice: terminalDashboard.shorePrice,
    tonPrice: terminalDashboard.tonPrice,
    recoverySeries: buildRecoverySeries(debtOriginal, debtCovered, input.counts.verifiedActions),
    rounds: input.rounds.map((round) => ({
      round: round.round,
      targetPrice: Number(round.targetPriceDecimal),
      requiredActions: round.requiredActions,
      requiredRevenue: round.requiredRevenueMinor / 100,
      personalRequirement: round.personalRequirement,
      releaseAmount: round.releaseAmount,
      priceProgress: round.priceProgress,
      actionProgress: round.actionProgress,
      revenueProgress: round.revenueProgress,
      liquidityProgress: round.liquidityProgress,
      status: round.status,
    })),
    mission: {
      id: input.mission.id,
      title: input.mission.title,
      category: input.mission.category,
      platform: input.mission.platform,
      minutes: input.mission.estimatedMinutes,
      stableReward: input.mission.stableRewardMinor / 100,
      apReward: input.mission.apReward,
      shoreRights: input.mission.shoreRightsReward,
      risk: input.mission.riskLevel.toUpperCase() as "LOW" | "MEDIUM" | "HIGH",
      verification: input.mission.verificationMethod,
    },
    activity: input.activities.map((event) => ({
      id: event.id,
      time: formatEventTime(event.createdAt),
      type: inferActivityType(event.eventType),
      title: event.title,
      detail: event.detail,
      status: event.status,
    })),
  };
}
