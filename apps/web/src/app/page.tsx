import { APP_NAME } from "@shore/shared";

import { foundationItems, userPath } from "@/lib/foundation";

export default function HomePage() {
  return (
    <main className="min-h-dvh overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8 lg:px-12">
        <header className="flex items-center justify-between border-b border-white/8 pb-5">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-full border border-[var(--gold)]/45 bg-[var(--gold)]/10 text-sm font-semibold text-[var(--gold)]">
              S
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.22em] text-white">{APP_NAME}</p>
              <p className="mt-0.5 text-[10px] tracking-[0.25em] text-white/38">SHORE</p>
            </div>
          </div>

          <div className="rounded-full border border-emerald-300/15 bg-emerald-300/6 px-3 py-1.5 text-[10px] font-medium tracking-[0.16em] text-emerald-200/80">
            FOUNDATION ONLINE
          </div>
        </header>

        <section className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[1.08fr_0.92fr] lg:py-20">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.035] px-3 py-1.5 text-xs text-white/52">
              <span className="size-1.5 rounded-full bg-[var(--gold)] shadow-[0_0_12px_var(--gold)]" />
              Cloudflare 全栈工程基线
            </div>

            <h1 className="max-w-3xl text-balance text-5xl font-semibold leading-[1.04] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
              负债不是身份，
              <span className="gold-text">上岸才是目标。</span>
            </h1>

            <p className="mt-7 max-w-xl text-pretty text-base leading-7 text-white/50 sm:text-lg">
              上传负债，完成任务，领取上岸币。产品保持一个目标、一条路径、一次主要操作。
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-2.5">
              {userPath.map((step, index) => (
                <div key={step} className="flex items-center gap-2.5">
                  <span className="rounded-full border border-white/8 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white/70">
                    {index + 1}. {step}
                  </span>
                  {index < userPath.length - 1 ? (
                    <span className="text-sm text-[var(--gold)]/40">→</span>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="mt-10 flex items-center gap-4">
              <div className="rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-black shadow-[0_14px_45px_rgba(216,184,106,0.16)]">
                Phase 0 正在执行
              </div>
              <p className="max-w-56 text-xs leading-5 text-white/36">
                当前仅开放工程基线，不连接真实资产或主网支付。
              </p>
            </div>
          </div>

          <div className="terminal-card rounded-[1.75rem] border border-white/9 p-5 shadow-2xl shadow-black/30 sm:p-6">
            <div className="flex items-center justify-between border-b border-white/8 pb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/34">System baseline</p>
                <h2 className="mt-2 text-xl font-medium tracking-[-0.02em] text-white">
                  部署准备状态
                </h2>
              </div>
              <div className="text-right">
                <p className="font-mono text-xs text-[var(--gold)]">SHORE-00</p>
                <p className="mt-1 text-[10px] text-white/28">2026.07.10</p>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              {foundationItems.map((item) => (
                <div
                  key={item.label}
                  className="grid grid-cols-[4rem_1fr_auto] items-center gap-3 rounded-xl border border-white/[0.055] bg-black/20 px-4 py-3.5"
                >
                  <span className="font-mono text-[11px] tracking-[0.12em] text-white/32">
                    {item.label}
                  </span>
                  <span className="text-sm text-white/70">{item.value}</span>
                  <span
                    className={
                      item.state === "PLANNED"
                        ? "font-mono text-[10px] tracking-[0.12em] text-white/30"
                        : "font-mono text-[10px] tracking-[0.12em] text-emerald-200/70"
                    }
                  >
                    {item.state}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2.5">
              {[
                ["环境", "3"],
                ["核心页面", "4"],
                ["主流程", "1"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/[0.055] bg-white/[0.025] p-3.5"
                >
                  <p className="font-mono text-xl text-white">{value}</p>
                  <p className="mt-1 text-[10px] tracking-[0.12em] text-white/30">{label}</p>
                </div>
              ))}
            </div>

            <p className="mt-5 border-t border-white/8 pt-4 text-xs leading-5 text-white/32">
              Local → Staging → Production。任何阶段未通过门禁，不进入下一阶段。
            </p>
          </div>
        </section>

        <footer className="flex flex-col gap-2 border-t border-white/8 pt-5 text-[10px] tracking-[0.12em] text-white/25 sm:flex-row sm:items-center sm:justify-between">
          <span>SHORE FOUNDATION V1</span>
          <span>Cloudflare Workers · TON · Tolk</span>
        </footer>
      </div>
    </main>
  );
}
