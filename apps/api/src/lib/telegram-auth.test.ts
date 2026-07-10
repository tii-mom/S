import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import { ApiHttpError } from "./http";
import { validateTelegramInitData } from "./telegram-auth";

const credential = "123456:test-credential-for-unit-tests";
const now = new Date("2026-07-10T12:00:00.000Z");

function buildInitData(overrides: Record<string, string> = {}): string {
  const values = new Map<string, string>([
    ["auth_date", String(Math.floor(now.getTime() / 1000))],
    ["query_id", "AAE-test-query"],
    [
      "user",
      JSON.stringify({
        id: 123456789,
        first_name: "Alex",
        last_name: "Walker",
        username: "shore_tester",
        language_code: "zh-hans",
      }),
    ],
  ]);
  for (const [key, value] of Object.entries(overrides)) values.set(key, value);

  const dataCheckString = Array.from(values.entries())
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secret = createHmac("sha256", "WebAppData").update(credential).digest();
  const hash = createHmac("sha256", secret).update(dataCheckString).digest("hex");
  const params = new URLSearchParams(Array.from(values.entries()));
  params.set("hash", hash);
  return params.toString();
}

describe("validateTelegramInitData", () => {
  it("accepts signed Telegram Mini App initData", async () => {
    const validated = await validateTelegramInitData(buildInitData(), credential, { now });

    expect(validated.user.id).toBe(123456789);
    expect(validated.user.first_name).toBe("Alex");
    expect(validated.queryId).toBe("AAE-test-query");
  });

  it("includes the Bot API signature field in bot-token HMAC validation", async () => {
    const validated = await validateTelegramInitData(
      buildInitData({ signature: "third-party-signature-value" }),
      credential,
      { now },
    );

    expect(validated.user.username).toBe("shore_tester");
  });

  it("rejects tampered user data", async () => {
    const initData = new URLSearchParams(buildInitData());
    initData.set(
      "user",
      JSON.stringify({ id: 123456789, first_name: "Mallory", username: "shore_tester" }),
    );

    await expect(
      validateTelegramInitData(initData.toString(), credential, { now }),
    ).rejects.toBeInstanceOf(ApiHttpError);
  });

  it("rejects expired initData", async () => {
    const oldAuthDate = String(Math.floor(now.getTime() / 1000) - 7200);

    await expect(
      validateTelegramInitData(buildInitData({ auth_date: oldAuthDate }), credential, { now }),
    ).rejects.toMatchObject({ code: "TELEGRAM_INIT_DATA_EXPIRED" });
  });
});
