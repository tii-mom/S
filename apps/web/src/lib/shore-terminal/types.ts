export type AccountView = "recovery" | "actions" | "shore";
export type ChartMode = "recovery" | "rounds";
export type MobileSection = "overview" | "mission" | "rounds" | "activity";

export type RoundStatus = "completed" | "claimable" | "qualified" | "active" | "locked";

export type RecoverySnapshot = {
  label: string;
  debtRemaining: number;
  coveredValue: number;
  verifiedActionValue: number;
};

export type RoundDefinition = {
  round: number;
  targetPrice: number;
  requiredActions: number;
  requiredRevenue: number;
  personalRequirement: string;
  releaseAmount: number;
  priceProgress: number;
  actionProgress: number;
  revenueProgress: number;
  liquidityProgress: number;
  status: RoundStatus;
};

export type MissionSummary = {
  id: string;
  title: string;
  category: string;
  platform: string;
  minutes: number;
  stableReward: number;
  apReward: number;
  shoreRights: number;
  risk: "LOW" | "MEDIUM" | "HIGH";
  verification: string;
};

export type ActivityEvent = {
  id: string;
  time: string;
  type: "task" | "proof" | "reward" | "round" | "system";
  title: string;
  detail: string;
  status: "success" | "pending" | "neutral" | "error";
};

export type TerminalDashboard = {
  debtOriginal: number;
  debtCovered: number;
  debtRemaining: number;
  coveragePercent: number;
  monthlyActionIncome: number;
  todayActionIncome: number;
  apBalance: number;
  shoreBalance: number;
  shoreClaimable: number;
  shoreLocked: number;
  currentRound: number;
  completedRounds: number;
  verifiedActions: number;
  pendingProofs: number;
  streakDays: number;
  protocolRevenue: number;
  networkActions: number;
  advertiserBudget: number;
  shorePrice: number;
  tonPrice: number;
  recoverySeries: RecoverySnapshot[];
  rounds: RoundDefinition[];
  mission: MissionSummary;
  activity: ActivityEvent[];
};
