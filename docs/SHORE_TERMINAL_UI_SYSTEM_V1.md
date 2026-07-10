# SHORE Terminal UI System V1

## 1. 产品定位

SHORE Terminal 是“上岸”的统一执行界面，组合四种产品能力：

```text
华尔街交易终端
+
个人债务控制台
+
Proof of Action 任务网络
+
18轮 SHORE 解锁系统
```

本版本覆盖前端重构 Phase 0–3，只提供经过明确标识的演示数据，不接入真实任务、D1账户、TON钱包或Tolk合约。

## 2. 技术裁决

工程底座继续使用 S：

- Next.js 16 App Router；
- React 19；
- OpenNext Cloudflare Worker；
- 独立 Hono API Worker；
- D1、R2、Queues、DLQ 预留；
- Playwright、Vitest、strict TypeScript。

视觉与组件语言参考团队自有项目 VC-vault，但不迁移：

- TanStack Start运行时；
- Nitro服务端；
- better-sqlite3；
- G Token业务；
- 邀请购买、销毁和旧合约逻辑。

## 3. Phase 0–3 完成范围

### Phase 0：冻结与清理

已删除：

- Q版十八关地图；
- 宝石、宝箱、人物化游戏组件；
- 单页Q版底部弹层；
- 旧浏览器任务状态机；
- 对应旧E2E路径。

### Phase 1：终端设计系统

已建立：

- 黑色机构终端背景；
- 暖金资产色；
- 青绿验证色；
- 红色风险色；
- 蓝色资格色；
- 等宽数字字体体系；
- 细边框数据面板；
- 网格背景与扫描线；
- 状态灯和实时Ticker；
- 表格、Badge、指标单元和主要操作按钮。

### Phase 2：桌面与移动端SHORE终端

桌面采用三栏：

```text
账户栏 | 主工作区 | 执行控制栏
```

移动端重新编排为：

```text
终端头部
网络状态
剩余负债总览
核心指标
概览 / 任务 / 18轮 / 动态
固定主要操作栏
```

移动端不是桌面版缩放，不显示桌面账户栏和执行栏。

### Phase 3：图表与18轮计划

已完成：

- 原生SVG上岸进度图；
- 累计覆盖价值曲线；
- 有效行动价值曲线；
- 18轮目标价图；
- 图表模式切换；
- Hover或触摸十字线；
- 18轮桌面表格；
- 18轮手机卡片；
- 当前轮与选择轮联动；
- 多条件解锁进度。

## 4. 桌面信息架构

### 顶部终端栏

展示：

- SHORE.TERMINAL；
- AI Verify状态；
- Task Network状态；
- TON环境；
- 风险状态；
- 剩余负债；
- 待领取SHORE；
- 钱包入口。

### 实时Ticker

只显示与上岸相关的指标：

- SHORE/USDT；
- TON/USDT；
- 全网有效行动；
- 广告主预算；
- 协议收入；
- 当前轮次。

所有当前值明确标注 `DEMO DATA`。

### 左侧账户栏

三个上下文：

1. 上岸计划；
2. 行动账户；
3. SHORE权益。

### 中央主工作区

首要数字为剩余负债，其次展示：

- 原始目标；
- 已覆盖价值；
- 完成进度；
- 今日行动收入；
- AP余额；
- SHORE权益；
- 待验证Proof。

### 右侧执行栏

仅保留：

- 今日推荐任务；
- 下一轮多条件进度；
- SHORE领取；
- 活动日志。

## 5. 18轮模型

18轮计划字段：

```text
轮次
目标价
有效行动
协议收入
个人要求
本轮释放
状态
```

状态：

```text
COMPLETED
CLAIMABLE
QUALIFIED
ACTIVE
LOCKED
```

当前演示状态：

- R01–R03：COMPLETED；
- R04：ACTIVE；
- R05：QUALIFIED；
- R06–R18：LOCKED。

总体进度取四个条件的最小值：

```text
min(价格, 有效行动, 协议收入, 流动性)
```

当前R04演示数据：

```text
价格 82%
行动 67%
收入 54%
流动性 91%
总体 54%
```

## 6. Mock边界

Phase 0–3 不得被描述为真实业务运行状态：

- 负债为演示数据；
- 任务按钮不创建真实任务；
- Proof没有真实上传和验证；
- Ticker不是实时市场行情；
- 钱包按钮不连接TON；
- SHORE余额和领取为演示；
- 18轮数据不来自合约；
- 不承诺代币价格、收益或债务偿还结果。

## 7. 代码结构

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

## 8. 响应式标准

验收视口：

```text
375 × 812
430 × 932
1280 × 900
```

要求：

- 不出现横向滚动；
- 桌面显示三栏；
- 手机隐藏桌面头部、账户栏和执行栏；
- 手机四个区域切换可用；
- 手机固定操作栏不遮挡内容；
- 图表提示框不超出画布；
- 18轮在桌面显示表格、手机显示卡片；
- 支持 `prefers-reduced-motion`。

## 9. 下一阶段边界

视觉验收通过后进入 Phase 4：

- 今日任务状态机；
- 开始任务；
- Proof链接和截图提交；
- AI审核状态；
- 补充证明；
- 奖励与活动日志。

之后才进入：

- D1账户与真实Dashboard API；
- R2私有文件；
- Queues审核任务；
- TON Connect；
- Testnet领取；
- Tolk合约。
