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

Future authentication must validate Telegram Init Data server-side and use secure server sessions for Web access.

Required properties:

- signed and time-bounded login payloads;
- replay protection;
- secure, HTTP-only session cookies;
- CSRF protection for browser mutations;
- stronger authentication for administrators;
- explicit session revocation.

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
- single-admin treasury control;
- unaudited P0/P1 contract issue;
- shared Staging/Production resources;
- missing private-file deletion;
- untraceable point adjustment;
- absent incident pause and recovery procedure.
