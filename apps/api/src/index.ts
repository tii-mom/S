import { healthResponseSchema } from "@shore/shared";
import { Hono } from "hono";
import { cors } from "hono/cors";

export type AppEnvironment = "local" | "staging" | "production";

export type AsyncJob = {
  id: string;
  type: "health-probe";
  createdAt: string;
};

type Bindings = {
  APP_ENV: AppEnvironment;
  CORS_ORIGIN: string;
  LOG_LEVEL: "debug" | "info" | "warn" | "error";
  DB: D1Database;
  PRIVATE_FILES: R2Bucket;
  ASYNC_JOBS: Queue<AsyncJob>;
};

type Variables = {
  requestId: string;
};

export const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use(
  "*",
  cors({
    origin: (origin, context) => (origin === context.env.CORS_ORIGIN ? origin : ""),
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Request-Id", "X-Idempotency-Key"],
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
});

app.get("/", (context) =>
  context.json({
    service: "shore-api",
    message: "SHORE API foundation is running.",
    health: "/api/health",
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
  console.error("shore_api_error", {
    requestId: context.get("requestId"),
    message: error.message,
  });

  return context.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred.",
        requestId: context.get("requestId"),
      },
    },
    500,
  );
});

export default {
  fetch: app.fetch,
  async queue(batch: MessageBatch<AsyncJob>): Promise<void> {
    for (const message of batch.messages) {
      console.log("shore_async_job_received", {
        jobId: message.body.id,
        type: message.body.type,
      });
      message.ack();
    }
  },
} satisfies ExportedHandler<Bindings, AsyncJob>;
