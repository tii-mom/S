import { z } from "zod";

export const APP_NAME = "上岸";
export const TOKEN_SYMBOL = "SHORE";

export const appEnvironmentSchema = z.enum(["local", "staging", "production"]);
export type AppEnvironment = z.infer<typeof appEnvironmentSchema>;

export const healthResponseSchema = z.object({
  ok: z.literal(true),
  service: z.string().min(1),
  environment: appEnvironmentSchema,
  timestamp: z.string().datetime(),
  requestId: z.string().min(1),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const sessionBootstrapRequestSchema = z.object({
  displayName: z.string().trim().min(1).max(80).default("SHORE Staging User"),
});

export const sessionBootstrapResponseSchema = z.object({
  token: z.string().min(32),
  expiresAt: z.string().datetime(),
  user: z.object({
    id: z.string().min(1),
    displayName: z.string().min(1),
  }),
});

export const telegramSessionRequestSchema = z.object({
  initData: z.string().min(1).max(16_000),
});

export const telegramWebAppUserSchema = z.object({
  id: z.number().int().positive(),
  first_name: z.string().min(1).max(128),
  last_name: z.string().max(128).optional(),
  username: z.string().max(64).optional(),
  language_code: z.string().max(16).optional(),
  is_premium: z.boolean().optional(),
  allows_write_to_pm: z.boolean().optional(),
  photo_url: z.string().url().optional(),
});
export type TelegramWebAppUser = z.infer<typeof telegramWebAppUserSchema>;
export type SessionBootstrapResponse = z.infer<typeof sessionBootstrapResponseSchema>;

export const missionRiskSchema = z.enum(["low", "medium", "high"]);
export const missionStatusSchema = z.enum(["draft", "active", "paused", "closed"]);
export const executionStatusSchema = z.enum([
  "started",
  "proof_pending",
  "manual_review",
  "approved",
  "rejected",
  "resubmission_required",
  "cancelled",
]);
export const proofStatusSchema = z.enum([
  "queued",
  "manual_review",
  "approved",
  "rejected",
  "resubmission_required",
]);
export const roundStatusSchema = z.enum([
  "completed",
  "claimable",
  "qualified",
  "active",
  "locked",
]);

export const missionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  platform: z.string().min(1),
  estimatedMinutes: z.number().int().positive(),
  stableRewardMinor: z.number().int().nonnegative(),
  stableRewardCurrency: z.string().length(3),
  apReward: z.number().int().nonnegative(),
  shoreRightsReward: z.number().int().nonnegative(),
  riskLevel: missionRiskSchema,
  verificationMethod: z.string().min(1),
  proofInstructions: z.string().min(1),
  status: missionStatusSchema,
});
export type Mission = z.infer<typeof missionSchema>;

export const proofSubmissionSchema = z.object({
  id: z.string().min(1),
  executionId: z.string().min(1),
  evidenceUrl: z.string().url().nullable(),
  hasPrivateFile: z.boolean(),
  originalFilename: z.string().nullable(),
  note: z.string().min(1),
  status: proofStatusSchema,
  reviewReason: z.string().nullable(),
  createdAt: z.string().datetime(),
  reviewedAt: z.string().datetime().nullable(),
});
export type ProofSubmission = z.infer<typeof proofSubmissionSchema>;

export const missionExecutionSchema = z.object({
  id: z.string().min(1),
  missionId: z.string().min(1),
  status: executionStatusSchema,
  startedAt: z.string().datetime(),
  submittedAt: z.string().datetime().nullable(),
  reviewedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  proof: proofSubmissionSchema.nullable(),
});
export type MissionExecution = z.infer<typeof missionExecutionSchema>;

export const roundSchema = z.object({
  round: z.number().int().min(1).max(18),
  targetPriceDecimal: z.string().regex(/^\d+\.\d+$/),
  requiredActions: z.number().int().nonnegative(),
  requiredRevenueMinor: z.number().int().nonnegative(),
  requiredLiquidityMinor: z.number().int().nonnegative(),
  personalRequirement: z.string().min(1),
  releaseAmount: z.number().int().nonnegative(),
  status: roundStatusSchema,
  priceProgress: z.number().int().min(0).max(100),
  actionProgress: z.number().int().min(0).max(100),
  revenueProgress: z.number().int().min(0).max(100),
  liquidityProgress: z.number().int().min(0).max(100),
});
export type ShoreRound = z.infer<typeof roundSchema>;

export const walletNetworkSchema = z.enum(["testnet", "mainnet"]);
export const verifiedWalletSchema = z.object({
  addressRaw: z.string().min(1),
  addressFriendly: z.string().min(1),
  network: walletNetworkSchema,
  walletApp: z.string().nullable(),
  proofVerifiedAt: z.string().datetime(),
});
export type VerifiedWallet = z.infer<typeof verifiedWalletSchema>;

