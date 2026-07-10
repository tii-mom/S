import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test("keeps the 18-round map as the only page and exposes lightweight controls", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await expect(page.locator("main.round-map")).toBeVisible();
  await expect(page.locator(".round-node")).toHaveCount(18);
  await expect(page.locator("nav")).toHaveCount(0);
  await expect(page.locator("header")).toHaveCount(0);
  await expect(page.locator(".round-node--complete")).toHaveCount(3);
  await expect(page.locator(".round-node--current")).toHaveCount(1);
  await expect(page.locator(".round-node--locked")).toHaveCount(14);
  await expect(page.getByRole("button", { name: "查看上岸进度" })).toBeVisible();
  await expect(page.getByRole("button", { name: "查看SHORE资产" })).toBeVisible();
  await expect(page.getByRole("button", { name: "开始上岸" })).toBeVisible();

  await page.getByRole("button", { name: "第18轮未解锁" }).click();
  await expect(page.getByRole("heading", { name: "尚未解锁" })).toBeVisible();
  await expect(page.getByText("价格与全网行动同时达标后开启。")).toBeVisible();
  await page.getByRole("button", { name: "关闭", exact: true }).click();

  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight * 2))
    .toBe(true);

  expect(consoleErrors).toEqual([]);
});

test("completes the full single-page product journey", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.getByRole("button", { name: "开始上岸" }).click();
  await expect(page.getByRole("heading", { name: "设置上岸目标" })).toBeVisible();
  await page.getByLabel("负债总额").fill("186420");
  await page.getByRole("button", { name: "确认", exact: true }).click();

  await expect(page.getByRole("button", { name: "开始任务" })).toBeVisible();
  await page.getByRole("button", { name: "开始任务" }).click();
  const taskSheet = page.getByRole("dialog", { name: "操作面板" });
  await expect(taskSheet.getByRole("heading", { name: "发布一条上岸行动记录" })).toBeVisible();
  await taskSheet.getByRole("button", { name: "开始任务", exact: true }).click();

  await expect(page.getByRole("button", { name: "提交证明" })).toBeVisible();
  await page.getByRole("button", { name: "提交证明" }).click();
  await expect(page.getByRole("heading", { name: "提交证明" })).toBeVisible();
  await page.getByLabel("证明链接").fill("https://example.com/shore-proof");
  await page.getByRole("button", { name: "提交", exact: true }).click();

  await expect(page.getByRole("heading", { name: "验证通过" })).toBeVisible();
  await expect(page.getByText("奖励已记录，下一步连接钱包领取 SHORE。")).toBeVisible();
  await page.getByRole("button", { name: "继续" }).click();

  await expect(page.getByRole("button", { name: "连接钱包" })).toBeVisible();
  await page.getByRole("button", { name: "连接钱包" }).click();
  await expect(page.getByRole("heading", { name: "连接钱包" })).toBeVisible();
  await page.getByRole("button", { name: "连接 TON 钱包" }).click();

  await expect(page.getByRole("button", { name: "领取 SHORE" })).toBeVisible();
  await page.getByRole("button", { name: "领取 SHORE" }).click();
  await expect(page.getByRole("heading", { name: "150,000 SHORE" })).toBeVisible();
  await page.getByRole("button", { name: "领取 150,000" }).click();

  await expect(page.getByRole("heading", { name: "领取成功" })).toBeVisible();
  await expect(page.getByText("第 4 轮已经完成，第 5 轮进入准备状态。")).toBeVisible();
  await page.getByRole("button", { name: "继续" }).click();

  await expect(page.getByRole("button", { name: "查看SHORE资产" })).toContainText("150,000");
  await expect(page.locator(".round-node--complete")).toHaveCount(4);
  await expect(page.locator(".round-node--current")).toHaveCount(1);
  await expect(page.locator(".round-node--locked")).toHaveCount(13);
  await expect(page.getByRole("button", { name: "等待下一轮" })).toBeDisabled();

  await page.getByRole("button", { name: "查看上岸进度" }).click();
  const progressSheet = page.getByRole("dialog", { name: "操作面板" });
  await expect(progressSheet.getByRole("heading", { name: "¥186,420" })).toBeVisible();
  await expect(progressSheet.getByText("10%", { exact: true })).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("keeps every stage and fixed control inside the viewport", async ({ page }) => {
  const selectors = [".round-node", ".status-orb", ".primary-dock__button"];

  for (const selector of selectors) {
    const boxes = await page.locator(selector).evaluateAll((nodes) =>
      nodes.map((node) => {
        const box = node.getBoundingClientRect();
        return { left: box.left, right: box.right, width: window.innerWidth };
      }),
    );

    for (const box of boxes) {
      expect(box.left).toBeGreaterThanOrEqual(-1);
      expect(box.right).toBeLessThanOrEqual(box.width + 1);
    }
  }
});
