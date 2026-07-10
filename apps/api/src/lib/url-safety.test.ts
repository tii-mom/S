import { describe, expect, it } from "vitest";

import { ApiHttpError } from "./http";
import { validateEvidenceUrl } from "./url-safety";

describe("validateEvidenceUrl", () => {
  it("accepts a public HTTPS URL and removes the fragment", () => {
    expect(validateEvidenceUrl("https://example.com/proof?id=1#private-fragment")).toBe(
      "https://example.com/proof?id=1",
    );
  });

  it.each([
    "http://example.com/proof",
    "https://localhost/proof",
    "https://127.0.0.1/proof",
    "https://10.0.0.1/proof",
    "https://192.168.1.1/proof",
    "https://user:pass@example.com/proof",
  ])("rejects unsafe evidence URL %s", (value) => {
    expect(() => validateEvidenceUrl(value)).toThrow(ApiHttpError);
  });
});
