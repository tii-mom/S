"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";

import {
  initialShoreMockState,
  SHORE_STATE_STORAGE_KEY,
  shoreMockReducer,
  type ShoreMockState,
} from "@/lib/mock-state";

type ShoreStateContextValue = {
  state: ShoreMockState;
  hydrated: boolean;
  confirmDebt: (amount: number) => void;
  completeTask: (taskId: string, rewardPoints: number) => void;
  recordShare: () => void;
  reset: () => void;
};

const ShoreStateContext = createContext<ShoreStateContextValue | null>(null);

function readInitialState(): ShoreMockState {
  if (typeof window === "undefined") {
    return initialShoreMockState;
  }

  const stored = window.localStorage.getItem(SHORE_STATE_STORAGE_KEY);
  if (!stored) {
    return initialShoreMockState;
  }

  try {
    return {
      ...initialShoreMockState,
      ...(JSON.parse(stored) as Partial<ShoreMockState>),
    };
  } catch {
    return initialShoreMockState;
  }
}

export function ShoreStateProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [state, dispatch] = useReducer(shoreMockReducer, initialShoreMockState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    dispatch({ type: "hydrate", state: readInitialState() });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    window.localStorage.setItem(SHORE_STATE_STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const confirmDebt = useCallback((amount: number) => {
    dispatch({ type: "confirmDebt", amount });
  }, []);

  const completeTask = useCallback((taskId: string, rewardPoints: number) => {
    dispatch({ type: "completeTask", taskId, rewardPoints });
  }, []);

  const recordShare = useCallback(() => {
    dispatch({ type: "recordShare" });
  }, []);

  const reset = useCallback(() => {
    window.localStorage.removeItem(SHORE_STATE_STORAGE_KEY);
    dispatch({ type: "reset" });
  }, []);

  const value = useMemo(
    () => ({ state, hydrated, confirmDebt, completeTask, recordShare, reset }),
    [state, hydrated, confirmDebt, completeTask, recordShare, reset],
  );

  return <ShoreStateContext.Provider value={value}>{children}</ShoreStateContext.Provider>;
}

export function useShoreState(): ShoreStateContextValue {
  const context = useContext(ShoreStateContext);
  if (!context) {
    throw new Error("useShoreState must be used inside ShoreStateProvider");
  }
  return context;
}
