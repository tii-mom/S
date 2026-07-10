# 上岸（SHORE）

> 负债不是身份，上岸才是目标。

“上岸”是一款面向负债用户的极简行动应用：用户上传负债或直接输入金额，AI 计算上岸目标；用户每天完成一个真实任务，获得积分及 SHORE 代币权益，并通过分享上岸进度形成传播闭环。

## 核心用户路径

```text
上传负债 → 完成任务 → 领取上岸币
```

1. 上传负债或直接输入总额；
2. AI 计算并确认上岸目标；
3. 完成每日任务；
4. 获得积分和 SHORE；
5. 分享上岸进度。

## 当前阶段

**Phase 0 工程基线已经完成并合并。当前正在执行 Phase 1：原创 Q 版中国奇幻 Mock 用户闭环。**

已经建立：

- pnpm Monorepo、Next.js/OpenNext Web 和 Hono Cloudflare API；
- D1、R2、Queues 三环境绑定结构；
- strict TypeScript、ESLint、Prettier、Vitest、Playwright 和 GitHub Actions；
- 原创“上岸仙岛”Q版设计系统与吉祥物“岸宝”；
- 首页、负债、任务、任务详情、金库、我的和分享卡；
- 浏览器本地状态：负债目标、积分、任务完成、分享次数；
- 375×812、430×932、1280×900 三种屏幕 E2E；
- Cloudflare OpenNext/Workers dry-run 与本地 Web/API Smoke。

当前仍是 Mock 阶段，不连接真实 AI、TON 钱包、Tolk 合约或真实资产。真实 Cloudflare Staging 部署需要先完成 Wrangler 账户登录和资源创建。

## 仓库结构

```text
apps/
  web/       用户前端与后续运营后台
  api/       Cloudflare Worker API 与异步消费者
packages/
  shared/    公共常量、Schema 与类型
docs/        产品、开发计划与工程决策
```

Tolk 合约将在产品真实任务闭环验证后加入 `contracts/`。

## 本地开发

安装：

```bash
pnpm install
```

启动 API：

```bash
pnpm --filter @shore/api dev
```

启动 Web：

```bash
pnpm --filter @shore/web dev
```

默认地址：

```text
Web: http://localhost:3000
API: http://localhost:8787
Health: http://localhost:8787/api/health
```

## 验证命令

```bash
pnpm check
pnpm check:cloudflare
pnpm smoke:local
pnpm test:e2e
```

`pnpm check` 执行格式、Lint、类型、单元测试和构建；`pnpm check:cloudflare` 生成 OpenNext Worker 并对 Web/API 执行 Wrangler dry-run；`pnpm smoke:local` 检查 Web/API 运行时；`pnpm test:e2e` 在三种屏幕下验证完整 Mock 用户路径。

## 主要文档

- [《上岸》产品开发文档 V1](docs/SHORE_PRODUCT_DEVELOPMENT_V1.md)
- [《上岸》上线运营完整开发计划 V1](docs/SHORE_PRODUCTION_DEVELOPMENT_PLAN_V1.md)
- [Q版中国奇幻视觉系统 V1](docs/Q_FANTASY_UI_SYSTEM_V1.md)
- [系统架构](docs/ARCHITECTURE.md)
- [数据模型规则](docs/DATA_MODEL.md)
- [TON 合约不变量](docs/CONTRACT_INVARIANTS.md)
- [部署说明](docs/DEPLOYMENT.md)
- [安全边界](docs/SECURITY_BOUNDARIES.md)
- [环境变量与绑定](docs/ENVIRONMENT_VARIABLES.md)

## 产品原则

- 用户 3 秒理解产品；
- 首次使用不要求钱包；
- 每个页面只有一个主要操作；
- 首页只推荐一个今日任务；
- 提交证明最多两步；
- 不增加小队、复杂等级、NFT、DAO、多链等非核心功能；
- 未通过阶段退出门禁，不进入下一阶段。
