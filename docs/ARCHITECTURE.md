# SHORE Architecture

## 1. Purpose

This document records the implemented architecture baseline for SHORE. It describes code and deployment boundaries only; it does not add product features.

## 2. Runtime topology

```text
Telegram Mini App / Web / PWA
              │
              ▼
     Next.js on Cloudflare Workers
              │ HTTPS
              ▼
       Hono API Worker
       ├── D1: structured ledgers and state
       ├── R2: private debt and proof files
       ├── Queues: AI, review, sync, retry jobs
       └── Cron: cleanup, aggregation, reconciliation
              │
              ▼
          TON network
       ├── ShoreJetton
       ├── GenesisSale
       ├── VestingController
       └── CommunityDistributor
```

## 3. Repository boundaries

- `apps/web`: user product and operations routes in one Next.js application.
- `apps/api`: public and administrative API, asynchronous queue consumer and scheduled handlers.
- `packages/shared`: runtime-safe schemas, constants and shared types.
- `packages/database`: introduced when D1 migrations begin.
- `packages/ton`: introduced when TON wrappers and indexers begin.
- `contracts`: introduced during the Tolk contract phase.

The browser never receives Cloudflare administration credentials, TON management keys or raw database bindings.

## 4. Web application

The web application uses Next.js App Router and is adapted to Cloudflare Workers through `@opennextjs/cloudflare`.

Implemented baseline:

- strict TypeScript;
- mobile-first root page;
- Cloudflare Worker bundle generation;
- Local, Staging and Production Worker names;
- `nodejs_compat` and a current compatibility date;
- observability enabled;
- no mainnet or real-payment code.

The web application calls the API over HTTPS. Business writes must not be implemented as unauthenticated client-only state.

## 5. API Worker

The API uses Hono and exposes a versioned health foundation at `/api/health`.

Every response receives:

- a request ID;
- basic security headers;
- environment-specific CORS;
- a stable JSON error shape.

The initial Worker also contains a Queue consumer entry point so asynchronous work can be added without replacing the deployment shape.

## 6. Data responsibilities

### D1

D1 stores structured state and append-only ledgers:

- users and sessions;
- confirmed debt summaries;
- tasks and submissions;
- points ledger;
- referrals;
- audit logs;
- chain synchronization state.

Financial values and token quantities must use integer smallest units or decimal strings. JavaScript floating-point numbers must not be used for balances.

### R2

R2 stores non-public binary objects:

- debt screenshots and PDFs;
- task proof images;
- generated share cards;
- controlled exports.

R2 objects are private by default. Access is issued through authenticated API checks, not public bucket URLs.

### Queues

Queues isolate slow and retryable work:

- AI debt analysis;
- proof review;
- file cleanup;
- TON index synchronization;
- notification delivery;
- failed transaction reconciliation.

Queue consumers must be idempotent and use dead-letter queues for exhausted retries.

## 7. TON boundary

TON contracts will be written in Tolk and tested locally before Testnet integration.

The application layer may calculate eligibility and prepare proofs, but the chain remains the authority for:

- token supply;
- sale package limits;
- vesting entitlements;
- claimed amounts;
- community distribution claims.

The API indexer is a read model. It must be replayable from chain data and must not create token rights by itself.

## 8. Environment separation

```text
Local      → local D1/R2/Queue simulation → TON Sandbox
Staging    → dedicated Cloudflare resources → TON Testnet
Production → dedicated Cloudflare resources → TON Mainnet
```

Resource names are defined in Wrangler configuration. Actual D1 identifiers remain zero-value placeholders until the authenticated provisioning step creates the resources.

No environment may share user data, private objects, queues or contract addresses with another environment.

## 9. Failure policy

The system fails closed for:

- missing authentication;
- unknown environment;
- missing price source;
- conflicting chain state;
- exhausted AI confidence;
- unavailable sensitive-file authorization;
- round activation requirements.

User-owned entitlements fail recoverably: a timeout, Queue retry, index delay or TON bounce must not destroy or duplicate an entitlement.
