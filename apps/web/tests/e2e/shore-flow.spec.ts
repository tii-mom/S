import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test("completes the core SHORE mock journey", async ({ page }, testInfo) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await expect(page.getByRole("heading", { name: /每天做一件事/ })).toBeVisible();
  await expect(page.getByText("上岸仙岛", { exact: true }).first()).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);

  await page.screenshot({
    path: testInfo.outputPath("home-empty.png"),
    fullPage: true,
  });

  await page.getByRole("link", { name: /开始上岸/ }).click();
  await expect(page.getByRole("heading", { name: /你想从多少负债开始上岸/ })).toBeVisible();
  await page.getByLabel("负债总额").fill("186420");
  await page.getByRole("button", { name: /确认目标，开始上岸/ }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("¥186,420", { exact: true })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);

  await page.getByRole("link", { name: /写下今天的上岸宣言/ }).click();
  await expect(page.getByRole("heading", { name: "写下今天的上岸宣言" })).toBeVisible();
  await page.getByLabel("公开链接或 Mock 证明").fill("https://example.com/proof");
  await page.getByRole("button", { name: /提交并领取 300 积分/ }).click();

  await expect(page.getByText("验证成功", { exact: true })).toBeVisible();
  await expect(page.getByText(/本次获得 300 积分/)).toBeVisible();
  await page.getByRole("link", { name: /返回首页/ }).click();

  await expect(page.getByLabel("当前积分 300")).toBeVisible();
  await page.getByRole("link", { name: "金库" }).click();
  await expect(page.getByText("你已满足个人领取条件")).toBeVisible();
  await expect(page.getByText("150,000", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "首页", exact: true }).click();
  await page.getByRole("link", { name: /分享我的上岸进度/ }).click();
  await expect(page.getByRole("heading", { name: "今天又上岸了一步" })).toBeVisible();
  await expect(page.getByText("负债不是身份，上岸才是目标。", { exact: true })).toBeVisible();

  await page.screenshot({
    path: testInfo.outputPath("share-card.png"),
    fullPage: true,
  });

  expect(consoleErrors).toEqual([]);
});

test("renders all primary pages without horizontal overflow", async ({ page }) => {
  for (const path of [
    "/",
    "/debt",
    "/tasks",
    "/tasks/daily-story",
    "/vault",
    "/profile",
    "/share",
  ]) {
    await page.goto(path);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
  }
});
