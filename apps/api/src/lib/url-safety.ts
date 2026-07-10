import { ApiHttpError } from "./http";

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);
  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return false;
  }
  const [a, b] = parts as [number, number, number, number];
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

function isPrivateIpv6(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replaceAll("[", "").replaceAll("]", "");
  return (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  );
}

export function validateEvidenceUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ApiHttpError(422, "INVALID_EVIDENCE_URL", "Evidence URL must be a valid HTTPS URL.");
  }

  if (url.protocol !== "https:") {
    throw new ApiHttpError(422, "INVALID_EVIDENCE_PROTOCOL", "Evidence URL must use HTTPS.");
  }
  if (url.username || url.password) {
    throw new ApiHttpError(
      422,
      "CREDENTIAL_URL_BLOCKED",
      "Credential-bearing evidence URLs are not allowed.",
    );
  }

  const hostname = url.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    isPrivateIpv4(hostname) ||
    isPrivateIpv6(hostname)
  ) {
    throw new ApiHttpError(
      422,
      "PRIVATE_URL_BLOCKED",
      "Private or local evidence URLs are not allowed.",
    );
  }

  url.hash = "";
  return url.toString();
}
