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

**Phase 0 工程基线已经完成。当前前端采用 V2 单页十八轮解锁地图。**

已经建立：

- pnpm Monorepo、Next.js/OpenNext Web 和 Hono Cloudflare API；
- D1、R2、Queues 三环境绑定结构；
- strict TypeScript、ESLint、Prettier、Vitest、Playwright 和 GitHub Actions；
- 单一纵向页面，不提供顶部栏、底部栏或其他页面导航；
- 深蓝紫背景、浅紫弯曲路线和十八个 Q 版 UI 关卡；
- 三个已完成节点、一个当前节点和十四个锁定节点；
- 关卡仅使用宝石、星星、钥匙、盾牌、宝箱等原创 UI 图形，不使用人物；
- 375×812、430×932、1280×900 三种屏幕 E2E；
- Cloudflare OpenNext/Workers dry-run 与本地 Web/API Smoke。

当前页面只负责表现十八轮解锁结构，不连接真实 AI、TON 钱包、Tolk 合约或真实资产。真实 Cloudflare Staging 部署需要先完成 Wrangler 账户登录和资源创建。

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

`pnpm check` 执行格式、Lint、类型、单元测试和构建；`pnpm check:cloudflare` 生成 OpenNext Worker 并对 Web/API 执行 Wrangler dry-run；`pnpm smoke:local` 检查 Web/API 运行时；`pnpm test:e2e` 在三种屏幕下验证单页面、十八节点、无可见文字、无导航和无横向溢出。

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

- 前端只有一个纵向页面；
- 页面不显示可见文字、人物、顶部栏或底部栏；
- 十八个节点对应十八轮解锁；
- 关卡状态只通过颜色、光效、勾选和锁定图标表达；
- 所有装饰均为原创 Q 版 UI 组件；
- 不增加与十八轮解锁无关的页面和功能；
- 未通过阶段退出门禁，不进入下一阶段。
