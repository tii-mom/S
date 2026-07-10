ALTER TABLE token_claims ADD COLUMN onchain_claim_id TEXT;
ALTER TABLE token_claims ADD COLUMN contract_address TEXT;
ALTER TABLE token_claims ADD COLUMN authorization_valid_after INTEGER;
ALTER TABLE token_claims ADD COLUMN authorization_expires_at INTEGER;
ALTER TABLE token_claims ADD COLUMN authorization_hash TEXT;
ALTER TABLE token_claims ADD COLUMN signer_public_key_hex TEXT;
ALTER TABLE token_claims ADD COLUMN authorization_payload_boc TEXT;
ALTER TABLE token_claims ADD COLUMN transaction_valid_until INTEGER;
ALTER TABLE token_claims ADD COLUMN submission_boc_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_token_claims_onchain_claim_id
  ON token_claims(onchain_claim_id)
  WHERE onchain_claim_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_token_claims_submission_boc_hash
  ON token_claims(submission_boc_hash)
  WHERE submission_boc_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_token_claims_submission_watch
  ON token_claims(network, status, updated_at)
  WHERE status IN ('prepared', 'submitted');
