import { telegramWebAppUserSchema, type TelegramWebAppUser } from "@shore/shared";

import { constantTimeEqual } from "./crypto";
import { ApiHttpError } from "./http";

const encoder = new TextEncoder();
const DEFAULT_MAX_AGE_SECONDS = 60 * 60;

async function importHmacKey(key: Uint8Array): Promise<CryptoKey> {
  const keyBytes = key.slice().buffer as ArrayBuffer;
  return crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
}

async function hmacSha256(key: Uint8Array, value: string): Promise<Uint8Array> {
  const cryptoKey = await importHmacKey(key);
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(value));
  return new Uint8Array(signature);
}

function toHex(value: Uint8Array): string {
  return Array.from(value, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export type ValidatedTelegramInitData = {
  user: TelegramWebAppUser;
  authDate: Date;
  queryId: string | null;
  startParam: string | null;
};

export async function validateTelegramInitData(
  initData: string,
  botToken: string,
  options: {
    now?: Date;
    maxAgeSeconds?: number;
  } = {},
): Promise<ValidatedTelegramInitData> {
  if (!botToken.trim()) {
    throw new ApiHttpError(
      503,
      "TELEGRAM_AUTH_NOT_CONFIGURED",
      "Telegram authentication is not configured for this environment.",
    );
  }

  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash")?.toLowerCase() ?? "";
  if (!/^[0-9a-f]{64}$/.test(receivedHash)) {
    throw new ApiHttpError(
      422,
      "TELEGRAM_HASH_MISSING",
      "Telegram initData does not contain a valid hash.",
    );
  }

  const authDateRaw = params.get("auth_date");
  const authDateSeconds = Number(authDateRaw);
  if (!authDateRaw || !Number.isInteger(authDateSeconds) || authDateSeconds <= 0) {
    throw new ApiHttpError(
      422,
      "TELEGRAM_AUTH_DATE_INVALID",
      "Telegram initData contains an invalid auth_date.",
    );
  }

  const now = options.now ?? new Date();
  const maxAgeSeconds = options.maxAgeSeconds ?? DEFAULT_MAX_AGE_SECONDS;
  const ageSeconds = Math.floor(now.getTime() / 1000) - authDateSeconds;
  if (ageSeconds < -30 || ageSeconds > maxAgeSeconds) {
    throw new ApiHttpError(
      422,
      "TELEGRAM_INIT_DATA_EXPIRED",
      "Telegram initData is expired or has a future timestamp.",
    );
  }

  const dataCheckString = Array.from(params.entries())
    .filter(([key]) => key !== "hash")
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = await hmacSha256(encoder.encode("WebAppData"), botToken);
  const calculatedHash = toHex(await hmacSha256(secretKey, dataCheckString));
  if (!constantTimeEqual(calculatedHash, receivedHash)) {
    throw new ApiHttpError(
      401,
      "TELEGRAM_SIGNATURE_INVALID",
      "Telegram initData signature verification failed.",
    );
  }

  const rawUser = params.get("user");
  if (!rawUser) {
    throw new ApiHttpError(
      422,
      "TELEGRAM_USER_MISSING",
      "Telegram initData does not contain a user object.",
    );
  }

  let userJson: unknown;
  try {
    userJson = JSON.parse(rawUser);
  } catch {
    throw new ApiHttpError(422, "TELEGRAM_USER_INVALID", "Telegram user data is not valid JSON.");
  }

  const parsedUser = telegramWebAppUserSchema.safeParse(userJson);
  if (!parsedUser.success) {
    throw new ApiHttpError(
      422,
      "TELEGRAM_USER_INVALID",
      "Telegram user data failed validation.",
      parsedUser.error.flatten(),
    );
  }

  return {
    user: parsedUser.data,
    authDate: new Date(authDateSeconds * 1000),
    queryId: params.get("query_id"),
    startParam: params.get("start_param"),
  };
}
