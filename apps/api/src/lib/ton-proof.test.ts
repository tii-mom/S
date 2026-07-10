import { Buffer } from "node:buffer";

import { beginCell, storeStateInit, WalletContractV4 } from "@ton/ton";
import { keyPairFromSeed, sign } from "@ton/crypto";
import type { VerifyTonProofRequest } from "@shore/shared";
import { describe, expect, it } from "vitest";

import { ApiHttpError } from "./http";
import { buildTonProofDigest, parseTonNetwork, verifyTonProofCryptographically } from "./ton-proof";

function createSignedProof(): VerifyTonProofRequest {
  const keyPair = keyPairFromSeed(Buffer.alloc(32, 7));
  const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
  const walletStateInit = beginCell()
    .store(storeStateInit(wallet.init))
    .endCell()
    .toBoc()
    .toString("base64");
  const proof: VerifyTonProofRequest["proof"] = {
    timestamp: Math.floor(Date.now() / 1000),
    domain: {
      lengthBytes: Buffer.byteLength("localhost", "utf8"),
      value: "localhost",
    },
    payload: "nonce-for-ton-proof-test-1234567890",
    signature: "",
  };
  proof.signature = sign(buildTonProofDigest(wallet.address, proof), keyPair.secretKey).toString(
    "base64",
  );

  return {
    address: wallet.address.toString({ testOnly: true, bounceable: false }),
    walletStateInit,
    network: "-3",
    walletApp: "test-wallet",
    proof,
  };
}

describe("TON proof verification", () => {
  it("verifies a standard Wallet V4 ton_proof signature", () => {
    const input = createSignedProof();
    const result = verifyTonProofCryptographically(input, "localhost");

    expect(result.addressRaw).toMatch(/^0:[0-9a-f]{64}$/);
    expect(result.addressFriendly).toBeTruthy();
  });

  it("rejects a proof signed for another domain", () => {
    const input = createSignedProof();
    expect(() => verifyTonProofCryptographically(input, "shore.example")).toThrow(ApiHttpError);
  });

  it("rejects the wrong configured chain", () => {
    expect(() => parseTonNetwork("-239", "testnet")).toThrow(ApiHttpError);
    expect(parseTonNetwork("-3", "testnet")).toBe("testnet");
  });
});
