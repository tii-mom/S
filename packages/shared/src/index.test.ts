import { describe, expect, it } from "vitest";

import { healthResponseSchema } from "./index";

describe("healthResponseSchema", () => {
  it("accepts a valid health response", () => {
    const parsed = healthResponseSchema.parse({
      ok: true,
      service: "shore-api",
      environment: "local",
      timestamp: new Date().toISOString(),
      requestId: "request-1",
    });

    expect(parsed.ok).toBe(true);
  });
});
