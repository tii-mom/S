# SHORE Operational Runtime V1

## 1. 当前裁决

SHORE 已从纯视觉原型进入受控 Staging 运行时阶段。

本版本已经接通：

```text
Telegram Mini App身份
→ SHORE会话
→ D1 Dashboard
→ 开始任务
→ Proof链接或私有截图
→ R2私有存储
→ Cloudflare Queue
→ 规则完整性检查
→ 人工批准
→ AP / SHORE权益 / 稳定奖励资格账本
→ TON Connect
→ ton_proof地址所有权验证
→ Testnet领取意图
```

本版本没有接通：

- 主网；
- 真实稳定币支付；
- SHORE真实链上领取；
- 已部署Tolk领取合约；
- 合约消息体生成；
- 自动发奖；
- 自动代表用户执行社交动作。

## 2. 运行环境

### Local

- Web：`http://localhost:3000`
- E2E Web：`http://127.0.0.1:3100`
- API：`http://127.0.0.1:8787`
- D1：本地Wrangler数据库
- R2：本地Wrangler对象存储
- Queue：本地Wrangler消费者
- TON：Testnet
- 身份：非生产临时会话或Telegram initData

### Staging

- Web与API部署到Cloudflare Workers；
- 使用独立Staging D1、R2、Queue和DLQ；
- TON保持Testnet；
- Telegram使用Bot Secret注入；
- 管理员审核使用独立Secret；
- 未配置领取合约时，领取必须明确阻断。

### Production

当前不可启用：

- 普通浏览器临时会话；
- 主网；
- 真实支付；
- 合约领取。

Production只允许经过Telegram `initData`验签的身份进入。

## 3. 身份与会话

### Telegram身份

前端只读取：

```text
window.Telegram.WebApp.initData
```

前端不得把 `initDataUnsafe` 作为可信身份。

后端验证：

1. 解析URL参数；
2. 在Bot Token HMAC流程中仅排除 `hash`；
3. 按字段名排序；
4. 生成data-check-string；
5. 使用Telegram WebApp HMAC规则计算Hash；
6. 常量时间比较Hash；
7. 验证 `auth_date` 不超过一小时；
8. 校验用户JSON结构；
9. 以 `tg_<telegram_id>` 作为稳定用户ID；
10. 创建七天SHORE会话。

### 临时会话

`POST /api/v1/session/bootstrap` 只允许Local和Staging。

Production调用必须返回：

```text
BOOTSTRAP_DISABLED
```

SHORE会话Token只返回一次；D1只保存SHA-256哈希。

## 4. D1数据表

核心表：

```text
users
sessions
debt_summaries
missions
mission_executions
proof_submissions
points_ledger
shore_entitlements
reward_entitlements
wallets
ton_proof_nonces
token_claims
rounds
audit_logs
```

所有金额规则：

- 法币和稳定币使用整数最小单位；
- AP使用整数；
- SHORE使用整数Token单位；
- 价格使用Decimal字符串；
- 不使用JavaScript浮点数作为账本真值。

## 5. 任务状态机

```text
started
→ proof_pending
→ manual_review
→ approved
```

异常分支：

```text
proof_pending
→ resubmission_required
→ started/resubmission_required
→ proof_pending
```

或：

```text
manual_review
→ rejected
```

规则：

- 一个用户对同一任务只有一个execution；
- 开始任务与提交Proof都使用幂等控制；
- 提交Proof不会立即发奖；
- Queue不能自动批准；
- 只有人工批准事务可以生成奖励账本。

## 6. Proof安全

### URL Proof

只允许：

```text
HTTPS
公开主机
不含用户名密码
```

拒绝：

- HTTP；
- localhost；
- `.local`；
- `.internal`；
- 私有IPv4；
- 回环地址；
- 链路本地地址；
- 私有IPv6；
- 带凭据URL。

### 文件Proof

允许格式：

```text
image/png
image/jpeg
image/webp
```

限制：

```text
最大5 MiB
```

R2对象：

- 不公开；
- 无公开URL；
- Key包含用户与execution边界；
- 自定义元数据记录owner、execution和proof；
- 下载接口再次校验Bearer会话与user_id；
- 下载事件写入audit_logs。

