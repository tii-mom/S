# SHORE Claim Message Schema V1

## 1. 状态

本文件冻结 SHORE Testnet 领取合约与API之间的消息格式。

```text
Contract: ShoreClaim
Language: Tolk 1.2.0
Code hash:
3C36374EB259F4619BF75C3DAFCA3B323F9AB799B1BC2F19008EBCAE94C7DFBC
Network policy: Testnet only
```

修改任何字段、位宽、顺序、Opcode、Token decimals或签名域，都属于协议破坏性变更，必须发布新版本并重新审计。

## 2. SHORE Token单位

V1固定：

```text
Jetton metadata decimals = 0
```

因此：

```text
150000 D1 entitlement units
=
150000 Jetton transfer units
=
150000 SHORE
```

不能在元数据中单独改为9位小数，否则会把用户领取金额缩小十亿倍。

## 3. 签名授权

签名对象按以下顺序序列化为一个Cell：

```text
claim_authorization$_
  domain:uint32
  version:uint16
  contract_address:MsgAddress
  claimant:MsgAddress
  claim_id:uint64
  amount:Coins
  valid_after:uint64
  expires_at:uint64
= ClaimAuthorization;
```

固定值：

```text
domain  = 0x53484341  // SHCA
version = 1
```

签名：

```text
Ed25519.sign(cell_hash(ClaimAuthorization), signer_secret_key)
```

链上验证：

```text
isSignatureValid(
  ClaimAuthorization.toCell().hash(),
  signature,
  signer_public_key
)
```

授权必须绑定：

- 当前领取合约地址；
- 当前消息发送钱包地址；
- 唯一 `claim_id`；
- 精确整数SHORE数量；
- 生效时间；
- 过期时间。

因此，一份授权不能跨合约、跨钱包、跨金额或跨领取ID重放。

## 4. 用户领取消息

Opcode：

```text
0x5348434c  // SHCL
```

TL-B：

```text
claim_request#5348434c
  claim_id:uint64
  amount:Coins
  valid_after:uint64
  expires_at:uint64
  signature:bits512
= ClaimRequest;
```

TON Connect交易：

```json
{
  "validUntil": 2000000600,
  "network": "-3",
  "messages": [
    {
      "address": "<testnet ShoreClaim address>",
      "amount": "80000000",
      "payload": "<base64 ClaimRequest BOC>"
    }
  ]
}
```

其中：

```text
80000000 nanotons = 0.08 TON
```

API默认授权时间窗：

```text
valid_after = server_now - 30 seconds
expires_at  = server_now + 600 seconds
```

钱包必须由用户显式确认。前端不得在页面加载、钱包连接或Dashboard刷新时自动调用 `sendTransaction`。

钱包返回BOC后，API递归检查其Cell引用树，必须找到精确的内部消息：

- 目标地址等于当前ShoreClaim；
- TON金额恰好为0.08 TON；
- 消息体Hash等于本次ClaimRequest Payload；
- BOC只有一个根，大小不超过24 KB，遍历不超过256个Cell。

任意无关BOC、错误目标、错误金额或错误Payload都不能把D1领取推进为 `submitted`。

## 5. Jetton转账消息

领取合约验证通过后，向配置的 SHORE distribution Jetton Wallet 发送标准Jetton Transfer：

```text
jetton_transfer#0f8a7ea5
  query_id:uint64
  jetton_amount:Coins
  transfer_recipient:MsgAddress
  send_excesses_to:MsgAddress
  custom_payload:(Maybe ^Cell)
  forward_ton_amount:Coins
  forward_payload:(Either Cell ^Cell)
= JettonTransfer;
```

V1字段：

```text
query_id              = claim_id
jetton_amount          = amount
transfer_recipient     = claimant
send_excesses_to       = ShoreClaim contract
custom_payload         = null
forward_ton_amount     = 0.001 TON
forward_payload        = empty inline payload
outgoing message value = 0.06 TON
```

领取合约不铸币。distribution Jetton Wallet必须预先持有足够SHORE余额。

## 6. 状态机

```text
NONE (0)
→ PENDING (1)
→ COMPLETED (2)
```

