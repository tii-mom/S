PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS debt_summaries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'CNY',
  confirmed_amount_minor INTEGER NOT NULL CHECK (confirmed_amount_minor >= 0),
  covered_amount_minor INTEGER NOT NULL DEFAULT 0 CHECK (covered_amount_minor >= 0),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('draft', 'confirmed', 'archived')),
  confirmed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, status)
);

CREATE TABLE IF NOT EXISTS missions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  platform TEXT NOT NULL,
  estimated_minutes INTEGER NOT NULL CHECK (estimated_minutes > 0),
  stable_reward_minor INTEGER NOT NULL CHECK (stable_reward_minor >= 0),
  stable_reward_currency TEXT NOT NULL DEFAULT 'USD',
  ap_reward INTEGER NOT NULL CHECK (ap_reward >= 0),
  shore_rights_reward INTEGER NOT NULL CHECK (shore_rights_reward >= 0),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  verification_method TEXT NOT NULL,
  proof_instructions TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'paused', 'closed')),
  starts_at TEXT,
  ends_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);

CREATE TABLE IF NOT EXISTS mission_executions (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES missions(id),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('started', 'proof_pending', 'manual_review', 'approved', 'rejected', 'resubmission_required', 'cancelled')),
  started_at TEXT NOT NULL,
  submitted_at TEXT,
  reviewed_at TEXT,
  completed_at TEXT,
  updated_at TEXT NOT NULL,
  UNIQUE(mission_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_mission_executions_user ON mission_executions(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS proof_submissions (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL REFERENCES mission_executions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  evidence_url TEXT,
  r2_object_key TEXT,
  original_filename TEXT,
  content_type TEXT,
  size_bytes INTEGER CHECK (size_bytes IS NULL OR size_bytes >= 0),
  note TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'manual_review', 'approved', 'rejected', 'resubmission_required')),
  review_reason TEXT,
  reviewer_type TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  updated_at TEXT NOT NULL,
  CHECK (evidence_url IS NOT NULL OR r2_object_key IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_proof_submissions_execution ON proof_submissions(execution_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proof_submissions_status ON proof_submissions(status, created_at);

CREATE TABLE IF NOT EXISTS points_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('earn', 'reverse', 'adjust')),
  amount INTEGER NOT NULL,
  reference_type TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  reason TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_points_ledger_user ON points_ledger(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS shore_entitlements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  round_number INTEGER NOT NULL CHECK (round_number BETWEEN 0 AND 18),
  amount INTEGER NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL CHECK (status IN ('locked', 'claimable', 'claim_pending', 'claimed', 'reversed')),
  idempotency_key TEXT NOT NULL UNIQUE,
  unlocks_at TEXT,
  claimed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_shore_entitlements_user ON shore_entitlements(user_id, status);

CREATE TABLE IF NOT EXISTS reward_entitlements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  execution_id TEXT NOT NULL REFERENCES mission_executions(id),
  currency TEXT NOT NULL,
  amount_minor INTEGER NOT NULL CHECK (amount_minor >= 0),
  status TEXT NOT NULL CHECK (status IN ('pending', 'payout_ready', 'paid', 'reversed')),
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reward_entitlements_user ON reward_entitlements(user_id, status);

CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_raw TEXT NOT NULL,
  address_friendly TEXT NOT NULL,
  network TEXT NOT NULL CHECK (network IN ('testnet', 'mainnet')),
  proof_verified_at TEXT NOT NULL,
  wallet_app TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, network),
  UNIQUE(address_raw, network)
);

CREATE TABLE IF NOT EXISTS ton_proof_nonces (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nonce_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ton_proof_nonces_user ON ton_proof_nonces(user_id, expires_at);

CREATE TABLE IF NOT EXISTS token_claims (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_id TEXT NOT NULL REFERENCES wallets(id),
  entitlement_id TEXT NOT NULL REFERENCES shore_entitlements(id),
  network TEXT NOT NULL CHECK (network IN ('testnet', 'mainnet')),
  status TEXT NOT NULL CHECK (status IN ('blocked', 'prepared', 'submitted', 'confirmed', 'failed')),
  transaction_boc TEXT,
  transaction_hash TEXT,
  failure_code TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rounds (
  round_number INTEGER PRIMARY KEY CHECK (round_number BETWEEN 1 AND 18),
  target_price_decimal TEXT NOT NULL,
  required_actions INTEGER NOT NULL CHECK (required_actions >= 0),
  required_revenue_minor INTEGER NOT NULL CHECK (required_revenue_minor >= 0),
  required_liquidity_minor INTEGER NOT NULL CHECK (required_liquidity_minor >= 0),
  personal_requirement TEXT NOT NULL,
  release_amount INTEGER NOT NULL CHECK (release_amount >= 0),
  status TEXT NOT NULL CHECK (status IN ('completed', 'claimable', 'qualified', 'active', 'locked')),
  price_progress INTEGER NOT NULL CHECK (price_progress BETWEEN 0 AND 100),
  action_progress INTEGER NOT NULL CHECK (action_progress BETWEEN 0 AND 100),
  revenue_progress INTEGER NOT NULL CHECK (revenue_progress BETWEEN 0 AND 100),
  liquidity_progress INTEGER NOT NULL CHECK (liquidity_progress BETWEEN 0 AND 100),
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  actor_type TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  reference_type TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  detail_json TEXT NOT NULL,
  request_id TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_reference ON audit_logs(reference_type, reference_id, created_at DESC);

INSERT OR IGNORE INTO missions (
  id, title, description, category, platform, estimated_minutes,
  stable_reward_minor, stable_reward_currency, ap_reward, shore_rights_reward,
  risk_level, verification_method, proof_instructions, status,
  starts_at, ends_at, created_at, updated_at
) VALUES (
  'mission-telegram-onboarding-v1',
  '完成 Telegram Mini App 新手流程并提交真实体验',
  '打开指定 Mini App，完成新手流程，并提交真实体验记录。禁止自动化批量操作、虚假截图或代替他人完成。',
  'PRODUCT_EXPERIENCE',
  'TELEGRAM',
  6,
  480,
  'USD',
  300,
  12000,
  'low',
  'MINI_APP_EVENT_AND_PRIVATE_PROOF',
  '提交 HTTPS 体验链接或一张 PNG/JPEG/WebP 截图，并填写不少于20个字符的体验说明。',
  'active',
  NULL,
  NULL,
  '2026-07-10T00:00:00.000Z',
  '2026-07-10T00:00:00.000Z'
);

INSERT OR IGNORE INTO rounds VALUES (1, '0.00001000', 25000, 1800000, 2000000, '1 task / 300 AP', 150000, 'completed', 100, 100, 100, 100, '2026-07-10T00:00:00.000Z');
INSERT OR IGNORE INTO rounds VALUES (2, '0.00002000', 50000, 3600000, 4000000, '1 task / 300 AP', 150000, 'completed', 100, 100, 100, 100, '2026-07-10T00:00:00.000Z');
INSERT OR IGNORE INTO rounds VALUES (3, '0.00004000', 75000, 5400000, 6000000, '1 task / 300 AP', 150000, 'completed', 100, 100, 100, 100, '2026-07-10T00:00:00.000Z');
INSERT OR IGNORE INTO rounds VALUES (4, '0.00008000', 100000, 7200000, 8000000, '1 task / 300 AP', 150000, 'active', 82, 67, 54, 91, '2026-07-10T00:00:00.000Z');
INSERT OR IGNORE INTO rounds VALUES (5, '0.00016000', 125000, 9000000, 10000000, '2 tasks', 120000, 'qualified', 24, 18, 12, 30, '2026-07-10T00:00:00.000Z');
INSERT OR IGNORE INTO rounds VALUES (6, '0.00032000', 150000, 10800000, 12000000, '2 tasks', 120000, 'locked', 0, 0, 0, 0, '2026-07-10T00:00:00.000Z');
INSERT OR IGNORE INTO rounds VALUES (7, '0.00064000', 175000, 12600000, 14000000, '2 tasks', 120000, 'locked', 0, 0, 0, 0, '2026-07-10T00:00:00.000Z');
INSERT OR IGNORE INTO rounds VALUES (8, '0.00128000', 200000, 14400000, 16000000, '2 tasks', 120000, 'locked', 0, 0, 0, 0, '2026-07-10T00:00:00.000Z');
INSERT OR IGNORE INTO rounds VALUES (9, '0.00256000', 225000, 16200000, 18000000, '3 tasks', 120000, 'locked', 0, 0, 0, 0, '2026-07-10T00:00:00.000Z');
INSERT OR IGNORE INTO rounds VALUES (10, '0.00512000', 250000, 18000000, 20000000, '3 tasks', 120000, 'locked', 0, 0, 0, 0, '2026-07-10T00:00:00.000Z');
INSERT OR IGNORE INTO rounds VALUES (11, '0.01024000', 275000, 19800000, 22000000, '3 tasks', 120000, 'locked', 0, 0, 0, 0, '2026-07-10T00:00:00.000Z');
INSERT OR IGNORE INTO rounds VALUES (12, '0.02048000', 300000, 21600000, 24000000, '3 tasks', 120000, 'locked', 0, 0, 0, 0, '2026-07-10T00:00:00.000Z');
INSERT OR IGNORE INTO rounds VALUES (13, '0.04096000', 325000, 23400000, 26000000, '4 tasks', 120000, 'locked', 0, 0, 0, 0, '2026-07-10T00:00:00.000Z');
INSERT OR IGNORE INTO rounds VALUES (14, '0.08192000', 350000, 25200000, 28000000, '4 tasks', 120000, 'locked', 0, 0, 0, 0, '2026-07-10T00:00:00.000Z');
INSERT OR IGNORE INTO rounds VALUES (15, '0.16384000', 375000, 27000000, 30000000, '4 tasks', 120000, 'locked', 0, 0, 0, 0, '2026-07-10T00:00:00.000Z');
INSERT OR IGNORE INTO rounds VALUES (16, '0.32768000', 400000, 28800000, 32000000, '4 tasks', 120000, 'locked', 0, 0, 0, 0, '2026-07-10T00:00:00.000Z');
INSERT OR IGNORE INTO rounds VALUES (17, '0.65536000', 425000, 30600000, 34000000, '5 tasks', 120000, 'locked', 0, 0, 0, 0, '2026-07-10T00:00:00.000Z');
INSERT OR IGNORE INTO rounds VALUES (18, '1.31072000', 450000, 32400000, 36000000, '5 tasks', 120000, 'locked', 0, 0, 0, 0, '2026-07-10T00:00:00.000Z');
