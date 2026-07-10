import { expect, test } from "@playwright/test";

test("renders a single text-free eighteen-stage map", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/");

  await expect(page.locator("main.round-map")).toBeVisible();
  await expect(page.locator(".round-node")).toHaveCount(18);
  await expect(page.locator("nav")).toHaveCount(0);
  await expect(page.locator("header")).toHaveCount(0);
  await expect(page.locator("main.round-map").getByText(/\S+/)).toHaveCount(0);
  await expect(page.locator(".round-node--complete")).toHaveCount(3);
  await expect(page.locator(".round-node--current")).toHaveCount(1);
  await expect(page.locator(".round-node--locked")).toHaveCount(14);
  await expect(page.locator(".final-chest")).toBeVisible();
  await expect(page.locator(".map-portal")).toBeVisible();

  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);

  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight * 2))
    .toBe(true);

  await page.getByRole("button", { name: "第1轮已完成" }).click();
  await expect(page.getByRole("button", { name: "第1轮已完成" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  expect(consoleErrors).toEqual([]);
});

test("keeps the route composition inside the viewport", async ({ page }) => {
  await page.goto("/");

  const stageBoxes = await page.locator(".round-node").evaluateAll((nodes) =>
    nodes.map((node) => {
      const box = node.getBoundingClientRect();
      return { left: box.left, right: box.right, width: window.innerWidth };
    }),
  );

  for (const box of stageBoxes) {
    expect(box.left).toBeGreaterThanOrEqual(-1);
    expect(box.right).toBeLessThanOrEqual(box.width + 1);
  }
});
