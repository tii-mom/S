# @shore/contracts

SHORE 的 TON Testnet 领取合约、消息编码、TypeScript Wrapper 和 Sandbox 测试。

## 当前合约

```text
ShoreClaim
```

职责：

```text
后端签名领取授权
→ 用户钱包显式发送领取消息
→ 合约验证签名、调用者、金额和时间窗
→ 合约的 SHORE Jetton Wallet 执行标准 Jetton Transfer
→ 链上状态防止重复领取
```

该合约不负责铸币，也不保存用户私钥。

## 安全模型

- 仅接受绑定当前合约地址和调用钱包地址的 Ed25519 授权；
- 每个 `claimId` 只能使用一次；
- 授权包含 `validAfter` 和 `expiresAt`；
- 合约可由管理员暂停；
- 初始 Jetton Wallet 调用发生 bounce 时自动删除 pending 记录；
- pending 手工重置要求先暂停，并等待授权过期后至少一天；
- 未经链上证据，不把异步Jetton调用自动视为完成；
- 部署脚本强制 `testnet`，主网调用直接失败。

## Token单位

当前 SHORE 领取协议冻结为：

```text
Jetton metadata decimals = 0
```

因此：

```text
D1 entitlement amount = Jetton transfer amount = 用户看到的整数SHORE数量
```

未来若修改 decimals，必须同时迁移 D1、API、合约消息Schema和全部余额显示，不能只修改元数据。

## 构建

```bash
pnpm --filter @shore/contracts build
```

构建直接调用 `@ton/tolk-js`，并校验固定代码哈希：

```text
3C36374EB259F4619BF75C3DAFCA3B323F9AB799B1BC2F19008EBCAE94C7DFBC
```

合约源码发生变化时，CI会因代码哈希变化而失败。只有在完成差异审查和测试后，才能显式更新预期哈希。

## 测试

```bash
pnpm --filter @shore/contracts typecheck
pnpm --filter @shore/contracts test
```

Sandbox测试覆盖：

- 部署配置；
- 前后端授权哈希一致；
- 有效领取；
- 标准Jetton Transfer；
- 重复领取；
- 错误签名；
- 过期和未来授权；
- 调用钱包绑定；
- 最低TON费用；
- 管理员权限；
- 暂停和延迟重置；
- 初始Jetton调用bounce恢复。

## Testnet部署

部署需要：

```text
SHORE_CLAIM_ADMIN_ADDRESS
SHORE_DISTRIBUTION_JETTON_WALLET
SHORE_CLAIM_SIGNER_PUBLIC_KEY_HEX
```

执行：

```bash
pnpm --filter @shore/contracts start
```

选择 `deployShoreClaim` 和 TON Testnet。

当前仓库不会自动部署合约，也不保存部署钱包、助记词或签名私钥。
