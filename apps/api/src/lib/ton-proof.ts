import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";

import {
  Address,
  Cell,
  contractAddress,
  loadStateInit,
  type Slice,
  type StateInit,
  WalletContractV1R1,
  WalletContractV1R2,
  WalletContractV1R3,
  WalletContractV2R1,
  WalletContractV2R2,
  WalletContractV3R1,
  WalletContractV3R2,
  WalletContractV4,
  WalletContractV5R1,
} from "@ton/ton";
import type { VerifyTonProofRequest } from "@shore/shared";
import nacl from "tweetnacl";

import { ApiHttpError } from "./http";

const PROOF_MAX_AGE_SECONDS = 15 * 60;

function loadV1(slice: Slice): Buffer {
  slice.loadUint(32);
  return slice.loadBuffer(32);
}

function loadV2(slice: Slice): Buffer {
  slice.loadUint(32);
  return slice.loadBuffer(32);
}

function loadV3(slice: Slice): Buffer {
  slice.loadUint(32);
  slice.loadUint(32);
  return slice.loadBuffer(32);
}

function loadV4(slice: Slice): Buffer {
  slice.loadUint(32);
  slice.loadUint(32);
  return slice.loadBuffer(32);
}

function loadV5(slice: Slice): Buffer {
  slice.loadBoolean();
  slice.loadUint(32);
  slice.loadUint(32);
  return slice.loadBuffer(32);
}

const knownWallets = [
  { contract: WalletContractV1R1, load: loadV1 },
  { contract: WalletContractV1R2, load: loadV1 },
  { contract: WalletContractV1R3, load: loadV1 },
  { contract: WalletContractV2R1, load: loadV2 },
  { contract: WalletContractV2R2, load: loadV2 },
  { contract: WalletContractV3R1, load: loadV3 },
  { contract: WalletContractV3R2, load: loadV3 },
  { contract: WalletContractV4, load: loadV4 },
  { contract: WalletContractV5R1, load: loadV5 },
].map(({ contract, load }) => ({
  code: contract.create({ workchain: 0, publicKey: Buffer.alloc(32) }).init.code,
  load,
}));

export function tryExtractPublicKey(stateInit: StateInit): Buffer | null {
  if (!stateInit.code || !stateInit.data) return null;
  for (const { code, load } of knownWallets) {
    try {
      if (code.equals(stateInit.code)) {
        return load(stateInit.data.beginParse());
      }
    } catch {
      // Unknown data layout for a code hash that otherwise resembles a standard wallet.
    }
  }
  return null;
}

function sha256(value: Buffer): Buffer {
  return createHash("sha256").update(value).digest();
}

export function buildTonProofDigest(
  address: Address,
  proof: VerifyTonProofRequest["proof"],
): Buffer {
  const workchain = Buffer.alloc(4);
  workchain.writeInt32BE(address.workChain, 0);

  const domainBytes = Buffer.from(proof.domain.value, "utf8");
  if (proof.domain.lengthBytes !== domainBytes.length) {
    throw new ApiHttpError(
      422,
      "TON_PROOF_DOMAIN_LENGTH_MISMATCH",
      "TON proof domain length does not match its UTF-8 byte length.",
    );
  }

  const domainLength = Buffer.alloc(4);
  domainLength.writeUInt32LE(proof.domain.lengthBytes, 0);
  const timestamp = Buffer.alloc(8);
  timestamp.writeBigUInt64LE(BigInt(proof.timestamp), 0);

  const message = Buffer.concat([
    Buffer.from("ton-proof-item-v2/", "utf8"),
    workchain,
    Buffer.from(address.hash),
    domainLength,
    domainBytes,
    timestamp,
    Buffer.from(proof.payload, "utf8"),
  ]);

  return sha256(
    Buffer.concat([Buffer.from([0xff, 0xff]), Buffer.from("ton-connect", "utf8"), sha256(message)]),
  );
}

export function parseTonNetwork(
  chain: string,
  expectedNetwork: "testnet" | "mainnet",
): "testnet" | "mainnet" {
  const network = chain === "-3" ? "testnet" : chain === "-239" ? "mainnet" : null;
  if (!network) {
    throw new ApiHttpError(
      422,
      "TON_NETWORK_UNKNOWN",
      "The wallet returned an unsupported TON chain ID.",
    );
  }
  if (network !== expectedNetwork) {
    throw new ApiHttpError(
      422,
      "TON_NETWORK_MISMATCH",
      `The wallet is connected to ${network}, but SHORE is configured for ${expectedNetwork}.`,
    );
  }
  return network;
}

export function verifyTonProofCryptographically(
  input: VerifyTonProofRequest,
  expectedDomain: string,
): {
  address: Address;
  addressRaw: string;
  addressFriendly: string;
} {
  if (input.proof.domain.value !== expectedDomain) {
    throw new ApiHttpError(
      422,
      "TON_PROOF_DOMAIN_MISMATCH",
      "TON proof was signed for another domain.",
    );
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - input.proof.timestamp) > PROOF_MAX_AGE_SECONDS) {
    throw new ApiHttpError(
      422,
      "TON_PROOF_EXPIRED",
      "TON proof timestamp is outside the allowed window.",
    );
  }

  let address: Address;
  let stateInit: StateInit;
  try {
    address = Address.parse(input.address);
    stateInit = loadStateInit(Cell.fromBase64(input.walletStateInit).beginParse());
  } catch {
    throw new ApiHttpError(
      422,
      "TON_PROOF_INVALID_STATE",
      "TON address or wallet stateInit is invalid.",
    );
  }

  const derivedAddress = contractAddress(address.workChain, stateInit);
  if (!derivedAddress.equals(address)) {
    throw new ApiHttpError(
      422,
      "TON_STATE_INIT_ADDRESS_MISMATCH",
      "walletStateInit does not derive the reported TON address.",
    );
  }

  const publicKey = tryExtractPublicKey(stateInit);
  if (!publicKey) {
    throw new ApiHttpError(
      422,
      "TON_WALLET_UNSUPPORTED",
      "This wallet contract is not yet supported for offline ton_proof verification.",
    );
  }

  const signature = Buffer.from(input.proof.signature, "base64");
  if (signature.length !== nacl.sign.signatureLength) {
    throw new ApiHttpError(
      422,
      "TON_PROOF_BAD_SIGNATURE",
      "TON proof signature length is invalid.",
    );
  }

  const verified = nacl.sign.detached.verify(
    new Uint8Array(buildTonProofDigest(address, input.proof)),
    new Uint8Array(signature),
    new Uint8Array(publicKey),
  );
  if (!verified) {
    throw new ApiHttpError(
      422,
      "TON_PROOF_BAD_SIGNATURE",
      "TON proof signature verification failed.",
    );
  }

  return {
    address,
    addressRaw: address.toRawString(),
    addressFriendly: address.toString({
      testOnly: input.network === "-3",
      bounceable: false,
      urlSafe: true,
    }),
  };
}
