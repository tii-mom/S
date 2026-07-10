import { TOKEN_SYMBOL } from "@shore/shared";

export const foundationItems = [
  { label: "Web", value: "Next.js / Workers", state: "READY" },
  { label: "API", value: "Hono / Workers", state: "READY" },
  { label: "Data", value: "D1 / R2 / Queues", state: "BOUND" },
  { label: "Chain", value: "TON / Tolk", state: "PLANNED" },
] as const;

export const userPath = ["上传负债", "完成任务", `领取 ${TOKEN_SYMBOL}`] as const;
