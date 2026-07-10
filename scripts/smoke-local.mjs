import { spawn, execFileSync } from "node:child_process";
import process from "node:process";

const root = new URL("..", import.meta.url).pathname;
const processes = [];

function start(label, args) {
  const child = spawn("pnpm", args, {
    cwd: root,
    detached: process.platform !== "win32",
    env: {
      ...process.env,
      CI: "1",
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let output = "";
  const capture = (chunk) => {
    output = `${output}${chunk.toString()}`.slice(-20_000);
  };

  child.stdout.on("data", capture);
  child.stderr.on("data", capture);
  processes.push({ label, child, output: () => output });
}

async function waitFor(url, validate, timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok && (await validate(response))) return;
      lastError = new Error(`${url} returned HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw lastError ?? new Error(`Timed out waiting for ${url}`);
}

async function requestJson(path, init = {}) {
  const response = await fetch(`http://127.0.0.1:8787${path}`, init);
  const body = await response.json();
  return { response, body };
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

async function stopAll() {
  const signal = (child, signalName) => {
    if (child.pid === undefined || child.exitCode !== null) return;
    try {
      if (process.platform === "win32") child.kill(signalName);
      else process.kill(-child.pid, signalName);
    } catch {
      child.kill(signalName);
    }
  };

  for (const { child } of processes) signal(child, "SIGTERM");
  await new Promise((resolve) => setTimeout(resolve, 500));
  for (const { child } of processes) signal(child, "SIGKILL");
}

try {
  execFileSync("pnpm", ["--filter", "@shore/api", "db:migrate:local"], {
    cwd: root,
    env: { ...process.env, CI: "1" },
    stdio: "pipe",
  });

  start("api", ["--filter", "@shore/api", "dev"]);
  start("web", [
    "--filter",
    "@shore/web",
    "exec",
    "next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3100",
  ]);

  await waitFor("http://127.0.0.1:8787/api/health", async (response) => {
    const body = await response.json();
    return (
      body.ok === true &&
      body.service === "shore-api" &&
      body.environment === "local" &&
      Boolean(response.headers.get("x-request-id"))
    );
  });

  await waitFor("http://127.0.0.1:3100", async (response) => {
    const html = await response.text();
    return html.includes("SHORE.TERMINAL") && html.includes("terminal-layout");
  });

  const bootstrap = await requestJson("/api/v1/session/bootstrap", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ displayName: "Smoke Test User" }),
  });
  expect(bootstrap.response.status === 201, "Staging session bootstrap did not return 201.");
  expect(typeof bootstrap.body.token === "string", "Staging session token is missing.");
  const authHeaders = { authorization: `Bearer ${bootstrap.body.token}` };

  const dashboard = await requestJson("/api/v1/dashboard", { headers: authHeaders });
  expect(dashboard.response.status === 200, "D1 dashboard did not return 200.");
  expect(dashboard.body.source === "d1", "Dashboard is not sourced from D1.");
  expect(dashboard.body.rounds?.length === 18, "D1 dashboard does not contain 18 rounds.");
  expect(dashboard.body.mission?.id, "D1 dashboard has no active mission.");

  const startMission = await requestJson(
    `/api/v1/missions/${encodeURIComponent(dashboard.body.mission.id)}/start`,
    {
      method: "POST",
      headers: {
        ...authHeaders,
        "x-idempotency-key": `smoke-start-${crypto.randomUUID()}`,
      },
    },
  );
  expect(startMission.response.status === 200, "Mission start did not return 200.");
  const executionId = startMission.body.execution?.id;
  expect(executionId, "Mission execution ID is missing.");

  const proofForm = new FormData();
  proofForm.set(
    "note",
    "Smoke test proof note with enough detail to pass the minimum validation requirement.",
  );
  proofForm.set("evidenceUrl", "https://example.com/shore-smoke-proof");
  const proof = await requestJson(`/api/v1/executions/${encodeURIComponent(executionId)}/proofs`, {
    method: "POST",
    headers: {
      ...authHeaders,
      "x-idempotency-key": `smoke-proof-${crypto.randomUUID()}`,
    },
    body: proofForm,
  });
  expect(proof.response.status === 202, "Proof submission did not return 202.");
  expect(proof.body.execution?.proof?.status === "queued", "Proof was not persisted as queued.");

  const claim = await requestJson("/api/v1/claims/intents", {
    method: "POST",
    headers: {
      ...authHeaders,
      "x-idempotency-key": `smoke-claim-${crypto.randomUUID()}`,
    },
  });
  expect(claim.response.status === 200, "Blocked claim readiness should return a typed 200 body.");
  expect(
    claim.body.error === undefined,
    "Blocked claim should return a typed claim-readiness body.",
  );
  expect(
    claim.body.code === "WALLET_REQUIRED",
    "Claim did not fail closed on wallet verification.",
  );

  console.log(
    "SHORE local smoke passed: D1 session, dashboard, mission, proof queue, claim guard, Web and API are operational.",
  );
} catch (error) {
  console.error("SHORE local smoke failed.", error);
  for (const processInfo of processes) {
    console.error(`\n--- ${processInfo.label} output ---\n${processInfo.output()}`);
  }
  process.exitCode = 1;
} finally {
  await stopAll();
}
