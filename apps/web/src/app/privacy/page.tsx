export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px", lineHeight: 1.8 }}>
      <h1>SHORE Staging 隐私说明</h1>
      <p>任务Proof文件存储在私有R2对象中，只能由所属用户或授权审核流程访问，不提供公开对象地址。</p>
      <p>
        系统仅保存会话哈希、任务状态、审核记录、积分账本、奖励资格和经过ton_proof验证的钱包地址。
      </p>
      <p>系统不会请求或保存钱包私钥、助记词、Telegram验证码或社交平台密码。</p>
    </main>
  );
}
