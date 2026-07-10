import { describe, expect, it } from "vitest";

import { foundationItems, userPath } from "./foundation";

describe("foundation model", () => {
  it("keeps the product path limited to three actions", () => {
    expect(userPath).toHaveLength(3);
    expect(userPath[0]).toBe("上传负债");
  });

  it("defines the four baseline systems", () => {
    expect(foundationItems.map((item) => item.label)).toEqual(["Web", "API", "Data", "Chain"]);
  });
});
