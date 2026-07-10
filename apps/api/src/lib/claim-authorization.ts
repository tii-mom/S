import {
  buildShoreClaimAuthorizationCell,
  buildShoreClaimRequestBody,
  SHORE_CLAIM_AUTH_TTL_SECONDS,
  SHORE_CLAIM_MESSAGE_VALUE_NANO,
} from "@shore/contracts";
import type { TonConnectTransaction } from "@shore/shared";
import { Address } from "@ton/ton";
import { keyPairFromSeed, sign } from "@ton/crypto";

import { constantTimeEqual } from "./crypto";
import { ApiHttpError } from "./http";

const UINT63_MAX = 0x7fff_ffff_ffff_ffffn;

export type ClaimSignerConfiguration = {
  seedBase64: string | undefined;
  expectedPublicKeyHex: string | undefined;
};

export type PreparedClaimAuthorization = {
  onchainClaimId: string;
  validAfter: number;
  expiresAt: number;
  authorizationHashHex: string;
  payloadBoc: string;
  transaction: TonConnectTransaction;
};

export function createOnchainClaimId(): bigint {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const value = new DataView(bytes.buffer).getBigUint64(0, false) & UINT63_MAX;
  return value === 0n ? 1n : value;
}

function loadSigner(configuration: ClaimSignerConfiguration) {
  const seedBase64 = configuration.seedBase64?.trim();
  const expectedPublicKeyHex = configuration.expectedPublicKeyHex?.trim().toLowerCase();
  if (!seedBase64 || !expectedPublicKeyHex) {
    throw new ApiHttpError(
      503,
      "CLAIM_SIGNER_NOT_CONFIGURED",
      "The Testnet claim signer is not configured.",
    );
  }
  if (!/^[0-9a-f]{64}$/.test(expectedPublicKeyHex)) {
    throw new ApiHttpError(
      503,
      "CLAIM_SIGNER_PUBLIC_KEY_INVALID",
      "The configured claim signer public key must be 32-byte hexadecimal.",
    );
  }

  let seed: Buffer;
  try {
    seed = Buffer.from(seedBase64, "base64");
  } catch {
    throw new ApiHttpError(
      503,
      "CLAIM_SIGNER_SEED_INVALID",
      "The configured claim signer seed is not valid base64.",
    );
  }
  if (seed.length !== 32) {
    throw new ApiHttpError(
      503,
      "CLAIM_SIGNER_SEED_INVALID",
      "The configured claim signer seed must contain exactly 32 bytes.",
    );
  }

  const keyPair = keyPairFromSeed(seed);
  const derivedPublicKeyHex = keyPair.publicKey.toString("hex");
  if (!constantTimeEqual(derivedPublicKeyHex, expectedPublicKeyHex)) {
    throw new ApiHttpError(
      503,
      "CLAIM_SIGNER_KEY_MISMATCH",
      "The claim signer seed does not match the configured public key.",
    );
  }
  return keyPair;
}

export function prepareClaimAuthorization(input: {
  contractAddress: string;
  claimantAddress: string;
  amount: bigint;
  onchainClaimId: bigint;
  nowSeconds?: number;
  signer: ClaimSignerConfiguration;
}): PreparedClaimAuthorization {
  if (input.amount <= 0n) {
    throw new ApiHttpError(422, "CLAIM_AMOUNT_INVALID", "Claim amount must be positive.");
  }

  let contractAddress: Address;
  let claimantAddress: Address;
  try {
    contractAddress = Address.parse(input.contractAddress);
    claimantAddress = Address.parse(input.claimantAddress);
  } catch {
    throw new ApiHttpError(
      503,
      "CLAIM_ADDRESS_INVALID",
      "The configured claim contract or verified claimant address is invalid.",
    );
  }

  const signer = loadSigner(input.signer);
  const nowSeconds = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  const validAfter = Math.max(0, nowSeconds - 30);
  const expiresAt = nowSeconds + SHORE_CLAIM_AUTH_TTL_SECONDS;
  const authorization = buildShoreClaimAuthorizationCell({
    contractAddress,
    claimant: claimantAddress,
    claimId: input.onchainClaimId,
    amount: input.amount,
    validAfter: BigInt(validAfter),
    expiresAt: BigInt(expiresAt),
  });
  const signature = sign(authorization.hash(), signer.secretKey);
  const payload = buildShoreClaimRequestBody({
    claimId: input.onchainClaimId,
    amount: input.amount,
    validAfter: BigInt(validAfter),
    expiresAt: BigInt(expiresAt),
    signature,
  });
  const payloadBoc = payload.toBoc({ idx: false }).toString("base64");
  const friendlyContractAddress = contractAddress.toString({
    testOnly: true,
    bounceable: true,
    urlSafe: true,
  });

  return {
    onchainClaimId: input.onchainClaimId.toString(),
    validAfter,
    expiresAt,
    authorizationHashHex: authorization.hash().toString("hex"),
    payloadBoc,
    transaction: {
      validUntil: expiresAt,
      network: "-3",
      messages: [
        {
          address: friendlyContractAddress,
          amount: SHORE_CLAIM_MESSAGE_VALUE_NANO.toString(),
          payload: payloadBoc,
        },
      ],
    },
  };
}
