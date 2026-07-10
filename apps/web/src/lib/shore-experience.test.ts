import { describe, expect, it } from "vitest";

import {
  getActiveRound,
  getPrimaryAction,
  initialShoreExperienceState,
  shoreExperienceReducer,
} from "./shore-experience";

describe("shore experience state", () => {
  it("moves through the complete single-page action flow", () => {
    const configured = shoreExperienceReducer(initialShoreExperienceState, {
      type: "confirmDebt",
      amount: 186_420.4,
    });
    expect(configured.debtAmount).toBe(186_420);
    expect(getPrimaryAction(configured)).toBe("start-task");

    const active = shoreExperienceReducer(configured, { type: "startTask" });
    expect(getPrimaryAction(active)).toBe("submit-proof");

    const verified = shoreExperienceReducer(active, {
      type: "submitProof",
      proofUrl: "https://example.com/proof",
    });
    expect(verified.points).toBe(300);
    expect(getPrimaryAction(verified)).toBe("connect-wallet");

    const connected = shoreExperienceReducer(verified, { type: "connectWallet" });
    expect(getPrimaryAction(connected)).toBe("claim");

    const claimed = shoreExperienceReducer(connected, { type: "claimRound" });
    expect(claimed.availableShore).toBe(150_000);
    expect(claimed.claimedRound4).toBe(true);
    expect(getActiveRound(claimed)).toBe(5);
    expect(getPrimaryAction(claimed)).toBe("wait");
  });

  it("does not duplicate rewards or claims", () => {
    const configured = shoreExperienceReducer(initialShoreExperienceState, {
      type: "confirmDebt",
      amount: 100_000,
    });
    const active = shoreExperienceReducer(configured, { type: "startTask" });
    const verified = shoreExperienceReducer(active, {
      type: "submitProof",
      proofUrl: "https://example.com/proof",
    });
    const duplicateProof = shoreExperienceReducer(verified, {
      type: "submitProof",
      proofUrl: "https://example.com/other",
    });
    const connected = shoreExperienceReducer(duplicateProof, { type: "connectWallet" });
    const claimed = shoreExperienceReducer(connected, { type: "claimRound" });
    const duplicateClaim = shoreExperienceReducer(claimed, { type: "claimRound" });

    expect(duplicateProof.points).toBe(300);
    expect(duplicateClaim.availableShore).toBe(150_000);
  });
});
