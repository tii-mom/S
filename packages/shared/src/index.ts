import { z } from "zod";

export const APP_NAME = "上岸";
export const TOKEN_SYMBOL = "SHORE";

export const healthResponseSchema = z.object({
  ok: z.literal(true),
  service: z.string().min(1),
  environment: z.enum(["local", "staging", "production"]),
  timestamp: z.string().datetime(),
  requestId: z.string().min(1),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
