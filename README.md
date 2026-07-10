# 上岸（SHORE）

> 负债不是身份，上岸才是目标。

“上岸”是一套个人债务控制、Proof of Action任务和18轮SHORE权益管理系统。产品界面定位为：

```text
华尔街交易终端
+
个人债务控制台
+
Proof of Action任务网络
+
18轮SHORE解锁系统
```

## 当前阶段

**前端重构 Phase 0–3 已完成实现，等待视觉验收。**

当前工程保留S的技术底座：

- pnpm Monorepo；
- Next.js 16 + React 19；
- OpenNext Cloudflare Web Worker；
- 独立Hono API Worker；
- D1、R2、Queues与DLQ环境结构；
- strict TypeScript、Vitest、Playwright与GitHub Actions。

当前前端已删除原Q版地图，采用团队自有项目VC-vault的机构终端设计语言，并替换为上岸业务内容。

## Phase 0–3交付

### Phase 0：旧前端清理

已删除：

- Q版十八关地图；
- 宝石、宝箱和游戏路线组件；
- Q版底部操作面板；
- 旧浏览器状态机；
- 旧地图E2E测试。

### Phase 1：终端设计系统

已建立：

- 黑金终端视觉Token；
- 网格背景和扫描线；
- 实时Ticker；
- 等宽数字体系；
- 状态灯、Badge和数据面板；
- 金色资产、绿色验证、红色风险和蓝色资格状态；
- 原生SVG图表组件。

### Phase 2：桌面与移动端SHORE终端

桌面结构：

```text
顶部系统栏
实时Ticker
账户栏 | 中央工作区 | 执行控制栏
底部系统状态
```

手机结构：

```text
终端头部
网络状态
剩余负债
核心指标
概览 / 任务 / 18轮 / 动态
固定主要操作栏
```

手机端不是桌面三栏的缩小版，而是重新组织后的独立布局。

### Phase 3：上岸图表与18轮计划

已完成：

- 上岸累计覆盖价值曲线；
- 有效行动价值曲线；
- 18轮目标价曲线；
- 上岸进度/18轮解锁图表切换；
- 图表Hover和触摸反馈；
- 18轮桌面计划表；
- 18轮手机卡片；
- 价格、行动、协议收入和流动性四项门槛；
- 当前轮与选择轮联动；
- 下一轮多条件进度面板。

## 当前业务界面

### 左侧账户栏

- 上岸计划；
- 行动账户；
- SHORE权益。

### 中央主工作区

- 剩余负债；
- 原始目标与已覆盖价值；
- 今日行动收入；
- AP余额；
- SHORE权益；
- 待验证Proof；
- 双模式主图表；
- 18轮计划表。

### 右侧执行栏

- 今日推荐任务；
- 下一轮多条件进度；
- SHORE领取；
- 活动日志。

## 演示数据边界

当前仍是视觉与信息架构原型：

- 负债数字为Demo；
- Ticker不是实时行情；
- 任务按钮不创建真实任务；
- Proof没有真实上传或AI验证；
- SHORE余额和轮次状态不来自链上；
- 钱包按钮不连接TON；
- 不发生真实领取或资产转移；
- 页面明确显示 `DEMO DATA`、`STAGING` 和 `TESTNET`。

视觉验收通过后，才进入任务、D1、R2、Queues和TON真实接入。

## 仓库结构

```text
apps/
  web/       SHORE Terminal用户前端
  api/       Cloudflare Hono API与异步消费者
packages/
  shared/    公共Schema、常量与类型
docs/        产品、架构、视觉和部署文档
```

终端前端结构：

```text
apps/web/src/components/terminal/
  terminal-shell.tsx
  terminal-header.tsx
  ticker-tape.tsx
  account-rail.tsx
  recovery-hero.tsx
  recovery-chart.tsx
  round-schedule.tsx
  execution-rail.tsx
  terminal-primitives.tsx
  terminal-icons.tsx

apps/web/src/lib/shore-terminal/
  types.ts
  mock-data.ts
  formatters.ts
  mock-data.test.ts
```

## 本地开发

安装：

```bash
pnpm install
```

启动API：

```bash
pnpm --filter @shore/api dev
```

启动Web：

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

验证内容包括：

- 格式、Lint和严格类型；
- 单元测试；
- Next.js生产构建；
- OpenNext Cloudflare Worker打包；
- Web/API运行时Smoke；
- 375×812手机；
- 430×932手机；
- 1280×900桌面；
- 桌面三栏；
- 手机四区切换；
- 图表模式切换；
- 18轮选择；
- 无横向溢出。

## 主要文档

- [《上岸》产品开发文档 V1](docs/SHORE_PRODUCT_DEVELOPMENT_V1.md)
- [《上岸》上线运营完整开发计划 V1](docs/SHORE_PRODUCTION_DEVELOPMENT_PLAN_V1.md)
- [SHORE Terminal UI System V1](docs/SHORE_TERMINAL_UI_SYSTEM_V1.md)
- [系统架构](docs/ARCHITECTURE.md)
- [数据模型规则](docs/DATA_MODEL.md)
- [TON合约不变量](docs/CONTRACT_INVARIANTS.md)
- [部署说明](docs/DEPLOYMENT.md)
- [安全边界](docs/SECURITY_BOUNDARIES.md)
- [环境变量与绑定](docs/ENVIRONMENT_VARIABLES.md)

## 下一阶段

视觉验收通过后进入Phase 4：

```text
今日任务
→ 开始任务
→ 提交Proof
→ AI审核状态
→ 补充证明
→ 验证通过
→ 奖励与活动日志
```

之后依次接入：

```text
D1账户和Dashboard API
→ R2私有文件
→ Queues AI审核
→ TON Connect
→ Testnet领取
→ Tolk合约
```
