import { healthResponseSchema } from "@shore/shared";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { processProofReviewJob } from "./jobs/proof-review";
import { requireSession } from "./lib/auth";
import { ApiHttpError, errorResponse } from "./lib/http";
import { registerAdminRoutes } from "./routes/admin";
import { registerClaimRoutes } from "./routes/claims";
import { registerDashboardRoutes } from "./routes/dashboard";
import { registerMissionRoutes } from "./routes/missions";
import { registerSessionRoutes } from "./routes/session";
import { registerTelegramSessionRoute } from "./routes/telegram-session";
import { registerTonRoutes } from "./routes/ton";
import type { AsyncJob, Bindings, Variables } from "./types";

export const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use(
  "*",
  cors({
    origin: (origin, context) =>
      context.env.CORS_ORIGIN.split(",")
        .map((value: string) => value.trim())
        .includes(origin)
        ? origin
        : "",
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Request-Id",
      "X-Idempotency-Key",
      "X-Shore-Admin-Token",
    ],
    exposeHeaders: ["X-Request-Id"],
    credentials: true,
    maxAge: 600,
  }),
);

app.use("*", async (context, next) => {
  const incomingRequestId = context.req.header("x-request-id");
  const requestId = incomingRequestId?.trim() || crypto.randomUUID();

  context.set("requestId", requestId);
  await next();

  context.header("x-request-id", requestId);
  context.header("x-content-type-options", "nosniff");
  context.header("x-frame-options", "DENY");
  context.header("referrer-policy", "strict-origin-when-cross-origin");
  context.header("permissions-policy", "camera=(), microphone=(), geolocation=()");
});

app.get("/", (context) =>
  context.json({
    service: "shore-api",
    message: "SHORE operational API is running.",
    health: "/api/health",
    environment: context.env.APP_ENV,
  }),
);

app.get("/api/health", (context) => {
  const body = healthResponseSchema.parse({
    ok: true,
    service: "shore-api",
    environment: context.env.APP_ENV,
    timestamp: new Date().toISOString(),
    requestId: context.get("requestId"),
  });

  return context.json(body, 200, {
    "cache-control": "no-store",
  });
});

registerSessionRoutes(app);
registerTelegramSessionRoute(app);
registerAdminRoutes(app);

app.use("/api/v1/dashboard", requireSession);
app.use("/api/v1/missions/*", requireSession);
app.use("/api/v1/executions/*", requireSession);
app.use("/api/v1/proofs/*", requireSession);
app.use("/api/v1/ton-proof/*", requireSession);
app.use("/api/v1/claims/*", requireSession);

registerDashboardRoutes(app);
registerMissionRoutes(app);
registerTonRoutes(app);
registerClaimRoutes(app);

app.notFound((context) =>
  context.json(
    {
      error: {
        code: "NOT_FOUND",
        message: "The requested resource does not exist.",
        requestId: context.get("requestId"),
      },
    },
    404,
  ),
);

app.onError((error, context) => {
  if (error instanceof ApiHttpError) {
    return errorResponse(context, error);
  }

  console.error("shore_api_error", {
    requestId: context.get("requestId"),
    message: error.message,
    environment: context.env.APP_ENV,
  });

  return errorResponse(
    context,
    new ApiHttpError(500, "INTERNAL_ERROR", "An unexpected error occurred."),
  );
});

export default {
  fetch: app.fetch,
  async queue(batch: MessageBatch<AsyncJob>, env: Bindings): Promise<void> {
    for (const message of batch.messages) {
      try {
        if (message.body.type === "proof-review") {
          await processProofReviewJob(env, message.body);
        }
        message.ack();
      } catch (error) {
        console.error("shore_async_job_failed", {
          jobId: message.body.id,
          type: message.body.type,
          message: error instanceof Error ? error.message : String(error),
        });
        message.retry();
      }
    }
  },
} satisfies ExportedHandler<Bindings, AsyncJob>;
