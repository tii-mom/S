import { spawn } from "node:child_process";
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
    output = `${output}${chunk.toString()}`.slice(-10_000);
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
      if (response.ok && (await validate(response))) {
        return;
      }
      lastError = new Error(`${url} returned HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw lastError ?? new Error(`Timed out waiting for ${url}`);
}

function stopAll() {
  for (const { child } of processes) {
    if (child.pid === undefined || child.exitCode !== null) {
      continue;
    }

    try {
      if (process.platform === "win32") {
        child.kill("SIGTERM");
      } else {
        process.kill(-child.pid, "SIGTERM");
      }
    } catch {
      child.kill("SIGTERM");
    }
  }
}

try {
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

  console.log("SHORE local smoke passed: Web and API are responding correctly.");
} catch (error) {
  console.error("SHORE local smoke failed.", error);
  for (const processInfo of processes) {
    console.error(`\n--- ${processInfo.label} output ---\n${processInfo.output()}`);
  }
  process.exitCode = 1;
} finally {
  stopAll();
}