首次有效领取：

```text
NONE
→ 写入PENDING
→ 发送Jetton Transfer
```

同一 `claim_id` 在PENDING或COMPLETED状态下再次提交必须失败。

### 初始Jetton调用bounce

当发送到 distribution Jetton Wallet 的消息发生bounce，且满足：

- bounce发送者等于配置的distribution Jetton Wallet；
- bounced body Opcode为标准Jetton Transfer；
- `query_id`存在；
- 记录状态为PENDING；
- bounced金额与记录金额一致；

则：

```text
PENDING → 删除记录 → NONE
```

用户可获取新的后端授权重新领取。

### 下游异步结果

distribution Jetton Wallet接受消息，不代表最终接收钱包一定完成入账。V1不猜测下游异步结果。

链上索引器确认成功后，管理员操作：

```text
PENDING → COMPLETED
```

确认失败且需要恢复时，必须：

1. 暂停新领取；
2. 提供链上失败证据；
3. 等待授权过期后至少86400秒；
4. 执行RESET；
5. 恢复后重新签发授权。

## 7. 管理消息

### Pause

```text
set_paused#53485041
  query_id:uint64
  paused:bool
= SetPaused;
```

### Rotate signer

```text
rotate_signer#53485347
  query_id:uint64
  signer_public_key:uint256
= RotateSigner;
```

### Set distribution wallet

```text
set_distribution_wallet#53484a57
  query_id:uint64
  distribution_jetton_wallet:MsgAddress
= SetDistributionWallet;
```

### Resolve pending

```text
resolve_pending#53485253
  query_id:uint64
  claim_id:uint64
  resolution:uint8
= ResolvePending;
```

Resolution：

```text
1 = COMPLETE
2 = RESET
```

所有管理消息只允许配置的admin地址发送。

## 8. Getter

```text
get_claim_status(claim_id)
get_claim_details(claim_id)
get_config()
get_authorization_hash(claimant, claim_id, amount, valid_after, expires_at)
```

`get_authorization_hash`用于验证后端和链上的序列化完全一致。

## 9. Exit codes

```text
1001 UNAUTHORIZED
1002 PAUSED
1003 INVALID_SIGNATURE
1004 AUTHORIZATION_EXPIRED
1005 AUTHORIZATION_FROM_FUTURE
1006 CLAIM_ALREADY_EXISTS
1007 INVALID_AMOUNT
1008 INSUFFICIENT_TON
1009 CLAIM_NOT_FOUND
1010 CLAIM_NOT_PENDING
1011 INVALID_RESOLUTION
1012 RESET_REQUIRES_PAUSE
1013 RESET_DELAY_ACTIVE
1014 INVALID_BOUNCE_SENDER
```

## 10. API持久化

D1 `token_claims`保存：

```text
id                        内部clm_ ID
onchain_claim_id          uint64十进制字符串
contract_address          Testnet领取合约地址
authorization_valid_after Unix秒
authorization_expires_at  Unix秒
authorization_hash        十六进制Cell hash
signer_public_key_hex     生成该授权的32字节公钥
authorization_payload_boc base64 ClaimRequest BOC
transaction_valid_until   TON Connect validUntil
transaction_boc           钱包返回的已签名BOC
submission_boc_hash       钱包BOC根Cell哈希
transaction_hash          链上索引确认后的交易哈希
status                    prepared/submitted/confirmed/failed
```

后端签名种子只能作为Cloudflare Secret保存：

```text
SHORE_CLAIM_SIGNER_SEED_BASE64
```

公开配置只保存对应公钥：

```text
SHORE_CLAIM_SIGNER_PUBLIC_KEY_HEX
```

启动或签名时，后端必须验证种子派生公钥与配置公钥一致。

## 11. 上线阻断

以下条件未关闭前不得部署主网：

- ShoreJetton decimals未固定为0；
- distribution Jetton Wallet未验证归属和余额；
- admin仍是单签普通钱包；
- 合约未完成独立审计；
- Testnet端到端领取未完成；
- 链上索引确认和超时恢复未完成；
- 代码哈希与审计版本不一致；
- D1、API和前端消息Schema不一致。
