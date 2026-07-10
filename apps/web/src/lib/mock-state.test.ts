import { describe, expect, it } from "vitest";

import { getActionProgress, initialShoreMockState, shoreMockReducer } from "./mock-state";

describe("shoreMockReducer", () => {
  it("confirms a rounded non-negative debt amount", () => {
    const state = shoreMockReducer(initialShoreMockState, {
      type: "confirmDebt",
      amount: 186_420.4,
    });

    expect(state.debtAmount).toBe(186_420);
  });

  it("awards one task only once", () => {
    const first = shoreMockReducer(initialShoreMockState, {
      type: "completeTask",
      taskId: "daily-story",
      rewardPoints: 300,
    });
    const duplicate = shoreMockReducer(first, {
      type: "completeTask",
      taskId: "daily-story",
      rewardPoints: 300,
    });

    expect(first.points).toBe(300);
    expect(duplicate).toEqual(first);
  });

  it("hydrates the exact persisted points and task rewards", () => {
    const persisted = {
      ...initialShoreMockState,
      debtAmount: 90_000,
      points: 460,
      completedTaskIds: ["miniapp-trial", "feedback-note"],
      streakDays: 2,
    };

    expect(shoreMockReducer(initialShoreMockState, { type: "hydrate", state: persisted })).toEqual(
      persisted,
    );
  });

  it("derives a bounded action progress", () => {
    const state = {
      ...initialShoreMockState,
      debtAmount: 100_000,
      completedTaskIds: ["one", "two"],
      shares: 2,
    };

    expect(getActionProgress(state)).toBe(8.4);
  });
});
