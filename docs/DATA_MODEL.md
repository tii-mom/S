# SHORE Data Model V1

## 1. Status

Operational D1 migrations are now committed:

```text
0001_operational_core.sql
0002_runtime_hardening.sql
```

They support Local and controlled Staging. Applying them to Production remains a separate reviewed operation.

## 2. Current tables

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

## 3. Global rules

- Primary keys are stable application-generated text identifiers.
- Telegram users use `tg_<telegram_id>` as a stable user key.
- Timestamps use UTC ISO-8601 strings.
- Fiat and stable-reward values use integer minor units.
- AP and SHORE quantities use integers.
- Prices use decimal strings.
- No authoritative balance uses SQLite `REAL` or JavaScript floating point.
- User-visible mutations use idempotency keys where retries may occur.
- Administrative writes create audit records in the same logical operation.
- Private R2 files are referenced by non-public object keys.

## 4. Identity and sessions

### users

```text
id
display_name
status
created_at
updated_at
```

### sessions

```text
id
user_id
token_hash
expires_at
revoked_at
created_at
last_seen_at
```

The plaintext session token is returned only to the client. D1 stores the SHA-256 hash.

## 5. Debt summary

```text
id
user_id
currency
confirmed_amount_minor
covered_amount_minor
status
confirmed_at
created_at
updated_at
```

Raw debt screenshots and OCR text are not stored in this table.

Current Telegram first login creates a zero-value confirmed summary. Real debt onboarding must later replace it through an explicit user-confirmed mutation.

## 6. Mission model

### missions

```text
id
title
description
category
platform
estimated_minutes
stable_reward_minor
stable_reward_currency
ap_reward
shore_rights_reward
risk_level
verification_method
proof_instructions
status
starts_at
ends_at
created_at
updated_at
```

### mission_executions

```text
id
mission_id
user_id
status
started_at
submitted_at
reviewed_at
completed_at
updated_at
```

One user has at most one execution per mission.

Execution states:

```text
started
proof_pending
manual_review
approved
rejected
resubmission_required
cancelled
```

## 7. Proof model

```text
id
execution_id
user_id
evidence_url
r2_object_key
original_filename
content_type
size_bytes
note
status
review_reason
reviewer_type
idempotency_key
created_at
reviewed_at
updated_at
```

At least one of `evidence_url` or `r2_object_key` must be present.

Proof states:

```text
queued
manual_review
approved
rejected
resubmission_required
```

A unique proof idempotency key prevents retry duplication.

## 8. Reward records

### points_ledger

Append-only AP entries:

```text
id
user_id
entry_type
amount
reference_type
reference_id
idempotency_key
created_at
created_by
reason
```

Entry types:

```text
earn
reverse
adjust
```

### shore_entitlements

```text
id
user_id
source_type
source_id
round_number
amount
status
idempotency_key
unlocks_at
claimed_at
created_at
updated_at
```

States:

```text
locked
claimable
claim_pending
claimed
reversed
```

### reward_entitlements

Stable reward eligibility is separate from payment:

```text
id
user_id
execution_id
currency
amount_minor
status
idempotency_key
created_at
updated_at
```

States:

```text
pending
payout_ready
paid
reversed
```

`pending` does not mean money was transferred.

## 9. TON model

### wallets

```text
id
user_id
address_raw
address_friendly
network
proof_verified_at
wallet_app
created_at
updated_at
```

A wallet address can belong to only one SHORE user per network.

### ton_proof_nonces

```text
id
user_id
nonce_hash
expires_at
consumed_at
created_at
```

Only a nonce hash is stored. A successful wallet proof atomically consumes the nonce.

### token_claims

```text
id
user_id
wallet_id
entitlement_id
network
status
transaction_boc
transaction_hash
failure_code
idempotency_key
created_at
updated_at
```

States:

```text
blocked
prepared
submitted
confirmed
failed
```

A partial unique index prevents more than one active claim for the same entitlement. A D1 trigger changes a claimable entitlement to `claim_pending` when a prepared claim is inserted.

## 10. Rounds

```text
round_number
target_price_decimal
required_actions
required_revenue_minor
required_liquidity_minor
personal_requirement
release_amount
status
price_progress
action_progress
revenue_progress
liquidity_progress
updated_at
```

Round status:

```text
completed
claimable
qualified
active
locked
```

The displayed overall progress is derived from the weakest required gate.

## 11. Audit log

```text
id
user_id
actor_type
actor_id
event_type
reference_type
reference_id
detail_json
request_id
created_at
```

Audit events cover session creation, mission start, Proof submission, review state, wallet verification, file access and claim preparation.

## 12. Migration policy

Every migration must pass:

1. fresh database application;
2. upgrade from the previous committed schema;
3. repeated migration command safety;
4. data preservation checks;
5. forward-fix or rollback plan;
6. Local Smoke after application;
7. Staging backup before remote application.

Applied Production migrations are immutable. Corrections use a new numbered migration.