export const claimReadinessSchema = z.object({
  status: z.enum([
    "wallet_required",
    "entitlement_required",
    "contract_not_configured",
    "signer_not_configured",
    "ready_testnet",
    "mainnet_disabled",
  ]),
  reason: z.string().min(1),
  claimableAmount: z.number().int().nonnegative(),
  contractAddress: z.string().nullable(),
  network: walletNetworkSchema,
});
export type ClaimReadiness = z.infer<typeof claimReadinessSchema>;

export const activityEventSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().datetime(),
  eventType: z.string().min(1),
  title: z.string().min(1),
  detail: z.string(),
  status: z.enum(["success", "pending", "neutral", "error"]),
});
export type ActivityEvent = z.infer<typeof activityEventSchema>;

export const dashboardResponseSchema = z.object({
  source: z.literal("d1"),
  environment: appEnvironmentSchema,
  user: z.object({
    id: z.string().min(1),
    displayName: z.string().min(1),
  }),
  debt: z.object({
    currency: z.literal("CNY"),
    originalMinor: z.number().int().nonnegative(),
    coveredMinor: z.number().int().nonnegative(),
    remainingMinor: z.number().int().nonnegative(),
    coverageBasisPoints: z.number().int().min(0).max(10000),
  }),
  balances: z.object({
    ap: z.number().int(),
    shoreLocked: z.number().int().nonnegative(),
    shoreClaimable: z.number().int().nonnegative(),
    shoreClaimed: z.number().int().nonnegative(),
  }),
  counts: z.object({
    verifiedActions: z.number().int().nonnegative(),
    pendingProofs: z.number().int().nonnegative(),
  }),
  mission: missionSchema,
  execution: missionExecutionSchema.nullable(),
  rounds: z.array(roundSchema).length(18),
  activities: z.array(activityEventSchema),
  wallet: verifiedWalletSchema.nullable(),
  claimReadiness: claimReadinessSchema,
  generatedAt: z.string().datetime(),
});
export type DashboardResponse = z.infer<typeof dashboardResponseSchema>;

export const startMissionResponseSchema = z.object({
  execution: missionExecutionSchema,
});
export type StartMissionResponse = z.infer<typeof startMissionResponseSchema>;

export const submitProofResponseSchema = z.object({
  execution: missionExecutionSchema,
  queuedJobId: z.string().min(1),
});
export type SubmitProofResponse = z.infer<typeof submitProofResponseSchema>;

export const adminProofReviewRequestSchema = z.object({
  decision: z.enum(["approve", "reject", "request_resubmission"]),
  reason: z.string().trim().min(3).max(500),
});

export const tonProofNonceResponseSchema = z.object({
  nonce: z.string().min(32),
  expiresAt: z.string().datetime(),
  network: walletNetworkSchema,
});
export type TonProofNonceResponse = z.infer<typeof tonProofNonceResponseSchema>;

export const tonProofPayloadSchema = z.object({
  timestamp: z.number().int().positive(),
  domain: z.object({
    lengthBytes: z.number().int().positive(),
    value: z.string().min(1),
  }),
  payload: z.string().min(1),
  signature: z.string().min(1),
});

export const verifyTonProofRequestSchema = z.object({
  address: z.string().min(1),
  walletStateInit: z.string().min(1),
  network: z.string().min(1),
  walletApp: z.string().trim().max(100).optional(),
  proof: tonProofPayloadSchema,
});
export type VerifyTonProofRequest = z.infer<typeof verifyTonProofRequestSchema>;

export const verifyTonProofResponseSchema = z.object({
  wallet: verifiedWalletSchema,
});
export type VerifyTonProofResponse = z.infer<typeof verifyTonProofResponseSchema>;

export const tonConnectTransactionSchema = z.object({
  validUntil: z.number().int().positive(),
  network: z.literal("-3"),
  messages: z
    .array(
      z.object({
        address: z.string().min(1),
        amount: z.string().regex(/^\d+$/),
        payload: z.string().min(1),
      }),
    )
    .length(1),
});
export type TonConnectTransaction = z.infer<typeof tonConnectTransactionSchema>;

export const claimIntentResponseSchema = z.object({
  status: z.enum(["blocked", "prepared"]),
  code: z.string().min(1),
  message: z.string().min(1),
  claimId: z.string().nullable(),
  onchainClaimId: z.string().regex(/^\d+$/).nullable(),
  network: walletNetworkSchema,
  contractAddress: z.string().nullable(),
  amount: z.number().int().nonnegative(),
  authorizationExpiresAt: z.string().datetime().nullable(),
  transaction: tonConnectTransactionSchema.nullable(),
});
export type ClaimIntentResponse = z.infer<typeof claimIntentResponseSchema>;

export const claimSubmissionRequestSchema = z.object({
  boc: z.string().min(16).max(32_000),
});

export const claimSubmissionResponseSchema = z.object({
  claimId: z.string().min(1),
  status: z.literal("submitted"),
  submittedAt: z.string().datetime(),
});
export type ClaimSubmissionResponse = z.infer<typeof claimSubmissionResponseSchema>;

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    requestId: z.string().min(1),
    details: z.unknown().optional(),
  }),
});
export type ApiError = z.infer<typeof apiErrorSchema>;
