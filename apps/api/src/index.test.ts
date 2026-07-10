import { describe, expect, it } from "vitest";

import { app } from "./index";

const bindings = {
  APP_ENV: "local",
  CORS_ORIGIN: "http://localhost:3000",
  LOG_LEVEL: "debug",
} as never;

describe("GET /api/health", () => {
  it("returns a typed health response and request id", async () => {
    const response = await app.request(
      "/api/health",
      {
        headers: {
          origin: "http://localhost:3000",
          "x-request-id": "test-request-id",
        },
      },
      bindings,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBe("test-request-id");
    expect(response.headers.get("access-control-allow-origin")).toBe("http://localhost:3000");
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      service: "shore-api",
      environment: "local",
      requestId: "test-request-id",
    });
  });

  it("responds to an allowed CORS preflight", async () => {
    const response = await app.request(
      "/api/health",
      {
        method: "OPTIONS",
        headers: {
          origin: "http://localhost:3000",
          "access-control-request-method": "GET",
          "access-control-request-headers": "content-type,x-request-id",
        },
      },
      bindings,
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("http://localhost:3000");
    expect(response.headers.get("access-control-allow-methods")).toContain("GET");
  });

  it("does not echo an untrusted origin", async () => {
    const response = await app.request(
      "/api/health",
      {
        headers: {
          origin: "https://malicious.example",
        },
      },
      bindings,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });
});
