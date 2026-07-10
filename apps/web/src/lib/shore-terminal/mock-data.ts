import type { RoundDefinition, TerminalDashboard } from "./types";

const originalDebt = 186_420;
const recoverySeries = [
  0, 380, 820, 1_260, 1_920, 2_480, 3_060, 3_740, 4_360, 5_180, 5_960, 6_720, 7_480, 8_320, 9_180,
  10_060, 10_940, 11_620, 12_120, 12_680,
].map((coveredValue, index) => ({
  label: `W${index + 1}`,
  debtRemaining: originalDebt - coveredValue,
  coveredValue,
  verifiedActionValue: Math.round(coveredValue * (0.72 + index * 0.008)),
}));

function buildRounds(): RoundDefinition[] {
  return Array.from({ length: 18 }, (_, index) => {
    const round = index + 1;
    const status =
      round <= 3 ? "completed" : round === 4 ? "active" : round === 5 ? "qualified" : "locked";

    return {
      round,
      targetPrice: 0.00001 * 2 ** (round - 1),
      requiredActions: round * 25_000,
      requiredRevenue: round * 18_000,
      personalRequirement:
        round <= 4 ? "1 task / 300 AP" : `${Math.min(5, Math.ceil(round / 4))} tasks`,
      releaseAmount: round === 4 ? 150_000 : round <= 3 ? 150_000 : 120_000,
      priceProgress: round <= 3 ? 100 : round === 4 ? 82 : round === 5 ? 24 : 0,
      actionProgress: round <= 3 ? 100 : round === 4 ? 67 : round === 5 ? 18 : 0,
      revenueProgress: round <= 3 ? 100 : round === 4 ? 54 : round === 5 ? 12 : 0,
      liquidityProgress: round <= 3 ? 100 : round === 4 ? 91 : round === 5 ? 30 : 0,
      status,
    } satisfies RoundDefinition;
  });
}

export const terminalDashboard: TerminalDashboard = {
  debtOriginal: originalDebt,
  debtCovered: 12_680,
  debtRemaining: 173_740,
  coveragePercent: 6.8,
  monthlyActionIncome: 1_860,
  todayActionIncome: 48,
  apBalance: 3_420,
  shoreBalance: 100_000,
  shoreClaimable: 150_000,
  shoreLocked: 2_700_000,
  currentRound: 4,
  completedRounds: 3,
  verifiedActions: 27,
  pendingProofs: 2,
  streakDays: 7,
  protocolRevenue: 72_940,
  networkActions: 83_742,
  advertiserBudget: 428_500,
  shorePrice: 0.000064,
  tonPrice: 1.62,
  recoverySeries,
  rounds: buildRounds(),
  mission: {
    id: "mission-2026-0710-001",
    title: "完成 Telegram Mini App 新手流程并提交真实体验",
    category: "PRODUCT EXPERIENCE",
    platform: "TELEGRAM",
    minutes: 6,
    stableReward: 4.8,
    apReward: 300,
    shoreRights: 12_000,
    risk: "LOW",
    verification: "Mini App Event + Screenshot",
  },
  activity: [
    {
      id: "event-1",
      time: "18:42:16",
      type: "proof",
      title: "Proof verified",
      detail: "Mini App onboarding · confidence 96.4%",
      status: "success",
    },
    {
      id: "event-2",
      time: "18:41:58",
      type: "reward",
      title: "+300 AP recorded",
      detail: "Ledger entry AP-0710-00342",
      status: "success",
    },
    {
      id: "event-3",
      time: "18:36:02",
      type: "task",
      title: "Mission submitted",
      detail: "mission-2026-0710-001",
      status: "neutral",
    },
    {
      id: "event-4",
      time: "17:54:29",
      type: "round",
      title: "Round 04 action gate updated",
      detail: "67.0% of network threshold",
      status: "pending",
    },
    {
      id: "event-5",
      time: "16:20:10",
      type: "system",
      title: "TON indexer synchronized",
      detail: "Testnet cursor 4,928,114",
      status: "success",
    },
  ],
};
