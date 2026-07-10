import { beginCell, contractAddress, Dictionary, SendMode, TupleBuilder } from "@ton/core";
import type { Address, Cell, Contract, ContractABI, ContractProvider, Sender } from "@ton/core";

import {
  buildResolvePendingBody,
  buildRotateSignerBody,
  buildSetDistributionWalletBody,
  buildSetPausedBody,
  buildShoreClaimRequestBody,
  SHORE_CLAIM_MESSAGE_VALUE_NANO,
  type ShoreClaimRequest,
} from "../src";

export type ShoreClaimConfig = {
  admin: Address;
  signerPublicKey: Buffer;
  distributionJettonWallet: Address;
  paused?: boolean;
};

export function shoreClaimConfigToCell(config: ShoreClaimConfig): Cell {
  if (config.signerPublicKey.length !== 32) {
    throw new RangeError("signerPublicKey must contain exactly 32 bytes.");
  }

  return beginCell()
    .storeAddress(config.admin)
    .storeBuffer(config.signerPublicKey)
    .storeAddress(config.distributionJettonWallet)
    .storeBit(config.paused ?? false)
    .storeDict(Dictionary.empty(Dictionary.Keys.BigUint(64), Dictionary.Values.Cell()))
    .endCell();
}

export class ShoreClaim implements Contract {
  abi: ContractABI = { name: "ShoreClaim" };

  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell },
  ) {}

  static createFromAddress(address: Address) {
    return new ShoreClaim(address);
  }

  static createFromConfig(config: ShoreClaimConfig, code: Cell, workchain = 0) {
    const data = shoreClaimConfigToCell(config);
    const init = { code, data };
    return new ShoreClaim(contractAddress(workchain, init), init);
  }

  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().endCell(),
    });
  }

  async sendClaim(
    provider: ContractProvider,
    via: Sender,
    request: ShoreClaimRequest,
    value = SHORE_CLAIM_MESSAGE_VALUE_NANO,
  ) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: buildShoreClaimRequestBody(request),
    });
  }

  async sendSetPaused(
    provider: ContractProvider,
    via: Sender,
    queryId: bigint,
    paused: boolean,
    value = 30_000_000n,
  ) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: buildSetPausedBody(queryId, paused),
    });
  }

  async sendRotateSigner(
    provider: ContractProvider,
    via: Sender,
    queryId: bigint,
    signerPublicKey: Buffer,
    value = 30_000_000n,
  ) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: buildRotateSignerBody(queryId, signerPublicKey),
    });
  }

  async sendSetDistributionWallet(
    provider: ContractProvider,
    via: Sender,
    queryId: bigint,
    distributionJettonWallet: Address,
    value = 30_000_000n,
  ) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: buildSetDistributionWalletBody(queryId, distributionJettonWallet),
    });
  }

  async sendResolvePending(
    provider: ContractProvider,
    via: Sender,
    queryId: bigint,
    claimId: bigint,
    resolution: 1 | 2,
    value = 30_000_000n,
  ) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: buildResolvePendingBody(queryId, claimId, resolution),
    });
  }

  async getClaimStatus(provider: ContractProvider, claimId: bigint) {
    const args = new TupleBuilder();
    args.writeNumber(claimId);
    const result = await provider.get("get_claim_status", args.build());
    return result.stack.readNumber();
  }

  async getClaimDetails(provider: ContractProvider, claimId: bigint) {
    const args = new TupleBuilder();
    args.writeNumber(claimId);
    const result = await provider.get("get_claim_details", args.build());
    return {
      claimant: result.stack.readAddress(),
      amount: result.stack.readBigNumber(),
      validAfter: result.stack.readBigNumber(),
      expiresAt: result.stack.readBigNumber(),
      status: result.stack.readNumber(),
    };
  }

  async getConfig(provider: ContractProvider) {
    const result = await provider.get("get_config", []);
    return {
      admin: result.stack.readAddress(),
      signerPublicKey: result.stack.readBigNumber(),
      distributionJettonWallet: result.stack.readAddress(),
      paused: result.stack.readNumber() !== 0,
    };
  }

  async getAuthorizationHash(
    provider: ContractProvider,
    input: {
      claimant: Address;
      claimId: bigint;
      amount: bigint;
      validAfter: bigint;
      expiresAt: bigint;
    },
  ) {
    const args = new TupleBuilder();
    args.writeAddress(input.claimant);
    args.writeNumber(input.claimId);
    args.writeNumber(input.amount);
    args.writeNumber(input.validAfter);
    args.writeNumber(input.expiresAt);
    const result = await provider.get("get_authorization_hash", args.build());
    return result.stack.readBigNumber();
  }
}
