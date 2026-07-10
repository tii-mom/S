# SHORE Contract Invariants

## 1. 当前状态

已实现并通过Sandbox测试：

```text
ShoreClaim V1
```

尚未实现：

```text
ShoreJetton
GenesisSale
FounderVestingController
CommunityDistributor
TeamVesting
RoundUnlockController
```

当前合约仅允许受控Testnet验证。未完成独立审计、Testnet部署和链上索引闭环前，不得启用主网。

## 2. SHORE Token单位

V1冻结：

```text
Jetton decimals = 0
Maximum supply = 10,000,000,000 SHORE
Smallest unit = 1 SHORE
```

因此D1权益、API金额、合约金额和用户显示金额使用相同整数单位。

任何修改decimals的提案必须同时修改：

- Jetton metadata；
- D1金额字段和迁移；
- API Schema；
- Claim签名Schema；
- 合约测试；
- 前端显示；
- 总供应量不变量。

## 3. ShoreClaim V1

### 3.1 授权绑定

每份授权必须绑定：

```text
签名域
协议版本
ShoreClaim合约地址
领取钱包地址
唯一claimId
精确SHORE数量
生效时间
过期时间
```

因此授权不能跨合约、跨钱包、跨金额或跨claimId重放。

### 3.2 签名

- 只接受配置公钥对应的Ed25519签名；
- 后端种子派生公钥必须与公开配置公钥一致；
- 错误签名不得修改存储；
- 过期或尚未生效的授权不得修改存储；
- signer轮换只允许admin执行。

### 3.3 唯一领取

```text
NONE → PENDING → COMPLETED
```

- 同一 `claimId` 在PENDING或COMPLETED状态不得再次领取；
- claim记录必须保存领取钱包、金额和授权窗口；
- 金额必须大于0；
- 用户必须附带不低于0.08 TON；
- 用户钱包必须是消息真实发送者。

### 3.4 Jetton转账

- ShoreClaim不铸币；
- 只调用配置的distribution Jetton Wallet；
- 使用标准 `0x0f8a7ea5` Jetton Transfer；
- `query_id`必须等于 `claimId`；
- `jetton_amount`必须等于签名金额；
- `transfer_recipient`必须等于领取钱包；
- `send_excesses_to`必须等于ShoreClaim；
- distribution wallet必须预先拥有足额SHORE。

### 3.5 Bounce恢复

初始发送至distribution Jetton Wallet的消息bounce时，仅在以下条件全部成立时恢复：

- bounce发送者是当前配置的distribution Jetton Wallet；
- bounced Opcode是标准Jetton Transfer；
- bounced `query_id`存在；
- claim处于PENDING；
- bounced金额等于记录金额。

恢复行为：

```text
PENDING → 删除记录 → NONE
```

恢复不能增加用户总权益，也不能产生第二次成功支付。

### 3.6 异步下游结果

TON消息异步执行。distribution Jetton Wallet接受初始消息，不等于最终用户Jetton Wallet已经成功入账。

因此：

- 合约不在初始调用后自动标记COMPLETED；
- D1不把TON Connect返回BOC视为链上成功；
- 必须由索引器读取链上证据；
- 只有确认成功后才能进入COMPLETED/confirmed；
- 不确定结果保持PENDING/submitted，不得重复支付。

### 3.7 管理恢复

管理员执行RESET必须同时满足：

- 合约已暂停；
- claim仍处于PENDING；
- 当前时间晚于 `expiresAt + 86400`；
- 运营侧已保存链上失败或未完成证据。

暂停不得删除、减少或没收用户权益。

### 3.8 管理权限

admin可以：

- pause/unpause；
- rotate signer；
- change distribution wallet；
- resolve pending为COMPLETED；
- 在延迟和暂停条件满足后RESET。

主网前admin必须升级为多签和受控变更流程。单签普通钱包是上线阻断项。

## 4. ShoreJetton（待实现）

- 总供应上限恰好为 `10,000,000,000 SHORE`；
- decimals固定为0；
- 无管理路径可突破供应上限；
- 转账、burn和wallet余额必须保持一致；
- 非法消息不得改变供应或余额；
- metadata管理权必须在公开上线前时间锁或永久关闭。

## 5. GenesisSale（待实现）

- 单份价格为58 TON，除非销售开始前使用新审查版本替换；
- 最大1333份；
- 单地址最大10份；
- 每份授予：
  - 100,000 SHORE即时分配；
  - 2,700,000 SHORE锁定权益；
  - 18轮每轮150,000 SHORE；
- 一条支付消息最多创建一条购买记录；
- 低于价格不得创建部分权益；
- 超额支付处理必须确定；
- Round 1开始后销售永久关闭；
- 成功付款必须对应可恢复的购买权益。

## 6. FounderVestingController（待实现）

- 恰好18轮；
- 每份每轮最多150,000 SHORE；
- 单份总领取不超过2,700,000 SHORE；
- 同一份和同一轮不能确认两次；
- 状态遵循：

```text
eligible → pending transfer → confirmed
```

失败恢复：

```text
pending transfer → bounced/expired → claimable again
```

重试不得导致同一nonce重复成功。

## 7. CommunityDistributor（待实现）

- 每轮Merkle root必须版本化并绑定固定最大分配；
- 每个leaf只能领取一次；
- proof不能跨网络、轮次或地址重放；
- root替换必须经过受控权限和时间锁；
- 成功领取总额不得超过已注资池；
- 未领取余额处理必须在轮次开始前固定。

## 8. TeamVesting（待实现）

- 团队分配与用户、社区池隔离；
- 不得提前释放；
- 管理操作不得修改创世用户权益；
- 接收地址和权限变更必须审计并时间锁。

## 9. RoundUnlockController（待实现）

- 单一应用管理员不能独自激活轮次；
- 缺失或冲突的价格、行动、收入或流动性证据必须失败关闭；
- 轮次单调推进；
- 已开始领取的轮次不能回到LOCKED；
- 轮次激活不能绕过个人领取资格。

## 10. 必需测试

每个合约必须包含：

- 精确边界测试；
- 未授权消息测试；
- 签名域和重放测试；
- 重复领取测试；
- bounce与retry测试；
- pause测试；
- 总量核对；
- getter与前后端序列化一致性测试；
- 属性或不变量测试；
- gas回归报告。

当前ShoreClaim已覆盖10项核心Sandbox测试，但仍未替代独立安全审计。

## 11. 主网上线阻断

存在任一项时不得部署主网：

- Token decimals或单位不一致；
- 合约代码哈希与审计版本不一致；
- claim loss on bounce；
- duplicate claim on retry；
- 下游异步结果被错误视为完成；
- admin仍为单签；
- 未关闭的审计P0/P1；
- 未验证distribution wallet归属和余额；
- 缺失链上索引、超时和恢复流程；
- Testnet端到端证据不完整。
