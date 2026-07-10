import type { AppEnvironment } from "@shore/shared";

export type ProofReviewJob = {
  id: string;
  type: "proof-review";
  proofId: string;
  executionId: string;
  userId: string;
  createdAt: string;
};

export type AsyncJob = ProofReviewJob;

export type Bindings = {
  APP_ENV: AppEnvironment;
  CORS_ORIGIN: string;
  LOG_LEVEL: "debug" | "info" | "warn" | "error";
  TON_APP_DOMAIN: string;
  TON_NETWORK: "testnet" | "mainnet";
  SHORE_CLAIM_CONTRACT_ADDRESS?: string;
  SHORE_CLAIM_SIGNER_PUBLIC_KEY_HEX?: string;
  SHORE_CLAIM_SIGNER_SEED_BASE64?: string;
  ADMIN_REVIEW_TOKEN?: string;
  TELEGRAM_BOT_TOKEN?: string;
  DB: D1Database;
  PRIVATE_FILES: R2Bucket;
  ASYNC_JOBS: Queue<AsyncJob>;
};

export type AuthenticatedUser = {
  id: string;
  displayName: string;
  sessionId: string;
};

export type Variables = {
  requestId: string;
  user?: AuthenticatedUser;
};
