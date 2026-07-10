# 上岸（SHORE）

> 负债不是身份，上岸才是目标。

“上岸”是一款面向负债用户的极简行动应用：用户建立负债目标，每天完成一个真实任务，积累积分与 SHORE 权益，并通过 18 轮路线查看当前阶段、领取状态和下一轮条件。

## 核心用户路径

```text
设置目标 → 完成任务 → 提交证明 → 连接钱包 → 领取 SHORE
```

所有用户操作都发生在同一个页面中，不进入多级菜单或其他功能页面。

## 当前阶段

**Phase 0 工程基线已经完成。当前前端采用 V3 单页十八轮交互地图。**

已经建立：

- pnpm Monorepo、Next.js/OpenNext Web 和 Hono Cloudflare API；
- D1、R2、Queues 三环境绑定结构；
- strict TypeScript、ESLint、Prettier、Vitest、Playwright 和 GitHub Actions；
- 单一纵向页面，不提供顶部导航、底部导航或其他业务路由；
- 深蓝紫背景、浅紫弯曲路线和十八个原创 Q 版 UI 关卡；
- 左上上岸进度球与右上 SHORE 资产球；
- 页面底部唯一主要操作按钮；
- 点击关卡后出现的 Q 版底部操作面板；
- 本地状态机与浏览器持久化；
- 设置负债、开始任务、提交证明、连接 TON 钱包 Mock、领取 SHORE Mock 的完整交互；
- 防止重复任务奖励和重复领取；
- 第 4 轮领取完成后自动点亮第 5 轮；
- 375×812、430×932、1280×900 三种屏幕 E2E；
- Cloudflare OpenNext/Workers dry-run 与本地 Web/API Smoke。

当前仍是交互原型阶段：

- 负债数据保存在浏览器本地；
- 账单上传和 AI 识别是 Mock；
- 任务审核是 Mock；
- TON Connect 是 Mock；
- SHORE 领取不会发起真实链上交易；
- 不连接主网资产或正式 Tolk 合约。

真实 Cloudflare Staging 部署需要先完成 Wrangler 账户登录和资源创建。

## 单页面交互结构

```text
18轮地图
├── 左上：上岸行动进度
├── 右上：SHORE资产
├── 关卡：轮次入口与解锁状态
├── 底部：当前唯一操作
└── 底部面板：目标、任务、证明、钱包、领取
```

页面保留必要的短操作文字和数字，但不提供长篇产品介绍、复杂菜单或多页面导航。

## 仓库结构

```text
apps/
  web/       单页用户前端与交互原型
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

`pnpm check` 执行格式、Lint、类型、单元测试和构建；`pnpm check:cloudflare` 生成 OpenNext Worker 并对 Web/API 执行 Wrangler dry-run；`pnpm smoke:local` 检查 Web/API 运行时；`pnpm test:e2e` 在三种屏幕下验证完整单页用户路径、18 轮状态变化、固定操作组件和无横向溢出。

## 主要文档

- [《上岸》产品开发文档 V1](docs/SHORE_PRODUCT_DEVELOPMENT_V1.md)
- [《上岸》上线运营完整开发计划 V1](docs/SHORE_PRODUCTION_DEVELOPMENT_PLAN_V1.md)
- [单页十八轮 Q 版交互系统 V3](docs/Q_FANTASY_UI_SYSTEM_V1.md)
- [系统架构](docs/ARCHITECTURE.md)
- [数据模型规则](docs/DATA_MODEL.md)
- [TON 合约不变量](docs/CONTRACT_INVARIANTS.md)
- [部署说明](docs/DEPLOYMENT.md)
- [安全边界](docs/SECURITY_BOUNDARIES.md)
- [环境变量与绑定](docs/ENVIRONMENT_VARIABLES.md)

## 产品原则

- 前端只有一个纵向业务页面；
- 不出现顶部导航、底部导航或人物角色；
- 十八个节点对应十八轮解锁；
- 地图负责展示阶段，底部面板负责操作；
- 页面底部永远只有一个当前主要动作；
- 使用 90% 视觉组件和 10% 必要短文字；
- 首次使用不要求真实钱包；
- 不将 Mock 奖励描述为真实链上资产；
- 不增加与负债目标、任务、证明、领取和十八轮解锁无关的功能；
- 未通过阶段退出门禁，不进入下一阶段。
