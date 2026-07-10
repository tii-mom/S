CREATE UNIQUE INDEX IF NOT EXISTS idx_token_claims_active_entitlement
  ON token_claims(entitlement_id)
  WHERE status IN ('prepared', 'submitted', 'confirmed');

CREATE INDEX IF NOT EXISTS idx_ton_proof_nonces_unconsumed
  ON ton_proof_nonces(user_id, expires_at)
  WHERE consumed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_reward_entitlements_execution
  ON reward_entitlements(execution_id, status);

CREATE TRIGGER IF NOT EXISTS trg_token_claim_prepare_entitlement
AFTER INSERT ON token_claims
WHEN NEW.status = 'prepared'
BEGIN
  UPDATE shore_entitlements
     SET status = 'claim_pending', updated_at = NEW.created_at
   WHERE id = NEW.entitlement_id
     AND user_id = NEW.user_id
     AND status = 'claimable';
END;
