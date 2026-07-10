import { expect, test } from "@playwright/test";

test("renders the SHORE terminal across desktop and mobile layouts", async ({ page }, testInfo) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/");
  const mobile = testInfo.project.name !== "desktop";

  if (mobile) {
    await expect(
      page.locator(".terminal-mobile-header").getByText("SHORE.TERMINAL", { exact: true }),
    ).toBeVisible();
    await expect(
      page.locator(".terminal-mobile-header").getByText("STAGING · D1 LIVE", { exact: true }),
    ).toBeVisible();
  } else {
    await expect(
      page.locator(".terminal-header").getByText("SHORE.TERMINAL", { exact: true }),
    ).toBeVisible();
    await expect(page.locator(".ticker-demo")).toHaveText("DEMO DATA");
  }
  await expect(page.locator(".round-row")).toHaveCount(18);
  await expect(page.locator(".round-card")).toHaveCount(18);
  await expect(page.locator(".round-map")).toHaveCount(0);
  await expect(page.locator(".shore-mascot")).toHaveCount(0);

  if (mobile) {
    await expect(page.locator(".terminal-mobile-header")).toBeVisible();
    await expect(page.locator(".terminal-header")).toBeHidden();
    await expect(page.locator(".account-rail")).toBeHidden();
    await expect(page.locator(".execution-rail")).toBeHidden();
    await expect(page.locator(".mobile-action-bar")).toBeVisible();
    await expect(page.getByRole("tab")).toHaveCount(4);
    await expect(
      page.locator(".mobile-summary").getByText("¥173,740", { exact: true }),
    ).toBeVisible();
  } else {
    await expect(page.locator(".terminal-header")).toBeVisible();
    await expect(page.locator(".terminal-mobile-header")).toBeHidden();
    await expect(page.locator(".account-rail")).toBeVisible();
    await expect(page.locator(".execution-rail")).toBeVisible();
    await expect(page.getByText("上岸计划", { exact: true })).toBeVisible();
    await expect(
      page.locator(".execution-rail").getByText("今日推荐任务", { exact: true }),
    ).toBeVisible();
  }

  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);

  expect(consoleErrors).toEqual([]);
});

test("creates a D1 mission execution and submits Proof to the review pipeline", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  const mobile = testInfo.project.name !== "desktop";

  const scope = mobile
    ? page.locator(".terminal-mobile-only.terminal-mobile-section--active")
    : page.locator(".execution-rail");

  if (mobile) {
    await page.getByRole("tab", { name: "任务" }).click();
  }

  await expect(scope.getByRole("button", { name: "开始真实任务" })).toBeEnabled();
  await scope.getByRole("button", { name: "开始真实任务" }).click();
  await expect(scope.getByText("IN PROGRESS", { exact: true })).toBeVisible();

  await scope.getByPlaceholder("https://...").fill("https://example.com/e2e-proof");
  await scope
    .getByPlaceholder("描述完成步骤、真实体验和可验证结果…")
    .fill(
      "我完成了测试任务的完整新手流程，并记录了页面步骤、实际体验和可验证结果。此内容仅用于自动化验收。 ",
    );
  await scope.getByRole("button", { name: "提交私有Proof" }).click();

  await expect(scope.getByText(/QUEUED|MANUAL REVIEW/)).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
});

test("supports chart, account, round, and mobile section interactions", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  const mobile = testInfo.project.name !== "desktop";

  if (mobile) {
    await page.getByRole("tab", { name: "18轮" }).click();
    await expect(page.getByText("SHORE 18轮计划表", { exact: true })).toBeVisible();
    await page.locator(".round-card").nth(4).click();
    await expect(page.locator(".round-card").nth(4)).toHaveAttribute("aria-pressed", "true");

    await page
      .locator(".mobile-action-bar")
      .getByRole("button", { name: /开始任务/ })
      .click();
    await expect(page.getByRole("tab", { name: "任务" })).toHaveAttribute("aria-selected", "true");
    await expect(
      page
        .locator(".terminal-mobile-only.terminal-mobile-section--active")
        .getByText("完成 Telegram Mini App 新手流程并提交真实体验", { exact: true }),
    ).toBeVisible();

    await page.getByRole("tab", { name: "概览" }).click();
    await page.getByRole("button", { name: "18轮解锁" }).click();
    await expect(page.getByRole("button", { name: "18轮解锁" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  } else {
    await page.getByRole("button", { name: /SHORE权益/ }).click();
    await expect(page.getByRole("button", { name: /SHORE权益/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.getByRole("button", { name: "18轮解锁" }).click();
    await expect(page.getByRole("button", { name: "18轮解锁" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.locator(".round-row").nth(4).click();
    await expect(page.locator(".round-row").nth(4)).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.locator(".execution-rail .next-round-panel").getByText("R05", { exact: true }),
    ).toBeVisible();
  }

  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
});
