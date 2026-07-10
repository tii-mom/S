import { Buffer } from "node:buffer";

import { SHORE_CLAIM_MESSAGE_VALUE_NANO, SHORE_CLAIM_OPS } from "@shore/contracts";
import { Address, Cell } from "@ton/ton";
import { keyPairFromSeed } from "@ton/crypto";
import nacl from "tweetnacl";
import { describe, expect, it } from "vitest";

import { ApiHttpError } from "./http";
import { createOnchainClaimId, prepareClaimAuthorization } from "./claim-authorization";

const seed = Buffer.alloc(32, 7);
const keyPair = keyPairFromSeed(seed);
const signer = {
  seedBase64: seed.toString("base64"),
  expectedPublicKeyHex: keyPair.publicKey.toString("hex"),
};
const contractAddress = new Address(0, Buffer.alloc(32, 11));
const claimantAddress = new Address(0, Buffer.alloc(32, 22));

describe("prepareClaimAuthorization", () => {
  it("creates a signed Testnet TON Connect transaction with the exact claim payload", () => {
    const prepared = prepareClaimAuthorization({
      contractAddress: contractAddress.toRawString(),
      claimantAddress: claimantAddress.toRawString(),
      amount: 150_000n,
      onchainClaimId: 42n,
      nowSeconds: 2_000_000_000,
      signer,
    });

    expect(prepared.onchainClaimId).toBe("42");
    expect(prepared.validAfter).toBe(1_999_999_970);
    expect(prepared.expiresAt).toBe(2_000_000_600);
    expect(prepared.transaction.network).toBe("-3");
    expect(prepared.transaction.validUntil).toBe(prepared.expiresAt);
    expect(prepared.transaction.messages).toHaveLength(1);
    expect(prepared.transaction.messages[0]?.amount).toBe(
      SHORE_CLAIM_MESSAGE_VALUE_NANO.toString(),
    );
    expect(prepared.transaction.messages[0]?.address).toBe(
      contractAddress.toString({ testOnly: true, bounceable: true, urlSafe: true }),
    );

    const [payload] = Cell.fromBoc(Buffer.from(prepared.payloadBoc, "base64"));
    expect(payload).toBeDefined();
    const slice = payload!.beginParse();
    expect(slice.loadUint(32)).toBe(SHORE_CLAIM_OPS.claim);
    expect(slice.loadUintBig(64)).toBe(42n);
    expect(slice.loadCoins()).toBe(150_000n);
    expect(slice.loadUintBig(64)).toBe(1_999_999_970n);
    expect(slice.loadUintBig(64)).toBe(2_000_000_600n);
    const signature = slice.loadBuffer(64);
    expect(slice.remainingBits).toBe(0);
    expect(slice.remainingRefs).toBe(0);

    const authorizationHash = Buffer.from(prepared.authorizationHashHex, "hex");
    expect(
      nacl.sign.detached.verify(
        new Uint8Array(authorizationHash),
        new Uint8Array(signature),
        new Uint8Array(keyPair.publicKey),
      ),
    ).toBe(true);
  });

  it("fails closed when the configured public key does not match the signer seed", () => {
    expect(() =>
      prepareClaimAuthorization({
        contractAddress: contractAddress.toRawString(),
        claimantAddress: claimantAddress.toRawString(),
        amount: 1n,
        onchainClaimId: 1n,
        nowSeconds: 2_000_000_000,
        signer: {
          seedBase64: seed.toString("base64"),
          expectedPublicKeyHex: Buffer.alloc(32, 99).toString("hex"),
        },
      }),
    ).toThrowError(ApiHttpError);
  });

  it("fails closed when signer material or claim addresses are invalid", () => {
    expect(() =>
      prepareClaimAuthorization({
        contractAddress: "not-an-address",
        claimantAddress: claimantAddress.toRawString(),
        amount: 1n,
        onchainClaimId: 1n,
        signer,
      }),
    ).toThrowError(ApiHttpError);

    expect(() =>
      prepareClaimAuthorization({
        contractAddress: contractAddress.toRawString(),
        claimantAddress: claimantAddress.toRawString(),
        amount: 1n,
        onchainClaimId: 1n,
        signer: {
          seedBase64: undefined,
          expectedPublicKeyHex: undefined,
        },
      }),
    ).toThrowError(ApiHttpError);
  });
});

describe("createOnchainClaimId", () => {
  it("creates non-zero uint63 identifiers", () => {
    for (let index = 0; index < 64; index += 1) {
      const claimId = createOnchainClaimId();
      expect(claimId).toBeGreaterThan(0n);
      expect(claimId).toBeLessThanOrEqual(0x7fff_ffff_ffff_ffffn);
    }
  });
});
