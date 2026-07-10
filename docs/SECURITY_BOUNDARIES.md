# SHORE Security Boundaries

## 1. Sensitive user group

SHORE handles debt information and later digital assets. Security and privacy failures can cause financial and personal harm. Product simplicity must not remove safety controls.

## 2. Client boundary

The browser and Telegram Mini App are untrusted clients.

Never trust client claims for:

- authenticated identity;
- debt ownership;
- task completion;
- point balance;
- purchase confirmation;
- claim eligibility;
- round activation;
- administrator role.

The client never receives administrator secrets, AI provider secrets, Cloudflare API tokens, wallet private keys or raw database credentials.

## 3. Authentication boundary

Telegram Mini App authentication validates raw `initData` server-side. The client must never treat `initDataUnsafe` as authenticated identity.

Implemented controls:

- Telegram WebApp HMAC verification;
- one-hour `auth_date` window;
- constant-time hash comparison;
- stable Telegram user ID;
- opaque seven-day SHORE session;
- only the session-token hash is stored in D1;
- Production disables ordinary browser bootstrap sessions;
- administrator review uses a separate Cloudflare Secret.

Current controlled-Staging limitation:

- the Web client carries the opaque session as a Bearer token in browser session storage;
- Production public launch requires migration to a hardened same-origin or HttpOnly-cookie session design, explicit revocation UI and CSRF controls where cookie authentication is used.

## 4. Private files

Debt documents and proof images use a private R2 bucket.

Required controls:

- file type and size validation;
- random non-enumerable object keys;
- ownership check on every read and delete;
- no permanent public URLs;
- access audit log;
- defined retention and deletion process;
- no sensitive OCR text in application logs.

## 5. Task links and SSRF

User-submitted URLs are hostile input.

Validation must block:

- loopback and private network addresses;
- Cloudflare metadata or internal endpoints;
- unsupported protocols;
- redirect chains to blocked destinations;
- oversized responses;
- credential-bearing URLs.

Remote content review should execute in an isolated fetch path with limits.

## 6. Ledgers and idempotency

Points, budgets, purchases and claims use append-only records and idempotency keys.

Retries must not:

- award a task twice;
- record one purchase twice;
- issue a duplicate claim;
- reverse the wrong entry;
- silently overwrite an audit record.

## 7. Cloudflare environments

Local, Staging and Production resources remain separate.

Production access requires:

- scoped Cloudflare credentials;
- protected deployment workflow;
- separate secrets;
- restricted administrator membership;
- deployment and configuration auditability.

## 8. TON boundary

The application never stores user seed phrases or private keys. Wallet interaction uses TON Connect.

Contract administration requires multisig and later time-lock controls. A single Web administrator must not be able to:

- mint beyond supply;
- reopen the founder sale;
- activate a round;
- remove user entitlements;
- transfer treasury funds.

TON asynchronous message failures must restore claimability without enabling replay.

SHORE claim-specific controls:

- SHORE V1 Jetton decimals are fixed at `0` so D1 and chain units cannot diverge;
- claim authorizations bind domain, version, contract, wallet, claim ID, amount and time window;
- the signing seed is a Cloudflare Secret and must never appear in vars, logs or Git;
- the API verifies the seed-derived public key against the configured and deployed public key;
- a TON Connect wallet-returned BOC changes D1 only to `submitted`, never directly to `confirmed`;
- chain confirmation requires independent indexer evidence;
- unresolved submitted claims cannot be automatically reissued;
- manual reset requires pause, delay and recorded chain evidence;
- deployment scripts reject mainnet.

## 9. AI boundary

AI output is untrusted advice, not an authority.

- Debt recognition requires user confirmation.
- Low-confidence proof review enters manual review.
- AI failure never blocks manual debt entry.
- Prompt or content injection must not grant tools, roles, points or assets.
- Model inputs and outputs follow retention and redaction rules.

## 10. Logging

Logs may contain identifiers needed for diagnosis, but must not contain:

- full debt screenshots;
- identity-document numbers;
- card numbers;
- wallet private material;
- authentication tokens;
- raw third-party secrets.

Every request receives a request ID. High-risk administrative actions receive a separate immutable audit record.

## 11. Launch blockers

No public mainnet sale while any of the following remains:

- contract supply or purchase limit bypass;
- claim loss on bounce;
- duplicate claim on retry;
- D1 and Jetton decimal-unit mismatch;
- missing independent chain confirmation for submitted claims;
- signing seed/public-key mismatch or missing rotation procedure;
- single-admin treasury control;
- unaudited P0/P1 contract issue;
- shared Staging/Production resources;
- browser-accessible Bearer session without the approved Production session hardening;
- missing Telegram authentication or administrator Secret rotation procedure;
- missing private-file deletion;
- untraceable point adjustment;
- absent incident pause and recovery procedure.
