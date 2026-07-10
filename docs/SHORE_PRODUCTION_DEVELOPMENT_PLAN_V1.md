# 《上岸》上线运营完整开发计划 V1

- 项目：上岸（SHORE）
- 仓库：tii-mom/S
- 技术路线：Cloudflare 全栈 + TON + Tolk
- 文档用途：作为后续开发线程、Pull Request、测试、灰度和正式上线的唯一执行路线
- 核心原则：先跑通最短闭环，再逐步接入真实 AI、真实任务、测试网和主网；任何阶段不得跳过对应门禁

---

## 一、最终目标

本计划的目标不是“完成代码”，而是把上岸推进到可以持续运营的状态。

正式上线运营必须同时满足：

1. 用户可以在 3 秒内理解产品；
2. 用户可以在 30 秒内建立上岸目标；
3. 用户可以完成真实任务并获得可追踪积分；
4. 运营方可以创建、审核、暂停和结算任务；
5. 至少一个真实任务方完成付费试点；
6. Cloudflare 本地、Staging、Production 三套环境完全隔离；
7. TON 合约在 Sandbox、Testnet 和独立审计中通过；
8. 购买、锁仓、领取、Bounce 和重试不会导致资产丢失或重复支付；
9. 生产环境具备监控、审计日志、备份、回滚、暂停和事故处理能力；
10. 正式主网创世销售前，法律、地区限制、用户风险提示和运营责任已经确认。

正式上线不等于立即开放 58 TON 创世销售。

项目依次经过：

```text
可操作原型
→ 内部 Staging
→ 真实任务闭环
→ TON Testnet
→ 邀请制灰度
→ 受控主网
→ 正式运营
```

---

## 二、不可变产品原则

后续开发不得因技术可实现而改变以下原则。

### 1. 用户端只有五个核心能力

```text
上传负债
AI 计算目标
完成每日任务
获得积分与 SHORE 权益
分享上岸进度
```

### 2. 用户每天只有三个动作

```text
打开 → 完成 → 领取
```

### 3. 导航固定为四项

```text
首页 / 任务 / 金库 / 我的
```

### 4. 首次使用不要求钱包

钱包只在用户需要执行链上购买、领取或查看链上资产时出现。

### 5. 首页只推荐一个主要任务

任务页最多同时展示四个任务，禁止把产品做成复杂任务市场。

### 6. 一个页面只有一个主要按钮

不得在同一屏幕同时放置多个竞争性主操作。

### 7. V1 明确不开发

- 多链；
- DAO；
- NFT 或 SBT；
- 质押挖矿；
- 自动交易；
- 自动替用户发布内容；
- 多级分销；
- 复杂用户等级；
- 聊天社区；
- 复杂广告主自助平台；
- 复杂债务咨询和投资建议。

---

## 三、技术架构定稿

### 1. 前端

```text
Next.js
React
TypeScript
Tailwind CSS
Telegram Mini App SDK
TON Connect
PWA
OpenNext for Cloudflare
```

用户前端和运营后台放在同一个 Next.js 应用中，通过路由和权限隔离，不创建两个独立前端项目。

### 2. 后端

```text
Cloudflare Workers
Hono
TypeScript
Zod
D1
R2
Queues
Turnstile
Cron Triggers
```

### 3. Cloudflare 产品职责

| 服务 | 职责 |
|---|---|
| Workers | API、鉴权、任务、积分、轮次、领取资格、管理后台服务 |
| D1 | 用户、负债汇总、任务、提交、积分账本、轮次、链上同步状态 |
| R2 | 负债截图、任务证明、分享卡、导出文件 |
| Queues | AI 识别、证明审核、异步链上同步、失败重试 |
| Turnstile | 注册、上传、提交、邀请和高风险操作的机器人防护 |
| Cron Triggers | 清理文件、同步链上数据、聚合轮次指标、生成运营报表 |

### 4. TON 技术路线

```text
Tolk
Acton
TypeScript Wrappers
TON Sandbox
TON Testnet
TON Connect
Jetton TEP-74
```

新合约项目以 Tolk + Acton 为主。

