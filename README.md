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

正在执行 **Phase 0：SHORE Foundation & Cloudflare Staging Baseline V1**。

已经建立：

- pnpm Monorepo；
- Next.js + OpenNext Cloudflare Web；
- Hono Cloudflare API Worker；
- D1、R2、Queues 三环境绑定结构；
- strict TypeScript、ESLint、Prettier、Vitest、Turborepo；
- GitHub Actions CI；
- `/api/health` 健康检查；
- Cloudflare `workerd` 打包验证；
- 架构、数据、合约不变量、部署和安全边界文档。

真实 Cloudflare Staging 部署需要先完成 Wrangler 账户登录和资源创建。

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
```

`pnpm check` 执行格式、Lint、类型、测试和构建。`pnpm check:cloudflare` 额外生成 OpenNext Worker，并对 Web/API 执行 Wrangler dry-run。

## 主要文档

- [《上岸》产品开发文档 V1](docs/SHORE_PRODUCT_DEVELOPMENT_V1.md)
- [《上岸》上线运营完整开发计划 V1](docs/SHORE_PRODUCTION_DEVELOPMENT_PLAN_V1.md)
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
