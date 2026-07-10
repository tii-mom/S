"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  ClaimIntentResponse,
  DashboardResponse,
  VerifyTonProofRequest,
  VerifyTonProofResponse,
} from "@shore/shared";

import { terminalDashboard } from "@/lib/shore-terminal/mock-data";
import type { TerminalDashboard } from "@/lib/shore-terminal/types";

import {
  createClaimIntent,
  fetchDashboard,
  requestTonProofNonce,
  ShoreApiError,
  startMission,
  submitProof,
  verifyTonProof,
} from "./api-client";
import { mapD1Dashboard } from "./dashboard-adapter";

export type RuntimeStatus = "loading" | "live" | "degraded" | "mutating";

export type RuntimeNotice = {
  tone: "success" | "pending" | "error" | "neutral";
  message: string;
} | null;

export function useShoreRuntime() {
  const [rawDashboard, setRawDashboard] = useState<DashboardResponse | null>(null);
  const [status, setStatus] = useState<RuntimeStatus>("loading");
  const [notice, setNotice] = useState<RuntimeNotice>(null);
  const [lastError, setLastError] = useState<ShoreApiError | null>(null);

  const refresh = useCallback(async () => {
    try {
      const dashboard = await fetchDashboard();
      setRawDashboard(dashboard);
      setLastError(null);
      setStatus("live");
      return dashboard;
    } catch (error) {
      const apiError =
        error instanceof ShoreApiError
          ? error
          : new ShoreApiError({
              code: "RUNTIME_UNAVAILABLE",
              message: error instanceof Error ? error.message : "SHORE runtime is unavailable.",
              status: 0,
            });
      setLastError(apiError);
      setStatus("degraded");
      return null;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const dashboard: TerminalDashboard = useMemo(
    () => (rawDashboard ? mapD1Dashboard(rawDashboard) : terminalDashboard),
    [rawDashboard],
  );

  const runMutation = useCallback(
    async <T>(operation: () => Promise<T>, successMessage: string): Promise<T | null> => {
      setStatus("mutating");
      setNotice({ tone: "pending", message: "正在写入SHORE运行时…" });
      try {
        const result = await operation();
        setNotice({ tone: "success", message: successMessage });
        await refresh();
        return result;
      } catch (error) {
        const apiError =
          error instanceof ShoreApiError
            ? error
            : new ShoreApiError({
                code: "MUTATION_FAILED",
                message: error instanceof Error ? error.message : "SHORE operation failed.",
                status: 0,
              });
        setLastError(apiError);
        setNotice({ tone: "error", message: apiError.message });
        setStatus(rawDashboard ? "live" : "degraded");
        return null;
      }
    },
    [rawDashboard, refresh],
  );

  const startCurrentMission = useCallback(async () => {
    if (!rawDashboard) {
      setNotice({ tone: "error", message: "D1运行时尚未连接，不能开始真实任务。" });
      return null;
    }
    return runMutation(
      () => startMission(rawDashboard.mission.id),
      "任务已在D1创建，可以提交真实Proof。",
    );
  }, [rawDashboard, runMutation]);

  const submitCurrentProof = useCallback(
    async (input: { note: string; evidenceUrl?: string; file?: File | null }) => {
      const executionId = rawDashboard?.execution?.id;
      if (!executionId) {
        setNotice({ tone: "error", message: "请先开始任务，再提交Proof。" });
        return null;
      }
      return runMutation(
        () => submitProof({ executionId, ...input }),
        "Proof已写入D1/R2并进入审核队列。",
      );
    },
    [rawDashboard, runMutation],
  );

  const prepareClaim = useCallback(async (): Promise<ClaimIntentResponse | null> => {
    return runMutation(
      createClaimIntent,
      "Testnet领取意图已记录；未配置合约消息体时不会发起交易。",
    );
  }, [runMutation]);

  const issueTonProofNonce = useCallback(() => requestTonProofNonce(), []);

  const bindTonWallet = useCallback(
    async (input: VerifyTonProofRequest): Promise<VerifyTonProofResponse | null> => {
      return runMutation(
        () => verifyTonProof(input),
        "TON地址所有权验证通过，钱包已绑定到D1账户。",
      );
    },
    [runMutation],
  );

  return {
    dashboard,
    rawDashboard,
    status,
    notice,
    lastError,
    isLive: Boolean(rawDashboard),
    refresh,
    startCurrentMission,
    submitCurrentProof,
    prepareClaim,
    issueTonProofNonce,
    bindTonWallet,
    clearNotice: () => setNotice(null),
  };
}
