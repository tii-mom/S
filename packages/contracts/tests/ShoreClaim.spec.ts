import { randomBytes } from "node:crypto";

import { compile } from "@ton/blueprint";
import { Address, toNano } from "@ton/core";
import type { Cell } from "@ton/core";
import { keyPairFromSeed, sign, type KeyPair } from "@ton/crypto";
import { Blockchain } from "@ton/sandbox";
import type { SandboxContract, TreasuryContract } from "@ton/sandbox";
import "@ton/test-utils";

import {
  buildShoreClaimAuthorizationCell,
  SHORE_CLAIM_EXIT_CODES,
  SHORE_CLAIM_OPS,
  SHORE_CLAIM_RESOLUTION,
  SHORE_CLAIM_STATUS,
} from "../src";
import { ShoreClaim } from "../wrappers/ShoreClaim";

const TEST_NOW = 2_000_000_000;
const CLAIM_AMOUNT = 150_000n;

function bufferToBigInt(value: Buffer): bigint {
  return BigInt(`0x${value.toString("hex")}`);
}

describe("ShoreClaim", () => {
  let code: Cell;
  let blockchain: Blockchain;
  let admin: SandboxContract<TreasuryContract>;
  let claimant: SandboxContract<TreasuryContract>;
  let outsider: SandboxContract<TreasuryContract>;
  let distributionWallet: SandboxContract<TreasuryContract>;
  let signer: KeyPair;
  let shoreClaim: SandboxContract<ShoreClaim>;

  beforeAll(async () => {
    code = await compile("ShoreClaim");
  });

  beforeEach(async () => {
    blockchain = await Blockchain.create();
    blockchain.now = TEST_NOW;
    admin = await blockchain.treasury("admin");
    claimant = await blockchain.treasury("claimant");
    outsider = await blockchain.treasury("outsider");
    distributionWallet = await blockchain.treasury("distribution-wallet");
    signer = keyPairFromSeed(Buffer.alloc(32, 7));

    shoreClaim = blockchain.openContract(
      ShoreClaim.createFromConfig(
        {
          admin: admin.address,
          signerPublicKey: signer.publicKey,
          distributionJettonWallet: distributionWallet.address,
        },
        code,
      ),
    );

    const deployResult = await shoreClaim.sendDeploy(admin.getSender(), toNano("0.2"));
    expect(deployResult.transactions).toHaveTransaction({
      from: admin.address,
      to: shoreClaim.address,
      deploy: true,
      success: true,
    });
  });

  function signedClaim(
    input: {
      claimId?: bigint;
      amount?: bigint;
      validAfter?: bigint;
      expiresAt?: bigint;
      secretKey?: Buffer;
      claimantAddress?: Address;
    } = {},
  ) {
    const claimId = input.claimId ?? 42n;
    const amount = input.amount ?? CLAIM_AMOUNT;
    const validAfter = input.validAfter ?? BigInt(TEST_NOW - 5);
    const expiresAt = input.expiresAt ?? BigInt(TEST_NOW + 600);
    const claimantAddress = input.claimantAddress ?? claimant.address;
    const authorization = buildShoreClaimAuthorizationCell({
      contractAddress: shoreClaim.address,
      claimant: claimantAddress,
      claimId,
      amount,
      validAfter,
      expiresAt,
    });
    return {
      claimId,
      amount,
      validAfter,
      expiresAt,
      signature: sign(authorization.hash(), input.secretKey ?? signer.secretKey),
    };
  }

  it("deploys with the configured admin, signer and distribution wallet", async () => {
    const config = await shoreClaim.getConfig();
    expect(config.admin).toEqualAddress(admin.address);
    expect(config.signerPublicKey).toBe(bufferToBigInt(signer.publicKey));
    expect(config.distributionJettonWallet).toEqualAddress(distributionWallet.address);
    expect(config.paused).toBe(false);
  });

  it("uses the same authorization hash on-chain and off-chain", async () => {
    const request = signedClaim();
    const localHash = buildShoreClaimAuthorizationCell({
      contractAddress: shoreClaim.address,
      claimant: claimant.address,
      claimId: request.claimId,
      amount: request.amount,
      validAfter: request.validAfter,
      expiresAt: request.expiresAt,
    }).hash();
    const onchainHash = await shoreClaim.getAuthorizationHash({
      claimant: claimant.address,
      claimId: request.claimId,
      amount: request.amount,
      validAfter: request.validAfter,
      expiresAt: request.expiresAt,
    });

    expect(onchainHash).toBe(bufferToBigInt(localHash));
  });

  it("accepts a valid signed claim and emits a standard Jetton transfer", async () => {
    const request = signedClaim();
    const result = await shoreClaim.sendClaim(claimant.getSender(), request);

    expect(result.transactions).toHaveTransaction({
      from: claimant.address,
      to: shoreClaim.address,
      success: true,
    });
    expect(result.transactions).toHaveTransaction({
      from: shoreClaim.address,
      to: distributionWallet.address,
      success: true,
      body: (body) =>
        Boolean(body) && body!.beginParse().preloadUint(32) === SHORE_CLAIM_OPS.jettonTransfer,
    });
    expect(await shoreClaim.getClaimStatus(request.claimId)).toBe(SHORE_CLAIM_STATUS.pending);

    const details = await shoreClaim.getClaimDetails(request.claimId);
    expect(details.claimant).toEqualAddress(claimant.address);
    expect(details.amount).toBe(request.amount);
    expect(details.validAfter).toBe(request.validAfter);
    expect(details.expiresAt).toBe(request.expiresAt);
    expect(details.status).toBe(SHORE_CLAIM_STATUS.pending);
  });

  it("rejects duplicate claim IDs", async () => {
    const request = signedClaim();
    await shoreClaim.sendClaim(claimant.getSender(), request);
    const duplicate = await shoreClaim.sendClaim(claimant.getSender(), request);

    expect(duplicate.transactions).toHaveTransaction({
      from: claimant.address,
      to: shoreClaim.address,
      success: false,
      exitCode: SHORE_CLAIM_EXIT_CODES.claimAlreadyExists,
    });
  });

  it("rejects invalid, expired and not-yet-valid authorizations", async () => {
    const wrongSigner = keyPairFromSeed(Buffer.alloc(32, 9));
    const invalid = await shoreClaim.sendClaim(
      claimant.getSender(),
      signedClaim({ claimId: 1n, secretKey: wrongSigner.secretKey }),
    );
    expect(invalid.transactions).toHaveTransaction({
      from: claimant.address,
      to: shoreClaim.address,
      success: false,
      exitCode: SHORE_CLAIM_EXIT_CODES.invalidSignature,
    });

    const expired = await shoreClaim.sendClaim(
      claimant.getSender(),
      signedClaim({ claimId: 2n, expiresAt: BigInt(TEST_NOW - 1) }),
    );
    expect(expired.transactions).toHaveTransaction({
      success: false,
      exitCode: SHORE_CLAIM_EXIT_CODES.authorizationExpired,
    });

    const future = await shoreClaim.sendClaim(
      claimant.getSender(),
      signedClaim({ claimId: 3n, validAfter: BigInt(TEST_NOW + 1) }),
    );
    expect(future.transactions).toHaveTransaction({
      success: false,
      exitCode: SHORE_CLAIM_EXIT_CODES.authorizationFromFuture,
    });
  });

  it("binds the authorization to the calling wallet", async () => {
    const request = signedClaim({ claimantAddress: claimant.address });
    const result = await shoreClaim.sendClaim(outsider.getSender(), request);

    expect(result.transactions).toHaveTransaction({
      from: outsider.address,
      to: shoreClaim.address,
      success: false,
      exitCode: SHORE_CLAIM_EXIT_CODES.invalidSignature,
    });
  });

  it("enforces the minimum attached TON", async () => {
    const request = signedClaim();
    const result = await shoreClaim.sendClaim(claimant.getSender(), request, toNano("0.079"));

    expect(result.transactions).toHaveTransaction({
      success: false,
      exitCode: SHORE_CLAIM_EXIT_CODES.insufficientTon,
    });
  });

  it("allows only the administrator to pause and resolve claims", async () => {
    const unauthorized = await shoreClaim.sendSetPaused(outsider.getSender(), 1n, true);
    expect(unauthorized.transactions).toHaveTransaction({
      success: false,
      exitCode: SHORE_CLAIM_EXIT_CODES.unauthorized,
    });

    const paused = await shoreClaim.sendSetPaused(admin.getSender(), 2n, true);
    expect(paused.transactions).toHaveTransaction({ success: true });
    expect((await shoreClaim.getConfig()).paused).toBe(true);

    const blocked = await shoreClaim.sendClaim(claimant.getSender(), signedClaim({ claimId: 8n }));
    expect(blocked.transactions).toHaveTransaction({
      success: false,
      exitCode: SHORE_CLAIM_EXIT_CODES.paused,
    });

    await shoreClaim.sendSetPaused(admin.getSender(), 3n, false);
    const request = signedClaim({ claimId: 9n });
    await shoreClaim.sendClaim(claimant.getSender(), request);
    await shoreClaim.sendResolvePending(
      admin.getSender(),
      4n,
      request.claimId,
      SHORE_CLAIM_RESOLUTION.complete,
    );
    expect(await shoreClaim.getClaimStatus(request.claimId)).toBe(SHORE_CLAIM_STATUS.completed);
  });

  it("requires pause and a one-day delay before resetting a pending claim", async () => {
    const request = signedClaim({ claimId: 77n });
    await shoreClaim.sendClaim(claimant.getSender(), request);

    const withoutPause = await shoreClaim.sendResolvePending(
      admin.getSender(),
      1n,
      request.claimId,
      SHORE_CLAIM_RESOLUTION.reset,
    );
    expect(withoutPause.transactions).toHaveTransaction({
      success: false,
      exitCode: SHORE_CLAIM_EXIT_CODES.resetRequiresPause,
    });

    await shoreClaim.sendSetPaused(admin.getSender(), 2n, true);
    const tooEarly = await shoreClaim.sendResolvePending(
      admin.getSender(),
      3n,
      request.claimId,
      SHORE_CLAIM_RESOLUTION.reset,
    );
    expect(tooEarly.transactions).toHaveTransaction({
      success: false,
      exitCode: SHORE_CLAIM_EXIT_CODES.resetDelayActive,
    });

    blockchain.now = Number(request.expiresAt) + 86_401;
    const reset = await shoreClaim.sendResolvePending(
      admin.getSender(),
      4n,
      request.claimId,
      SHORE_CLAIM_RESOLUTION.reset,
    );
    expect(reset.transactions).toHaveTransaction({ success: true });
    expect(await shoreClaim.getClaimStatus(request.claimId)).toBe(SHORE_CLAIM_STATUS.none);
  });

  it("restores claimability when the initial Jetton wallet call bounces", async () => {
    const unreachableAddress = new Address(0, randomBytes(32));
    const bounceContract = blockchain.openContract(
      ShoreClaim.createFromConfig(
        {
          admin: admin.address,
          signerPublicKey: signer.publicKey,
          distributionJettonWallet: unreachableAddress,
        },
        code,
      ),
    );
    await bounceContract.sendDeploy(admin.getSender(), toNano("0.2"));

    const claimId = 500n;
    const amount = CLAIM_AMOUNT;
    const validAfter = BigInt(TEST_NOW - 5);
    const expiresAt = BigInt(TEST_NOW + 600);
    const signature = sign(
      buildShoreClaimAuthorizationCell({
        contractAddress: bounceContract.address,
        claimant: claimant.address,
        claimId,
        amount,
        validAfter,
        expiresAt,
      }).hash(),
      signer.secretKey,
    );

    const result = await bounceContract.sendClaim(claimant.getSender(), {
      claimId,
      amount,
      validAfter,
      expiresAt,
      signature,
    });

    expect(result.transactions).toHaveTransaction({
      from: unreachableAddress,
      to: bounceContract.address,
      inMessageBounced: true,
      success: true,
    });
    expect(await bounceContract.getClaimStatus(claimId)).toBe(SHORE_CLAIM_STATUS.none);
  });
});
