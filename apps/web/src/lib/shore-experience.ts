import { useCallback, useEffect, useMemo, useReducer, useState } from "react";

const STORAGE_KEY = "shore.experience.v3";
const STORAGE_VERSION = 3;

export type TaskStatus = "ready" | "active" | "verified";

export type ShoreExperienceState = {
  version: number;
  debtAmount: number | null;
  taskStatus: TaskStatus;
  proofUrl: string;
  points: number;
  availableShore: number;
  walletConnected: boolean;
  claimedRound4: boolean;
  shareCount: number;
};

type ShoreExperienceAction =
  | { type: "hydrate"; state: ShoreExperienceState }
  | { type: "confirmDebt"; amount: number }
  | { type: "startTask" }
  | { type: "submitProof"; proofUrl: string }
  | { type: "connectWallet" }
  | { type: "claimRound" }
  | { type: "recordShare" }
  | { type: "reset" };

export const initialShoreExperienceState: ShoreExperienceState = {
  version: STORAGE_VERSION,
  debtAmount: null,
  taskStatus: "ready",
  proofUrl: "",
  points: 0,
  availableShore: 0,
  walletConnected: false,
  claimedRound4: false,
  shareCount: 0,
};

function isValidState(value: unknown): value is ShoreExperienceState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ShoreExperienceState>;
  return (
    candidate.version === STORAGE_VERSION &&
    (candidate.debtAmount === null || typeof candidate.debtAmount === "number") &&
    (candidate.taskStatus === "ready" ||
      candidate.taskStatus === "active" ||
      candidate.taskStatus === "verified") &&
    typeof candidate.proofUrl === "string" &&
    typeof candidate.points === "number" &&
    typeof candidate.availableShore === "number" &&
    typeof candidate.walletConnected === "boolean" &&
    typeof candidate.claimedRound4 === "boolean" &&
    typeof candidate.shareCount === "number"
  );
}

function readStoredState(): ShoreExperienceState {
  if (typeof window === "undefined") return initialShoreExperienceState;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialShoreExperienceState;
    const parsed: unknown = JSON.parse(raw);
    return isValidState(parsed) ? parsed : initialShoreExperienceState;
  } catch {
    return initialShoreExperienceState;
  }
}

export function shoreExperienceReducer(
  state: ShoreExperienceState,
  action: ShoreExperienceAction,
): ShoreExperienceState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "confirmDebt":
      return {
        ...state,
        debtAmount: Math.max(1, Math.round(action.amount)),
      };
    case "startTask":
      return state.debtAmount === null || state.taskStatus !== "ready"
        ? state
        : { ...state, taskStatus: "active" };
    case "submitProof":
      return state.taskStatus !== "active"
        ? state
        : {
            ...state,
            taskStatus: "verified",
            proofUrl: action.proofUrl,
            points: state.points + 300,
          };
    case "connectWallet":
      return { ...state, walletConnected: true };
    case "claimRound":
      return !state.walletConnected || state.taskStatus !== "verified" || state.claimedRound4
        ? state
        : {
            ...state,
            claimedRound4: true,
            availableShore: state.availableShore + 150_000,
          };
    case "recordShare":
      return { ...state, shareCount: state.shareCount + 1 };
    case "reset":
      return initialShoreExperienceState;
  }
}

export type PrimaryAction =
  "setup" | "start-task" | "submit-proof" | "connect-wallet" | "claim" | "wait";

export function getPrimaryAction(state: ShoreExperienceState): PrimaryAction {
  if (state.debtAmount === null) return "setup";
  if (state.taskStatus === "ready") return "start-task";
  if (state.taskStatus === "active") return "submit-proof";
  if (!state.walletConnected) return "connect-wallet";
  if (!state.claimedRound4) return "claim";
  return "wait";
}

export function getActionProgress(state: ShoreExperienceState): number {
  if (state.debtAmount === null) return 0;
  if (state.claimedRound4) return 10;
  if (state.taskStatus === "verified") return 3.8;
  if (state.taskStatus === "active") return 1.2;
  return 0;
}

export function getActiveRound(state: ShoreExperienceState): number {
  return state.claimedRound4 ? 5 : 4;
}

export function getRoundProgress(state: ShoreExperienceState, round: number): number {
  const activeRound = getActiveRound(state);
  if (round < activeRound) return 100;
  if (round > activeRound) return 0;
  if (state.claimedRound4) return 18;
  return state.taskStatus === "verified" ? 100 : 96;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 0 }).format(value);
}

export function formatCny(value: number): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(value);
}

export function useShoreExperience() {
  const [state, dispatch] = useReducer(shoreExperienceReducer, initialShoreExperienceState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    dispatch({ type: "hydrate", state: readStoredState() });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const confirmDebt = useCallback((amount: number) => {
    dispatch({ type: "confirmDebt", amount });
  }, []);
  const startTask = useCallback(() => dispatch({ type: "startTask" }), []);
  const submitProof = useCallback((proofUrl: string) => {
    dispatch({ type: "submitProof", proofUrl });
  }, []);
  const connectWallet = useCallback(() => dispatch({ type: "connectWallet" }), []);
  const claimRound = useCallback(() => dispatch({ type: "claimRound" }), []);
  const recordShare = useCallback(() => dispatch({ type: "recordShare" }), []);
  const reset = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    dispatch({ type: "reset" });
  }, []);

  return useMemo(
    () => ({
      state,
      hydrated,
      primaryAction: getPrimaryAction(state),
      actionProgress: getActionProgress(state),
      activeRound: getActiveRound(state),
      confirmDebt,
      startTask,
      submitProof,
      connectWallet,
      claimRound,
      recordShare,
      reset,
    }),
    [
      state,
      hydrated,
      confirmDebt,
      startTask,
      submitProof,
      connectWallet,
      claimRound,
      recordShare,
      reset,
    ],
  );
}