Sandbox 用于本地确定性测试，测试网用于验证真实异步消息、Gas、钱包兼容和 Indexer 同步。

### 5. 合约范围

V1 只允许四组核心合约：

1. `ShoreJetton`；
2. `GenesisSale`；
3. `VestingController`；
4. `CommunityDistributor`。

团队锁仓优先作为 `VestingController` 的独立部署实例，只有确有必要时才拆分为第五个合约。

### 6. 仓库结构

```text
S/
├── apps/
│   ├── web/                    # 用户端 + 管理后台
│   └── api/                    # Cloudflare Worker API
├── contracts/
│   ├── shore-jetton/
│   ├── genesis-sale/
│   ├── vesting-controller/
│   └── community-distributor/
├── packages/
│   ├── shared/                 # 公共类型、常量、Zod Schema
│   ├── database/               # D1 Schema、Migration、Repository
│   ├── ton/                    # TON Client、Wrapper、Indexer 适配
│   └── ui/                     # 少量共享 UI
├── migrations/
├── scripts/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── contract/
├── docs/
├── wrangler/
│   ├── staging.jsonc
│   └── production.jsonc
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

---

## 四、环境与资源隔离

必须从第一个 PR 开始区分环境。

| 环境 | Web/API | D1 | R2 | Queue | TON |
|---|---|---|---|---|---|
| Local | 本地开发 | 本地 D1 | 本地 R2 模拟 | 本地 Consumer | Sandbox |
| Staging | 独立 Worker | 独立 Staging D1 | 独立私有 Bucket | 独立 Queue | Testnet |
| Production | 生产 Worker | 独立 Production D1 | 独立私有 Bucket | 独立 Queue | Mainnet |

严禁：

- Staging 和 Production 共用 D1；
- 测试截图写入生产 R2；
- 测试网合约地址进入生产配置；
- 私钥、Mnemonic、API Token 提交到 GitHub；
- 在浏览器中保存管理私钥；
- 用单个管理员钱包直接控制全部资金与解锁。

环境变量按以下级别管理：

```text
公开配置：提交仓库
非敏感环境配置：wrangler vars
敏感配置：Cloudflare Secrets
合约管理密钥：硬件钱包或多签
```

---

## 五、Git 与 PR 工作方式

### 1. 分支

- `main`：始终保持可部署；
- 每项工作使用 `codex/<task-name>`；
- 禁止长期开发分支；
- 每个 PR 只完成一个明确目标。

### 2. PR 必须包含

- 目标；
- 用户可见变化；
- 数据库或合约变化；
- 风险；
- 测试命令；
- Staging 证据；
- 回滚方法；
- 未完成项。

### 3. 合并门禁

所有 PR 至少通过：

```text
format
lint
typecheck
unit test
build
Cloudflare preview
```

涉及数据库时增加：

```text
migration dry run
fresh database migration
upgrade migration
rollback or forward-fix proof
```

涉及前端时增加：

```text
desktop smoke
mobile smoke
console error check
primary interaction proof
```

涉及合约时增加：

```text
acton build
acton test
coverage
gas report
invariant tests
bounce tests
replay tests
```

---

# 六、完整阶段计划

---

## Phase 0：工程和决策基线

### 目标

建立可以持续开发、测试和部署的仓库，不开发业务功能。

### PR1：Monorepo 与质量门禁

完成：

- pnpm workspace；
- `apps/web`、`apps/api`、`packages/shared`；
- TypeScript strict；
- ESLint、Prettier；
- Vitest；
- Turborepo 或等价任务编排；
- 根级 `dev`、`build`、`test`、`lint`、`typecheck` 命令；
- `.env.example`；
- `.gitignore`；
- Dependabot 或 Renovate；
- GitHub Actions 基础 CI。

验收：

- 新电脑克隆仓库后可以一次安装；
- 空应用可以构建；
- CI 全绿；
- `main` 没有未提交生成文件。

### PR2：Cloudflare 三环境骨架

完成：

- Next.js/OpenNext Workers 配置；
- API Worker 配置；
- Local、Staging、Production 绑定；
- Staging D1、R2、Queue 命名规范；
- 健康检查 `/api/health`；
- 部署脚本；
- Preview 命令；
- Source Map 和基础日志。

验收：

- Web 与 API 可部署到 Staging；
- Staging 页面能访问健康检查；
- `preview` 使用 workerd 环境执行；
- Production 尚不写入任何业务数据。

### PR3：架构与不变量文档

新增：

- `docs/ARCHITECTURE.md`；
- `docs/DATA_MODEL.md`；
- `docs/CONTRACT_INVARIANTS.md`；
- `docs/DEPLOYMENT.md`；
- `docs/SECURITY_BOUNDARIES.md`。

只记录已经确定的技术决策，不扩写新产品功能。

### Phase 0 退出门禁

- 仓库可构建；
- Staging 可访问；
- 环境隔离明确；
- CI 阻止不合格代码进入 main。

---

## Phase 1：极简可操作产品

### 目标

用户可以走完完整 Mock 路径，但不接 AI、不接真实任务、不接链上。

### PR4：移动端产品壳

完成：

- 四项底部导航；
- Telegram Safe Area；
- PWA Manifest；
- 深色金融视觉；
- 统一 Button、Card、Number、Progress 组件；
- 375、390、430 三种宽度适配；
- 加载、空状态、错误状态。

### PR5：负债目标 Mock 闭环

完成：

```text
进入产品
→ 手动输入金额
→ 选择币种
→ 确认
→ 首页显示上岸进度
```

要求：

- 30 秒内可完成；
- 不要求登录钱包；
- 数据暂存本地或 Mock API；
- 支持修改和重置。

### PR6：任务、积分和金库 Mock 闭环

完成：

```text
首页今日任务
→ 任务详情
→ 粘贴链接
→ 提交
→ 模拟通过
→ 增加积分
→ 金库显示可用与待解锁
```

### PR7：分享卡 Mock

完成三类分享卡：

- 开始上岸；
- 今日完成；
- 本轮领取。

支持保存图片、复制链接和 Telegram 分享入口。

### Phase 1 退出门禁

由真实手机完成：

```text
进入 → 输入负债 → 完成任务 → 获得积分 → 查看金库 → 分享
```

验收标准：

- 首屏 3 秒内理解；
- 无横向滚动；
- 无 Console Error；
- 主要流程不超过产品文档规定的点击数量；
- Staging 可供外部体验。

---

## Phase 2：真实账户与数据底座

### 目标

把 Mock 状态替换成可审计的真实用户和数据库状态。

### PR8：用户与会话

完成：

- Telegram Init Data 验证；
- Web 邮箱验证码登录；
- Session Cookie；
- CSRF 与 Replay 防护；
- 用户地区和语言字段；
- 管理员角色；
- 退出登录与会话失效。

### PR9：D1 核心 Schema

创建：

```text
users
sessions
debt_summaries
tasks
task_submissions
points_ledger
wallets
referrals
notifications
risk_flags
audit_logs
```

关键原则：

- 积分使用 Ledger；
- 管理操作写审计日志；
- 金额使用整数最小单位或 Decimal 字符串；
- 所有写入支持幂等键；
- 不使用浮点数保存资产。

### PR10：Dashboard 聚合 API

完成：

- `/api/me`；
- `/api/dashboard`；
- `/api/points`；
- `/api/points/history`；
- 用户数据权限；
- 请求 ID；
- 统一错误结构；
- Rate Limit。

### Phase 2 退出门禁

- 用户在不同设备登录后数据一致；
- 重复请求不会重复增加积分；
- 管理员不能读取其他用户的敏感内容；
- Migration 可在全新 D1 和已有 D1 上执行。

---

## Phase 3：AI 负债识别与隐私

### 目标

用户可以上传多张截图或 PDF，由 AI 识别总额，并在失败时无障碍回退到手工输入。

### PR11：私有文件上传

完成：

- R2 私有 Bucket；
- 预签名或受控上传；
- 图片/PDF 类型和大小限制；
- 文件 Hash；
- 恶意文件基础检查；
- 上传状态；
- 用户主动删除；
- 文件自动过期策略。

### PR12：AI 负债识别 Queue

流程：

```text
上传完成
→ 写入分析任务
→ Queue Consumer
→ OCR/视觉模型
→ 金额提取
→ 重复检测
→ 结构化结果
→ 用户确认
```

要求：

- AI 结果不能自动成为最终目标；
- 低置信度必须提示手动确认；
- AI 失败不阻断用户；
- 同一任务可安全重试；
- 原图和识别结果分离存储。

### PR13：隐私遮挡与保留策略

完成：

- 姓名、身份证号、银行卡号、手机号遮挡；
- 原图访问审计；
- 默认自动删除策略；
- 一键删除全部负债资料；
- 分享卡默认不展示具体金额；
- 管理员默认无原图权限。

### PR14：负债识别质量评估

建立匿名测试集，覆盖：

- 多张截图；
- 重复截图；
- 多币种；
- 模糊图片；
- 同一截图多个金额；
- 信用卡账单；
- 贷款 App；
- 手写或表格。

### Phase 3 退出门禁

- AI 失败时用户仍可在 30 秒内手动完成；
- 无法通过 URL 猜测访问他人文件；
- 用户删除后文件和索引均进入可验证删除流程；
- 测试集结果达到内部最低准确标准；
- 没有把完整敏感文本写入日志。

---

## Phase 4：真实任务与积分闭环

### 目标

运营方可以发布任务，用户可以完成并得到可审计积分。

### PR15：运营任务管理

完成后台：

- 创建；
- 编辑；
- 预览；
- 发布；
- 暂停；
- 结束；
- 人数上限；
- 奖励积分；
- 开始和截止时间；
- 证明方式。

### PR16：用户任务流程

完成：

```text
查看任务
→ 锁定或开始
→ 前往完成
→ 粘贴链接或上传截图
→ 查看审核状态
```

防止：

- 超额领取任务；
- 截止后提交；
- 同一用户重复提交；
- 同一证明跨用户复用。

### PR17：AI 证明审核

Queue Consumer 检查：

- 链接可访问；
- 是否满足任务要求；
- 截图内容；
- 重复 Hash；
- 文本相似度；
- 低置信度进入人工审核。

AI 不得在低置信度时自动拒绝。

### PR18：人工审核与申诉

管理员操作只保留：

- 通过；
- 拒绝；
- 要求重交。

每个决定必须记录：

- 操作人；
- 原因；
- 时间；
- 前后状态。

用户可以对拒绝发起一次申诉。

### PR19：积分账本

完成：

- `earn`；
- `reverse`；
- `adjust`；
- `expire`（仅未来确有需要时启用）；
- 幂等键；
- 余额快照校验；
- Ledger 重算脚本。

### Phase 4 退出门禁

完成至少一轮内部真实任务：

```text
运营发布
→ 用户完成
→ AI 审核
→ 人工复核
→ 积分到账
→ 申诉和撤销可追踪
```

---

## Phase 5：病毒传播与有效邀请

### 目标

分享带来真实完成首个任务的新用户，而不是注册数字。

### PR20：生产级分享卡

三种固定模板：

- 开始上岸；
- 今天又上岸一步；
- 已领取本轮奖励。

要求：

- 默认隐藏金额；
- 每张卡含邀请参数；
- 支持 Telegram、X、复制链接、保存图片；
- 卡片不包含承诺收益文案。

### PR21：邀请归因

有效邀请必须完成：

```text
确认负债目标
+ 绑定一个社交主页
+ 完成第一个有效任务
```

防止：

- 自邀请；
- 循环邀请；
- 同设备批量账号；
- 注册后立即奖励；
- 邀请奖励与购买金额直接挂钩。

### PR22：最小社交账号验证

V1 仅支持：

- 粘贴主页 URL；
- 平台格式校验；
- 简介验证码；
- 公开页面复验。

不接管社交账号，不请求密码或 Cookie。

### Phase 5 退出门禁

- 分享链接可正确归因；
- 只有完成首个真实任务后才计为有效邀请；
- 同一人无法通过简单批量注册刷邀请奖励。

---

## Phase 6：真实商业任务与运营后台

### 目标

验证项目存在真实需求方和真实收入，而不是只靠项目方任务。

### PR23：广告任务运营录入

V1 不做广告主自助后台。

后台记录：

- 客户；
- 任务预算；
- 用户奖励预算；
- 平台服务费；
- 任务目标；
- 完成数据；
- 退款和争议；
- 支付证明。

### PR24：预算与结算账本

建立平台内部 Ledger：

- 客户充值；
- 预算锁定；
- 用户奖励；
- 平台服务费；
- 退款；
- 手续费；
- 差错调整。

早期可以人工收款，但系统账本必须完整。

### PR25：任务结果报告

只输出：

- 参与人数；
- 完成人数；
- 有效内容；
- 点击或事件；
- 用户反馈；
- 无效和作弊数量。

### PR26：运营 SOP

新增：

- 广告任务审核清单；
- 用户证明审核规则；
- 争议处理；
- 风险任务下线；
- 恶意链接处理；
- 数据删除请求；
- 客户退款规则；
- 日报和事故报告。

### Phase 6 退出门禁

- 至少一个外部任务方真实付费；
- 至少一轮任务完成并结算；
- 任务方确认结果有价值；
- 用户奖励和平台收入可核对；
- 争议有处理记录。

没有达到本门禁，不进入主网创世销售。

---

## Phase 7：Tolk 合约基础

### 目标

在本地 Sandbox 中建立完整合约系统与不变量测试，不接前端主流程。

### PR27：Acton/Tolk 工程

完成：

- Acton 项目；
- Tolk 编译；
- 格式化和 Lint；
- TypeScript Wrapper；
- Sandbox 测试；
- 合约 CI；
- Coverage 和 Gas 报告。

### PR28：ShoreJetton

实现：

- 总量 100 亿；
- TEP-74 兼容；
- Jetton Master；
- Jetton Wallet；
- 元数据；
- 转账；
- 销毁；
- 固定供应或永久关闭增发能力。

不变量：

- 总供应量不能超过 100 亿；
- 任何管理员都不能绕过供应限制；
- 非法消息不能改变余额；
- 销毁后总供应正确减少。

### PR29：GenesisSale

实现：

- 每份 58 TON；
- 总计 1,333 份；
- 单地址最多 10 份；
- 每份立即 100,000 SHORE；
- 每份建立 2,700,000 SHORE 锁仓权益；
- 第 1 轮启动后永久关闭；
- 超额、少额和重复消息处理；
- 管理资金提取走多签。

不变量：

- `soldPackages <= 1333`；
- 单地址购买数不超过 10；
- 同一付款消息不能重复入账；
- 关闭后无法重新打开；
- 失败时不会出现付款成功但权益缺失。

### PR30：VestingController

实现：

- 18 轮；
- 每份每轮 150,000 SHORE；
- 待领取；
- 已领取；
- 多份套餐；
- 领取资格证明；
- Nonce；
- Bounce 恢复；
- 幂等重试；
- 暂停。

核心状态机：

```text
eligible
→ pending transfer
→ confirmed
```

失败路径：

```text
pending transfer
→ bounced/expired
→ claimable again
```

不变量：

- 用户总领取量不超过总权益；
- 同一轮不能重复领取；
- Bounce 不能吞掉权益；
- Retry 不能双花；
- 暂停只能阻止新操作，不能没收权益。

### PR31：CommunityDistributor

实现：

- 每轮社区池；
- Merkle Root；
- 用户 Proof；
- 防重复领取；
- 领取期限；
- 未领取资产处理；
- Root 更新权限和时间锁。

### PR32：团队锁仓

实现：

- 独立实例；
- 每轮团队额度；
- 延迟释放；
- 线性释放；
- 公开地址；
- 不允许管理方提前领取。

### Phase 7 退出门禁

- 全部合约测试通过；
- 覆盖正常、异常、Bounce、Replay、权限、上限和暂停路径；
- 无未解释 Gas 激增；
- 所有不变量写入 `CONTRACT_INVARIANTS.md`；
- 合约尚未部署主网。

---

## Phase 8：TON Testnet 集成

### 目标

验证真实钱包、真实异步消息和链上索引同步。

### PR33：TON Connect

完成：

- Manifest；
- 连接和断开；
- 地址展示；
- 网络检查；
- Testnet 限制；
- 钱包拒绝；
- 用户取消；
- Transaction 超时；
- 手机端钱包跳转。

### PR34：测试网购买

完成：

```text
连接钱包
→ 查看套餐
→ 用户签名支付
→ 链上确认
→ 后端 Indexer 同步
→ 金库显示立即和锁仓权益
```

### PR35：测试网领取

完成：

```text
满足资格
→ 点击领取
→ 钱包签名
→ 合约发送
→ 后端同步
→ UI 更新
```

覆盖：

- 钱包拒绝；
- 网络失败；
- 消息 Bounce；
- Indexer 延迟；
- 重复点击；
- 交易已上链但 API 超时。

### PR36：链上同步器

D1 记录：

- 合约地址；
- 交易 Hash；
- LT；
- 事件类型；
- 确认状态；
- 最后同步游标；
- 重组或数据源差异处理；
- 重放幂等性。

### Phase 8 退出门禁

- 多种 TON 钱包完成购买和领取；
- 异步失败可以恢复；
- 前端刷新后状态一致；
- 后端重放事件不会重复入账；
- Testnet 连续运行无资产错账。

---

## Phase 9：轮次与价格系统

### 目标

实现 18 轮展示和受控激活，但在主网前保持人工多签批准。

### PR37：轮次数据模型

创建：

```text
rounds
round_metrics
round_approvals
round_activations
round_claim_snapshots
```

### PR38：7 日平均价格

要求：

- 不使用瞬时价格；
- 数据源可替换；
- 原始价格点保留；
- 异常值检测；
- 数据源失效时停止推进；
- 项目关联交易不能直接成为解锁依据。

### PR39：行动条件

只计算：

- 审核通过；
- 未被撤销；
- 非作弊；
- 在本轮时间窗口内；
- 符合有效任务类型。

### PR40：轮次审批和激活

流程：

```text
价格条件满足
+ 行动条件满足
→ 系统生成 Readiness Report
→ 多签审批
→ 时间锁
→ 激活轮次
```

用户端仍只显示：

- 价格进度；
- 任务进度。

### Phase 9 退出门禁

- 不能由单个后台管理员直接激活；
- 指标可复算；
- 数据源异常时 Fail Closed；
- 激活后每类分配额度与文档一致。

---

## Phase 10：安全、合规与生产准备

### 目标

关闭所有主网和真实资金阻断项。

### PR41：应用安全加固

完成：

- 权限矩阵；
- 管理后台强认证；
- CSRF；
- Rate Limit；
- Turnstile；
- 上传安全；
- SSRF 防护；
- URL Allow/Deny 规则；
- Secret 扫描；
- Dependency 扫描；
- 安全 Header；
- 审计日志防篡改策略。

### PR42：资金与合约控制面

完成：

- 多签；
- 时间锁；
- 紧急暂停；
- 权限地址清单；
- 权限轮换；
- 主网部署脚本；
- 合约地址验证；
- 资金转移 Runbook。

### PR43：独立合约审计准备

审计包必须包含：

- Tolk 源码；
- Wrapper；
- 测试；
- Coverage；
- Gas Report；
- 状态机；
- 不变量；
- 已知限制；
- 管理权限；
- 部署参数；
- Threat Model。

审计问题全部进入 Issue，P0/P1 必须关闭并复审。

### PR44：地区与产品风险控制

完成：

- 地区功能开关；
- 风险提示；
- 禁止借贷购买文案；
- 年龄限制；
- 隐私政策；
- 用户协议；
- 删除请求流程；
- 投诉入口；
- 代币功能与非代币功能分离。

法律结论由专业律师给出，代码只实现其要求。

### PR45：生产监控

监控：

- API 错误率；
- Queue 堆积；
- AI 失败率；
- R2 上传失败；
- D1 错误；
- 合约交易失败；
- Indexer 延迟；
- 领取 Bounce；
- 积分异常；
- 管理员高风险操作。

### Phase 10 退出门禁

- 安全审计 P0/P1 清零；
- 多签和暂停经过演练；
- Production Secrets 不在仓库；
- 数据恢复和回滚演练通过；
- 用户协议与地区规则可执行；
- 生产报警能够到达负责人。

---

## Phase 11：邀请制受控灰度

### 目标

在不开放正式主网销售的前提下，验证真实用户、真实运营和真实任务。

### PR46：灰度控制

完成：

- 邀请名单；
- 用户上限；
- 功能开关；
- 每日奖励上限；
- 任务预算上限；
- 全局暂停；
- 灰度用户反馈入口。

### PR47：灰度运营包

包括：

- 参与者名单；
- 每日检查表；
- 客服话术；
- 事故登记；
- 用户反馈；
- 日报；
- 周期结束评审。

### 灰度必须验证

- 用户是否 3 秒理解；
- 建立目标是否顺畅；
- 用户是否愿意完成第二个任务；
- AI 审核误判；
- 运营审核负担；
- 分享转化；
- 任务方满意度；
- 作弊比例；
- 用户对钱包和领取的理解。

### Phase 11 退出门禁

只有达到以下条件才进入主网：

- 核心流程无 P0；
- 真实任务方愿意继续付费；
- 积分账本无不可解释差异；
- 用户投诉和申诉可处理；
- AI 审核误判处于可接受范围；
- 运营团队可以承担日常审核；
- Testnet 资产链路稳定。

---

## Phase 12：受控主网上线

### 目标

先上线产品和主网基础设施，再决定是否开放创世销售。

### PR48：主网部署

完成：

- Production Worker；
- Production D1/R2/Queues；
- 主网合约部署；
- 合约源码验证；
- TON Connect Mainnet；
- Indexer Mainnet；
- 多签控制；
- 生产 Smoke Test。

### PR49：主网只读观察

先开放：

- 登录；
- 负债目标；
- 任务；
- 积分；
- 分享；
- 钱包连接；
- 金库只读。

暂不开：

- 58 TON 购买；
- 大额代币领取；
- 自动轮次激活。

### PR50：创世销售准备板

逐项确认：

- 合约审计；
- 法律批准；
- 多签；
- 流动性计划；
- 1,333 份参数；
- 单钱包 10 份；
- 立即发放和锁仓余额；
- 购买失败处理；
- 客服；
- 监控；
- 暂停演练；
- 退款或异常处理政策。

### PR51：受控创世销售

开放方式：

- 功能开关；
- 初始限量；
- 实时监控；
- 可暂停；
- 不允许后台手工补单；
- 所有异常通过链上与账本处理。

### Phase 12 退出门禁

- 真实购买和权益一致；
- 无超售；
- 无重复购买记账；
- 即时 SHORE 和锁仓权益正确；
- 客服可以处理失败交易；
- 主网运行状态稳定。

---

## Phase 13：正式运营与增长

### 1. 每日运营

- 新任务审核；
- 用户证明审核；
- 申诉；
- 风险账号；
- Queue 和 Indexer；
- 资金账本；
- 合约异常；
- 用户反馈。

### 2. 每周运营

- 任务方复购；
- 用户留存；
- 有效邀请；
- AI 误判；
- 作弊模式；
- 用户奖励；
- 平台收入；
- 回购记录；
- 安全检查。

### 3. 每轮运营

- 价格数据；
- 有效任务；
- 社区积分；
- 创世资格；
- Merkle Root；
- 团队锁仓；
- Readiness Report；
- 多签激活；
- 用户领取；
- 轮次复盘。

### 4. 功能增长规则

只有数据证明需要时才增加功能。

新增功能必须回答：

1. 是否提高首个任务完成率；
2. 是否提高次日留存；
3. 是否提高真实任务方复购；
4. 是否降低审核或作弊成本；
5. 是否保持 3 秒理解和傻瓜式操作。

不能明确改善上述指标的功能，不进入开发。

---

# 七、测试总策略

## 1. 单元测试

覆盖：

- 金额；
- 积分；
- 邀请资格；
- 轮次条件；
- 权限；
- 状态机；
- 幂等键。

## 2. Worker 集成测试

覆盖真实绑定：

- D1；
- R2；
- Queue；
- Cron；
- Secret 缺失；
- 失败重试。

## 3. E2E

至少覆盖：

```text
首次登录
手动建立目标
AI 建立目标
完成任务
审核通过
积分到账
分享
钱包连接
Testnet 购买
Testnet 领取
管理员审核
管理员暂停
```

## 4. 前端视觉测试

每个用户可见 PR 都检查：

- 页面身份；
- 非空白页；
- 无框架错误遮罩；
- Console；
- 主交互；
- 375px 手机；
- 430px 手机；
- 桌面基础显示。

## 5. 合约测试

除示例测试外，必须包含：

- Property/Invariant；
- Boundary；
- Replay；
- Unauthorized；
- Bounce；
- Retry；
- Double Claim；
- Sale Close；
- Max Supply；
- Max Purchase；
- Pause/Resume；
- Gas Regression。

---

# 八、核心数据指标

正式运营只跟踪以下核心指标。

### 用户漏斗

```text
进入
→ 确认负债目标
→ 完成首个任务
→ 次日再完成
→ 分享
```

### 商业漏斗

```text
任务方接触
→ 支付
→ 发布任务
→ 用户完成
→ 任务方确认价值
→ 复购
```

### 核心指标

- 新增用户；
- 目标确认率；
- 首任务完成率；
- 次日任务完成率；
- 有效任务数；
- AI 自动通过率；
- 人工复审率；
- 申诉率；
- 作弊率；
- 分享带来的有效用户；
- 任务方付费；
- 任务方复购；
- 用户真实奖励；
- 合约失败率；
- Indexer 延迟；
- 积分和链上资产对账差异。

币价不是产品北极星指标。

---

# 九、上线阻断项

任何一项存在时，不允许开放正式主网创世销售：

1. 合约可增发超过 100 亿；
2. 单钱包可购买超过 10 份；
3. 总销售可超过 1,333 份；
4. Bounce 会造成用户权益丢失；
5. Retry 可导致重复发放；
6. 单管理员可直接激活轮次或转走资金；
7. Staging 与 Production 共用数据；
8. 无法删除负债截图；
9. 管理员可以无日志改积分；
10. 没有真实任务方和真实收入闭环；
11. 合约审计 P0/P1 未关闭；
12. 没有事故暂停和恢复流程；
13. 地区规则和用户风险提示未落实；
14. 生产监控无法发现领取、Queue 或 Indexer 故障。

---

# 十、执行顺序

下一步不是继续扩写产品概念，也不是直接写全部合约。

严格按以下顺序执行：

```text
Phase 0 工程基线
→ Phase 1 Mock 完整用户路径
→ Phase 2 真实账户与 D1
→ Phase 3 AI 负债识别
→ Phase 4 真实任务与积分
→ Phase 5 分享邀请
→ Phase 6 真实任务方试点
→ Phase 7 Tolk 合约
→ Phase 8 Testnet
→ Phase 9 轮次系统
→ Phase 10 安全和生产准备
→ Phase 11 邀请制灰度
→ Phase 12 受控主网
→ Phase 13 正式运营
```

任何阶段未通过退出门禁，不进入下一阶段。

---

# 十一、立即执行任务

当前仓库只有文档，因此第一项实施任务为：

> **SHORE Foundation & Cloudflare Staging Baseline V1**

对应本计划的 PR1–PR3：

1. 初始化 pnpm Monorepo；
2. 创建 Next.js/OpenNext Web；
3. 创建 Cloudflare API Worker；
4. 配置 Local/Staging/Production；
5. 建立 CI、Lint、Typecheck、Test、Build、Preview；
6. 部署空壳到 Cloudflare Staging；
7. 写入架构、数据、合约不变量、部署和安全边界文档。

完成后再进入极简用户界面和 Mock 闭环，不允许提前开发主网支付或创世销售。
