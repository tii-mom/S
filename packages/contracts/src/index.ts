import { beginCell } from "@ton/core";
import type { Address, Cell } from "@ton/core";

export const SHORE_CLAIM_AUTH_DOMAIN = 0x53484341;
export const SHORE_CLAIM_AUTH_VERSION = 1;

export const SHORE_CLAIM_OPS = {
  claim: 0x5348434c,
  setPaused: 0x53485041,
  rotateSigner: 0x53485347,
  setDistributionWallet: 0x53484a57,
  resolvePending: 0x53485253,
  jettonTransfer: 0x0f8a7ea5,
} as const;

export const SHORE_CLAIM_RESOLUTION = {
  complete: 1,
  reset: 2,
} as const;

export const SHORE_CLAIM_STATUS = {
  none: 0,
  pending: 1,
  completed: 2,
} as const;

export const SHORE_CLAIM_EXIT_CODES = {
  unauthorized: 1001,
  paused: 1002,
  invalidSignature: 1003,
  authorizationExpired: 1004,
  authorizationFromFuture: 1005,
  claimAlreadyExists: 1006,
  invalidAmount: 1007,
  insufficientTon: 1008,
  claimNotFound: 1009,
  claimNotPending: 1010,
  invalidResolution: 1011,
  resetRequiresPause: 1012,
  resetDelayActive: 1013,
  invalidBounceSender: 1014,
} as const;

export const SHORE_CLAIM_MESSAGE_VALUE_NANO = 80_000_000n;
export const SHORE_CLAIM_AUTH_TTL_SECONDS = 10 * 60;

export type ShoreClaimAuthorization = {
  contractAddress: Address;
  claimant: Address;
  claimId: bigint;
  amount: bigint;
  validAfter: bigint;
  expiresAt: bigint;
};

export type ShoreClaimRequest = Omit<ShoreClaimAuthorization, "contractAddress" | "claimant"> & {
  signature: Buffer;
};

function assertUint64(value: bigint, field: string): void {
  if (value < 0n || value > 0xffff_ffff_ffff_ffffn) {
    throw new RangeError(`${field} must fit uint64.`);
  }
}

export function buildShoreClaimAuthorizationCell(input: ShoreClaimAuthorization): Cell {
  assertUint64(input.claimId, "claimId");
  assertUint64(input.validAfter, "validAfter");
  assertUint64(input.expiresAt, "expiresAt");
  if (input.amount <= 0n) {
    throw new RangeError("amount must be positive.");
  }

  return beginCell()
    .storeUint(SHORE_CLAIM_AUTH_DOMAIN, 32)
    .storeUint(SHORE_CLAIM_AUTH_VERSION, 16)
    .storeAddress(input.contractAddress)
    .storeAddress(input.claimant)
    .storeUint(input.claimId, 64)
    .storeCoins(input.amount)
    .storeUint(input.validAfter, 64)
    .storeUint(input.expiresAt, 64)
    .endCell();
}

export function buildShoreClaimRequestBody(input: ShoreClaimRequest): Cell {
  assertUint64(input.claimId, "claimId");
  assertUint64(input.validAfter, "validAfter");
  assertUint64(input.expiresAt, "expiresAt");
  if (input.amount <= 0n) {
    throw new RangeError("amount must be positive.");
  }
  if (input.signature.length !== 64) {
    throw new RangeError("signature must contain exactly 64 bytes.");
  }

  return beginCell()
    .storeUint(SHORE_CLAIM_OPS.claim, 32)
    .storeUint(input.claimId, 64)
    .storeCoins(input.amount)
    .storeUint(input.validAfter, 64)
    .storeUint(input.expiresAt, 64)
    .storeBuffer(input.signature)
    .endCell();
}

export function buildSetPausedBody(queryId: bigint, paused: boolean): Cell {
  assertUint64(queryId, "queryId");
  return beginCell()
    .storeUint(SHORE_CLAIM_OPS.setPaused, 32)
    .storeUint(queryId, 64)
    .storeBit(paused)
    .endCell();
}

export function buildRotateSignerBody(queryId: bigint, publicKey: Buffer): Cell {
  assertUint64(queryId, "queryId");
  if (publicKey.length !== 32) {
    throw new RangeError("publicKey must contain exactly 32 bytes.");
  }
  return beginCell()
    .storeUint(SHORE_CLAIM_OPS.rotateSigner, 32)
    .storeUint(queryId, 64)
    .storeBuffer(publicKey)
    .endCell();
}

export function buildSetDistributionWalletBody(
  queryId: bigint,
  distributionJettonWallet: Address,
): Cell {
  assertUint64(queryId, "queryId");
  return beginCell()
    .storeUint(SHORE_CLAIM_OPS.setDistributionWallet, 32)
    .storeUint(queryId, 64)
    .storeAddress(distributionJettonWallet)
    .endCell();
}

export function buildResolvePendingBody(
  queryId: bigint,
  claimId: bigint,
  resolution: (typeof SHORE_CLAIM_RESOLUTION)[keyof typeof SHORE_CLAIM_RESOLUTION],
): Cell {
  assertUint64(queryId, "queryId");
  assertUint64(claimId, "claimId");
  return beginCell()
    .storeUint(SHORE_CLAIM_OPS.resolvePending, 32)
    .storeUint(queryId, 64)
    .storeUint(claimId, 64)
    .storeUint(resolution, 8)
    .endCell();
}
