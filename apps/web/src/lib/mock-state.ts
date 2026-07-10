export const SHORE_STATE_STORAGE_KEY = "shore.mock-state.v1";

export type ShoreMockState = {
  debtAmount: number | null;
  currency: "CNY";
  points: number;
  completedTaskIds: string[];
  streakDays: number;
  shares: number;
  availableShore: number;
  lockedShore: number;
};

export type ShoreMockAction =
  | { type: "hydrate"; state: ShoreMockState }
  | { type: "confirmDebt"; amount: number }
  | { type: "completeTask"; taskId: string; rewardPoints: number }
  | { type: "recordShare" }
  | { type: "reset" };

export const initialShoreMockState: ShoreMockState = {
  debtAmount: null,
  currency: "CNY",
  points: 0,
  completedTaskIds: [],
  streakDays: 0,
  shares: 0,
  availableShore: 100_000,
  lockedShore: 2_700_000,
};

export function shoreMockReducer(state: ShoreMockState, action: ShoreMockAction): ShoreMockState {
  switch (action.type) {
    case "hydrate": {
      return action.state;
    }
    case "confirmDebt": {
      return {
        ...state,
        debtAmount: Math.max(0, Math.round(action.amount)),
      };
    }
    case "completeTask": {
      if (state.completedTaskIds.includes(action.taskId)) {
        return state;
      }

      return {
        ...state,
        points: state.points + action.rewardPoints,
        completedTaskIds: [...state.completedTaskIds, action.taskId],
        streakDays: Math.max(1, state.streakDays + 1),
      };
    }
    case "recordShare": {
      return {
        ...state,
        shares: state.shares + 1,
      };
    }
    case "reset": {
      return initialShoreMockState;
    }
    default: {
      return state;
    }
  }
}

export function getActionProgress(state: ShoreMockState): number {
  if (state.debtAmount === null) {
    return 0;
  }

  const taskProgress = state.completedTaskIds.length * 3.8;
  const shareProgress = Math.min(state.shares, 3) * 0.4;
  return Math.min(99, Number((taskProgress + shareProgress).toFixed(1)));
}

export function formatCny(value: number): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(value);
}
