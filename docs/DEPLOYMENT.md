# SHORE Deployment

## 1. Prerequisites

- Node.js 24 or a supported version satisfying the root `engines` rule.
- pnpm `10.34.4`.
- A Cloudflare account with Workers, D1, R2 and Queues access.
- Wrangler authentication for remote provisioning and deployment.

Install and verify locally:

```bash
pnpm install
pnpm check
pnpm check:cloudflare
```

## 2. Local development

Start the API:

```bash
pnpm --filter @shore/api dev
```

Start the web application in a second terminal:

```bash
pnpm --filter @shore/web dev
```

Default local endpoints:

```text
Web: http://localhost:3000
API: http://localhost:8787
Health: http://localhost:8787/api/health
```

Use the OpenNext preview before accepting a Web change:

```bash
pnpm preview:web
```

This runs the built application in the Workers `workerd` runtime rather than only the Node.js development server.

## 3. Resource names

### Local

```text
Worker Web: shore-web-local
Worker API: shore-api-local
D1: shore-local
R2: shore-private-local
Queue: shore-jobs-local
DLQ: shore-jobs-local-dlq
```

### Staging

```text
Worker Web: shore-web-staging
Worker API: shore-api-staging
D1: shore-staging
R2: shore-private-staging
Queue: shore-jobs-staging
DLQ: shore-jobs-staging-dlq
TON: Testnet only
```

### Production

```text
Worker Web: shore-web-production
Worker API: shore-api-production
D1: shore-production
R2: shore-private-production
Queue: shore-jobs-production
DLQ: shore-jobs-production-dlq
TON: Mainnet only
```

## 4. Provisioning status

The committed Wrangler API configuration uses a zero UUID for D1 bindings until resources are created under an authenticated Cloudflare account.

Before a remote deployment:

1. run `wrangler login` or configure a scoped API token;
2. create the Staging D1 database, R2 bucket, Queue and dead-letter Queue;
3. replace only the Staging D1 placeholder with the returned database ID;
4. verify resource names and account ownership;
5. run a dry-run bundle check;
6. deploy Staging;
7. run smoke tests.

Production resources are provisioned separately and never reuse Staging IDs.

## 5. Deployment commands

Staging:

```bash
pnpm deploy:staging
```

Production:

```bash
pnpm deploy:production
```

The root commands deploy both applications. Do not run Production deployment until the production readiness gate is approved.

## 6. Secrets

Public, non-sensitive values may live in Wrangler `vars`.

Secrets use:

```bash
wrangler secret put SECRET_NAME --env staging
wrangler secret put SECRET_NAME --env production
```

Never commit:

- Cloudflare API tokens;
- Telegram bot tokens;
- AI provider keys;
- wallet mnemonics or private keys;
- TON deployment keys;
- administrator session secrets.

## 7. CI

GitHub Actions executes:

```text
pnpm install --frozen-lockfile
pnpm check
pnpm check:cloudflare
```

Remote deployment is intentionally not part of the initial CI workflow until scoped Cloudflare secrets and protected GitHub environments are configured.

## 8. Staging smoke test

After deployment verify:

1. Web root loads and contains `负债不是身份，上岸才是目标`.
2. No framework error overlay appears.
3. Browser console has no application error.
4. API `/api/health` returns HTTP 200.
5. The response environment is `staging`.
6. `x-request-id` is returned.
7. Production resources show no new writes.

## 9. Rollback

Application rollback uses Cloudflare deployment versions. Database migrations require a separately documented forward-fix or rollback path.

A rollback must not silently point a newer application at an incompatible older schema.