## 7. Queue与人工审核

Queue规则检查只验证：

- D1记录存在；
- R2文件存在，或HTTPS证据存在；
- 说明长度达标；
- execution与用户匹配。

Queue结果只能是：

```text
manual_review
resubmission_required
```

Queue不能产生：

```text
approved
AP奖励
SHORE权益
稳定奖励资格
```

管理员批准使用：

```text
POST /api/v1/admin/proofs/:proofId/review
```

需要Cloudflare Secret提供的管理员凭据。

批准事务幂等生成：

- `points_ledger` AP记录；
- `shore_entitlements` 锁定权益；
- `reward_entitlements` 待支付稳定奖励资格；
- `audit_logs` 审核证据。

稳定奖励资格状态为 `pending`，不代表已经付款。

## 8. TON Connect与ton_proof

前端使用同一个TON Connect状态控制器，桌面、手机和领取区只渲染不同按钮。

连接流程：

```text
后端签发一次性Nonce
→ 前端写入tonProof连接请求
→ 钱包签名
→ 后端验证
→ D1绑定钱包
```

后端验证：

- Testnet/Mainnet chain ID；
- 配置域名；
- Domain字节长度；
- 15分钟签名窗口；
- 一次性Nonce；
- `stateInit`派生地址；
- 标准钱包Code；
- 钱包公钥；
- Ed25519签名；
- 钱包是否已绑定其他SHORE账户；
- Nonce原子消费；
- 重放阻断。

不请求或保存：

- 私钥；
- 助记词；
- 钱包密码；
- 用户签名权限托管。

## 9. 领取意图

领取前置条件：

```text
D1可领取权益
+
经过ton_proof验证的钱包
+
TON Testnet
+
已配置领取合约地址
```

任何条件缺失都返回明确阻断代码：

```text
WALLET_REQUIRED
ENTITLEMENT_REQUIRED
MAINNET_DISABLED
CLAIM_CONTRACT_NOT_CONFIGURED
```

同一entitlement只能存在一个活跃领取记录；数据库使用部分唯一索引阻止并发重复领取。

当前即使领取意图准备成功，也不会生成伪造BOC或发送交易。只有已部署并确认消息协议的Testnet合约完成后，才能进入交易生成阶段。

## 10. API摘要

### Public

```text
GET  /api/health
POST /api/v1/session/bootstrap
POST /api/v1/session/telegram
```

### User Session

```text
GET  /api/v1/dashboard
POST /api/v1/missions/:missionId/start
GET  /api/v1/executions/:executionId
POST /api/v1/executions/:executionId/proofs
GET  /api/v1/proofs/:proofId/file
POST /api/v1/ton-proof/nonce
POST /api/v1/ton-proof/verify
POST /api/v1/claims/intents
```

### Admin

```text
POST /api/v1/admin/proofs/:proofId/review
```

## 11. 必需Secret与变量

Secret不得写入仓库：

```text
TELEGRAM_BOT_TOKEN
ADMIN_REVIEW_TOKEN
```

普通变量：

```text
APP_ENV
CORS_ORIGIN
LOG_LEVEL
TON_APP_DOMAIN
TON_NETWORK
SHORE_CLAIM_CONTRACT_ADDRESS
NEXT_PUBLIC_SHORE_API_BASE_URL
NEXT_PUBLIC_TONCONNECT_MANIFEST_URL
```

## 12. 验证矩阵

```bash
pnpm check
pnpm check:cloudflare
pnpm smoke:local
pnpm test:e2e
```

`smoke:local`真实执行：

- D1迁移；
- 会话创建；
- Dashboard读取；
- 18轮读取；
- 任务创建；
- Proof提交；
- Queue投递；
- 未验证钱包领取阻断；
- Web/API运行状态。

Playwright同时启动本地D1/API和生产模式Web，并在三个视口验证：

- D1 LIVE；
- 桌面/手机布局；
- 真实任务开始；
- Proof提交；
- Queue或人工审核状态；
- 图表与18轮交互；
- 无横向溢出。
