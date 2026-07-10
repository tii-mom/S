import { Buffer } from "node:buffer";

import { SHORE_CLAIM_MESSAGE_VALUE_NANO } from "@shore/contracts";
import { Address, beginCell, internal, storeMessageRelaxed } from "@ton/ton";
import { describe, expect, it } from "vitest";

import { ApiHttpError } from "./http";
import { validateClaimSubmissionBoc } from "./claim-submission";

const contract = new Address(0, Buffer.alloc(32, 11));
const anotherContract = new Address(0, Buffer.alloc(32, 12));
const payload = beginCell().storeUint(0x5348434c, 32).storeUint(42, 64).endCell();

function buildWalletBoc(input: {
  destination?: Address;
  value?: bigint;
  body?: ReturnType<typeof beginCell>["endCell"] extends () => infer T ? T : never;
}) {
  const message = beginCell()
    .store(
      storeMessageRelaxed(
        internal({
          to: input.destination ?? contract,
          value: input.value ?? SHORE_CLAIM_MESSAGE_VALUE_NANO,
          bounce: true,
          body: input.body ?? payload,
        }),
      ),
    )
    .endCell();
  return beginCell()
    .storeUint(0xabcdef01, 32)
    .storeRef(beginCell().storeRef(message).endCell())
    .endCell()
    .toBoc({ idx: false })
    .toString("base64");
}

describe("validateClaimSubmissionBoc", () => {
  it("finds the exact prepared claim message inside a nested wallet BOC", () => {
    const boc = buildWalletBoc({});
    const result = validateClaimSubmissionBoc({
      bocBase64: boc,
      contractAddress: contract.toRawString(),
      authorizationPayloadBoc: payload.toBoc({ idx: false }).toString("base64"),
    });

    expect(result.bocHashHex).toMatch(/^[0-9a-f]{64}$/);
    expect(result.rootCount).toBe(1);
    expect(result.visitedCells).toBeGreaterThanOrEqual(2);
  });

  it("rejects a BOC targeting another contract", () => {
    expect(() =>
      validateClaimSubmissionBoc({
        bocBase64: buildWalletBoc({ destination: anotherContract }),
        contractAddress: contract.toRawString(),
        authorizationPayloadBoc: payload.toBoc({ idx: false }).toString("base64"),
      }),
    ).toThrowError(ApiHttpError);
  });

  it("rejects a BOC with the wrong amount or payload", () => {
    expect(() =>
      validateClaimSubmissionBoc({
        bocBase64: buildWalletBoc({ value: SHORE_CLAIM_MESSAGE_VALUE_NANO - 1n }),
        contractAddress: contract.toRawString(),
        authorizationPayloadBoc: payload.toBoc({ idx: false }).toString("base64"),
      }),
    ).toThrowError(ApiHttpError);

    const otherPayload = beginCell().storeUint(0xdeadbeef, 32).endCell();
    expect(() =>
      validateClaimSubmissionBoc({
        bocBase64: buildWalletBoc({ body: otherPayload }),
        contractAddress: contract.toRawString(),
        authorizationPayloadBoc: payload.toBoc({ idx: false }).toString("base64"),
      }),
    ).toThrowError(ApiHttpError);
  });

  it("rejects malformed or unrelated BOCs", () => {
    expect(() =>
      validateClaimSubmissionBoc({
        bocBase64: "not-base64",
        contractAddress: contract.toRawString(),
        authorizationPayloadBoc: payload.toBoc({ idx: false }).toString("base64"),
      }),
    ).toThrowError(ApiHttpError);

    const unrelated = beginCell().storeUint(1, 1).endCell().toBoc().toString("base64");
    expect(() =>
      validateClaimSubmissionBoc({
        bocBase64: unrelated,
        contractAddress: contract.toRawString(),
        authorizationPayloadBoc: payload.toBoc({ idx: false }).toString("base64"),
      }),
    ).toThrowError(ApiHttpError);
  });
});
