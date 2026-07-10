# 上岸（SHORE）

> 负债不是身份，上岸才是目标。

SHORE 是一套个人债务控制、Proof of Action任务和18轮SHORE权益管理系统。

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

**Phase 0–6 已完成本地与受控Staging实现。**

当前具备：

```text
Telegram Mini App身份
→ SHORE会话
→ D1 Dashboard
→ 开始任务
→ Proof链接或私有截图
→ R2私有存储
→ Cloudflare Queue
→ 人工审核
→ AP / SHORE权益 / 稳定奖励资格
→ TON Connect
→ ton_proof地址验证
→ Testnet签名领取交易
→ 钱包显式确认
→ submitted等待链上索引
```

当前仍未开放：

- TON主网；
- 真实稳定币支付；
- 已部署的Testnet ShoreClaim与ShoreJetton；
- 真实SHORE链上领取；
- 链上索引确认与自动恢复；
- 自动发奖；
- 自动代表用户执行社交动作。

## 技术架构

```text
apps/web
  Next.js 16
  React 19
  OpenNext Cloudflare
  SHORE Terminal
  TON Connect

apps/api
  Hono Cloudflare Worker
  D1
  R2
  Queues + DLQ
  Telegram initData验证
  ton_proof验证

packages/contracts
  Tolk ShoreClaim
  TON消息编码与Wrapper
  Sandbox测试

packages/shared
  Zod Schema
  TypeScript公共类型
```

## 任务与Proof

任务状态机：

```text
started
→ proof_pending
→ manual_review
→ approved
```

异常分支：

```text
resubmission_required
rejected
cancelled
```

Proof支持：

- 公开HTTPS链接；
- 私有PNG/JPEG/WebP截图；
- 最大5 MiB；
- 20–2000字符体验说明；
- D1幂等记录；
- R2私有对象；
- Queue完整性检查；
- 人工批准后才生成奖励账本。

Queue不会自动批准，也不会自动发奖。

## Telegram身份

Mini App前端读取：

```text
window.Telegram.WebApp.initData
```

后端验证：

- HMAC签名；
- `auth_date`时效；
- 用户JSON结构；
- 防篡改；
- 稳定Telegram用户ID。

生产环境禁止使用普通浏览器临时会话，也不信任 `initDataUnsafe`。

## TON安全边界

TON Connect连接后，后端继续验证：

- Testnet链ID；
- 应用域名；
- 一次性Nonce；
- 签名时间窗；
- `stateInit`派生地址；
- 标准钱包公钥；
- Ed25519签名；
- 地址是否绑定其他SHORE账户；
- Nonce重放。

系统不会请求或保存私钥、助记词或钱包密码。

领取已实现Testnet签名授权、TON Connect交易体和钱包显式发送。缺少钱包、权益、合约地址、签名器或处于主网时，后端必须明确阻断。钱包返回BOC只进入 `submitted`，不会被当成链上成功；真实Testnet地址未配置时不会发送资产交易。

ShoreClaim由Tolk实现，固定代码哈希为：

```text
3C36374EB259F4619BF75C3DAFCA3B323F9AB799B1BC2F19008EBCAE94C7DFBC
```

SHORE V1冻结 `decimals=0`，D1整数权益与链上Jetton数量一一对应。

## D1核心表

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

迁移：

```bash
pnpm --filter @shore/api db:migrate:local
pnpm --filter @shore/api db:migrate:staging
pnpm --filter @shore/api db:migrate:production
```

生产迁移不得在未审核Schema、备份方案和回滚方案时执行。

## 本地开发

安装：

```bash
pnpm install
```

应用D1迁移：

```bash
pnpm --filter @shore/api db:migrate:local
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
Web:    http://localhost:3000
API:    http://localhost:8787
Health: http://localhost:8787/api/health
```

## 必需Secret

以下值不得写入仓库：

```text
TELEGRAM_BOT_TOKEN
ADMIN_REVIEW_TOKEN
SHORE_CLAIM_SIGNER_SEED_BASE64
```

通过Cloudflare Secret设置。

普通环境变量包括：

```text
APP_ENV
CORS_ORIGIN
LOG_LEVEL
TON_APP_DOMAIN
TON_NETWORK
SHORE_CLAIM_CONTRACT_ADDRESS
SHORE_CLAIM_SIGNER_PUBLIC_KEY_HEX
NEXT_PUBLIC_SHORE_API_BASE_URL
NEXT_PUBLIC_TONCONNECT_MANIFEST_URL
```

## 验证命令

```bash
pnpm check
pnpm check:cloudflare
pnpm smoke:local
pnpm test:e2e
```

验证覆盖：

- 格式、Lint和strict TypeScript；
- Telegram签名、防篡改和过期数据；
- TON Proof签名和网络错配；
- Tolk ShoreClaim确定性代码哈希；
- 10项合约Sandbox测试；
- 前后端授权Cell哈希一致；
- HTTPS Proof URL安全；
- D1迁移；
- 会话与Dashboard；
- 18轮数据；
- 任务开始；
- Proof提交与Queue；
- 未验证钱包领取阻断；
- 375×812、430×932和1280×900；
- D1 LIVE浏览器任务闭环；
- 无横向溢出；
- OpenNext与Wrangler dry-run。

## 主要文档

- [SHORE Operational Runtime V1](docs/SHORE_OPERATIONAL_RUNTIME_V1.md)
- [SHORE Terminal UI System V1](docs/SHORE_TERMINAL_UI_SYSTEM_V1.md)
- [《上岸》产品开发文档 V1](docs/SHORE_PRODUCT_DEVELOPMENT_V1.md)
- [《上岸》上线运营完整开发计划 V1](docs/SHORE_PRODUCTION_DEVELOPMENT_PLAN_V1.md)
- [系统架构](docs/ARCHITECTURE.md)
- [数据模型规则](docs/DATA_MODEL.md)
- [TON合约不变量](docs/CONTRACT_INVARIANTS.md)
- [SHORE Claim Message Schema V1](docs/SHORE_CLAIM_MESSAGE_SCHEMA_V1.md)
- [部署说明](docs/DEPLOYMENT.md)
- [安全边界](docs/SECURITY_BOUNDARIES.md)
- [环境变量与绑定](docs/ENVIRONMENT_VARIABLES.md)

## 下一阻断项

进入真实Testnet领取前仍需完成：

1. 实现并部署 `decimals=0` 的ShoreJetton；
2. 完成ShoreClaim独立安全审计；
3. 将admin升级为Testnet多签；
4. 验证distribution Jetton Wallet归属、代码和余额；
5. 手工部署冻结代码哈希的Testnet ShoreClaim；
6. 配置合约地址、签名公钥、Cloudflare签名Secret和正式Manifest域名；
7. 接入链上索引确认、超时观察和证据化失败恢复；
8. 完成受控Staging端到端人工验收。

上述条件未完成前，主网与真实资产操作保持关闭。
