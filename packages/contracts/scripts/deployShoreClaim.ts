import { Address, toNano } from "@ton/core";
import { compile } from "@ton/blueprint";
import type { NetworkProvider } from "@ton/blueprint";

import { ShoreClaim } from "../wrappers/ShoreClaim";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for Testnet deployment.`);
  return value;
}

export async function run(provider: NetworkProvider) {
  if (provider.network() !== "testnet") {
    throw new Error("SHORE claim deployment is locked to TON Testnet.");
  }

  const admin = Address.parse(requiredEnv("SHORE_CLAIM_ADMIN_ADDRESS"));
  const distributionJettonWallet = Address.parse(requiredEnv("SHORE_DISTRIBUTION_JETTON_WALLET"));
  const signerPublicKey = Buffer.from(requiredEnv("SHORE_CLAIM_SIGNER_PUBLIC_KEY_HEX"), "hex");
  if (signerPublicKey.length !== 32) {
    throw new Error("SHORE_CLAIM_SIGNER_PUBLIC_KEY_HEX must encode 32 bytes.");
  }

  const shoreClaim = provider.open(
    ShoreClaim.createFromConfig(
      { admin, signerPublicKey, distributionJettonWallet },
      await compile("ShoreClaim"),
    ),
  );

  await shoreClaim.sendDeploy(provider.sender(), toNano("0.2"));
  await provider.waitForDeploy(shoreClaim.address);
}
