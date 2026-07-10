"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import {
  formatCny,
  formatNumber,
  getActiveRound,
  getRoundProgress,
  type PrimaryAction,
  type ShoreExperienceState,
} from "@/lib/shore-experience";

export type SheetMode =
  "setup" | "progress" | "assets" | "round" | "task" | "proof" | "wallet" | "claim" | "success";

type IconName =
  | "anchor"
  | "coin"
  | "close"
  | "arrow"
  | "task"
  | "upload"
  | "link"
  | "wallet"
  | "claim"
  | "check"
  | "lock"
  | "share"
  | "flame"
  | "flag"
  | "reset";

function UiIcon({ name }: { name: IconName }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2.2,
    viewBox: "0 0 24 24",
  };

  switch (name) {
    case "anchor":
      return (
        <svg {...common}>
          <circle cx="12" cy="5" r="2" />
          <path d="M12 7v13M7 11H4M20 11h-3M5 15c1 4 3.5 6 7 6s6-2 7-6M8 18l-3-3M16 18l3-3" />
        </svg>
      );
    case "coin":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 9.5c0-1.2 1.4-2 3.5-2s3.5.8 3.5 2-1.4 2-3.5 2-3.5.8-3.5 2 1.4 2 3.5 2 3.5-.8 3.5-2M12 5.5v13" />
        </svg>
      );
    case "close":
      return (
        <svg {...common}>
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      );
    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h13M14 7l5 5-5 5" />
        </svg>
      );
    case "task":
      return (
        <svg {...common}>
          <path d="M7 4h10v16H7Z" />
          <path d="M9 8h6M9 12h6M9 16h3" />
          <path d="M9 4V2h6v2" />
        </svg>
      );
    case "upload":
      return (
        <svg {...common}>
          <path d="M12 16V4M7 9l5-5 5 5M5 15v5h14v-5" />
        </svg>
      );
    case "link":
      return (
        <svg {...common}>
          <path d="m9 15 6-6" />
          <path d="M7.5 17.5h-1a4 4 0 0 1 0-8h3M16.5 6.5h1a4 4 0 0 1 0 8h-3" />
        </svg>
      );
    case "wallet":
      return (
        <svg {...common}>
          <path d="M4 6h14a2 2 0 0 1 2 2v11H4Z" />
          <path d="M4 6V4h12v2M15 11h5v4h-5a2 2 0 0 1 0-4Z" />
        </svg>
      );
    case "claim":
      return (
        <svg {...common}>
          <path d="M4 9h16v11H4Z" />
          <path d="M5 9V6h14v3M4 14h16M10 12h4v4h-4Z" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4 10-10" />
        </svg>
      );
    case "lock":
      return (
        <svg {...common}>
          <path d="M7 10V8a5 5 0 0 1 10 0v2M6 10h12v10H6Z" />
        </svg>
      );
    case "share":
      return (
        <svg {...common}>
          <circle cx="18" cy="5" r="2.5" />
          <circle cx="6" cy="12" r="2.5" />
          <circle cx="18" cy="19" r="2.5" />
          <path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5" />
        </svg>
      );
    case "flame":
      return (
        <svg {...common}>
          <path d="M12 22c4.4 0 7-2.7 7-6.5 0-3.2-1.7-5.7-4.5-8.5.2 2.6-.8 4-2.3 4.8.2-4.1-2.1-6.8-4.4-8.8.4 3.7-2.8 5.9-2.8 10.7C5 18.6 7.9 22 12 22Z" />
          <path d="M12 22c2.1 0 3.5-1.4 3.5-3.4 0-1.6-.9-2.9-2.4-4.3.1 1.4-.4 2.2-1.2 2.6.1-2.2-1.1-3.5-2.2-4.4.2 2-1.4 3.2-1.4 5.4 0 2.4 1.5 4.1 3.7 4.1Z" />
        </svg>
      );
    case "flag":
      return (
        <svg {...common}>
          <path d="M6 22V3M6 4h11l-2 4 2 4H6" />
        </svg>
      );
    case "reset":
      return (
        <svg {...common}>
          <path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.5M4 4v4.5h4.5" />
        </svg>
      );
  }
}

const actionLabels: Record<PrimaryAction, string> = {
  setup: "开始上岸",
  "start-task": "开始任务",
  "submit-proof": "提交证明",
  "connect-wallet": "连接钱包",
  claim: "领取 SHORE",
  wait: "等待下一轮",
};

const actionIcons: Record<PrimaryAction, IconName> = {
  setup: "anchor",
  "start-task": "task",
  "submit-proof": "upload",
  "connect-wallet": "wallet",
  claim: "claim",
  wait: "lock",
};

export function StatusOrbs({
  progress,
  availableShore,
  claimableShore,
  onProgress,
  onAssets,
}: {
  progress: number;
  availableShore: number;
  claimableShore: number;
  onProgress: () => void;
  onAssets: () => void;
}) {
  return (
    <div className="status-orbs" aria-label="用户状态">
      <button
        type="button"
        className="status-orb status-orb--progress"
        onClick={onProgress}
        aria-label="查看上岸进度"
      >
        <span className="status-orb__liquid" style={{ height: `${Math.max(8, progress)}%` }} />
        <span className="status-orb__icon">
          <UiIcon name="anchor" />
        </span>
        <strong>{progress}%</strong>
      </button>
      <button
        type="button"
        className="status-orb status-orb--asset"
        onClick={onAssets}
        aria-label="查看SHORE资产"
      >
        {claimableShore > 0 ? <span className="status-orb__dot" /> : null}
        <span className="status-orb__icon">
          <UiIcon name="coin" />
        </span>
        <strong>{formatNumber(availableShore)}</strong>
      </button>
    </div>
  );
}

export function PrimaryActionDock({
  action,
  onAction,
}: {
  action: PrimaryAction;
  onAction: () => void;
}) {
  const disabled = action === "wait";
  return (
    <div className="primary-dock">
      <button
        type="button"
        className={`primary-dock__button${disabled ? " primary-dock__button--waiting" : ""}`}
        onClick={onAction}
        disabled={disabled}
      >
        <span className="primary-dock__icon">
          <UiIcon name={actionIcons[action]} />
        </span>
        <strong>{actionLabels[action]}</strong>
        {disabled ? null : <UiIcon name="arrow" />}
      </button>
    </div>
  );
}

function Metric({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  return (
    <div className="sheet-metric">
      <span>
        <UiIcon name={icon} />
      </span>
      <strong>{value}</strong>
      <small>{label}</small>
    </div>
  );
}

function ProgressTrack({ value, label }: { value: number; label: string }) {
  return (
    <div className="sheet-progress">
      <div>
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div className="sheet-progress__track">
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function SheetPrimaryButton({
  children,
  icon,
  onClick,
  disabled = false,
}: {
  children: string;
  icon: IconName;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" className="sheet-primary" onClick={onClick} disabled={disabled}>
      <UiIcon name={icon} />
      <strong>{children}</strong>
    </button>
  );
}

export function ActionSheet({
  mode,
  selectedRound,
  state,
  actionProgress,
  primaryAction,
  onClose,
  onMode,
  onConfirmDebt,
  onStartTask,
  onSubmitProof,
  onConnectWallet,
  onClaim,
  onShare,
  onReset,
}: {
  mode: SheetMode | null;
  selectedRound: number;
  state: ShoreExperienceState;
  actionProgress: number;
  primaryAction: PrimaryAction;
  onClose: () => void;
  onMode: (mode: SheetMode) => void;
  onConfirmDebt: (amount: number) => void;
  onStartTask: () => void;
  onSubmitProof: (proofUrl: string) => void;
  onConnectWallet: () => void;
  onClaim: () => void;
  onShare: () => Promise<void>;
  onReset: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [uploaded, setUploaded] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "done" | "error">("idle");
  const activeRound = getActiveRound(state);

  useEffect(() => {
    if (!mode) return;
    document.body.classList.add("sheet-open");
    return () => document.body.classList.remove("sheet-open");
  }, [mode]);

  useEffect(() => {
    if (mode === "setup") setAmount(state.debtAmount?.toString() ?? "");
    if (mode === "proof") {
      setProofUrl(state.proofUrl);
      setUploaded(false);
    }
    if (mode === "success") setShareState("idle");
  }, [mode, state.debtAmount, state.proofUrl]);

  const roundStatus = useMemo(() => {
    if (selectedRound < activeRound) return "complete";
    if (selectedRound === activeRound) return "current";
    return "locked";
  }, [activeRound, selectedRound]);

  if (!mode) return null;

  function submitDebt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = Number(amount.replaceAll(",", ""));
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    onConfirmDebt(parsed);
    onClose();
  }

  function submitProof(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const proof = proofUrl.trim() || (uploaded ? "mock-upload://shore-proof.png" : "");
    if (!proof) return;
    onSubmitProof(proof);
    onMode("success");
  }

  async function shareProgress() {
    try {
      await onShare();
      setShareState("done");
    } catch {
      setShareState("error");
    }
  }

  function handlePrimaryAction() {
    switch (primaryAction) {
      case "setup":
        onMode("setup");
        break;
      case "start-task":
        onMode("task");
        break;
      case "submit-proof":
        onMode("proof");
        break;
      case "connect-wallet":
        onMode("wallet");
        break;
      case "claim":
        onMode("claim");
        break;
      case "wait":
        break;
    }
  }

  return (
    <div className="sheet-layer">
      <button type="button" className="sheet-scrim" aria-label="关闭面板" onClick={onClose} />
      <section className="action-sheet" role="dialog" aria-modal="true" aria-label="操作面板">
        <div className="action-sheet__handle" />
        <button type="button" className="action-sheet__close" aria-label="关闭" onClick={onClose}>
          <UiIcon name="close" />
        </button>

        {mode === "setup" ? (
          <form className="sheet-content" onSubmit={submitDebt}>
            <div className="sheet-hero-icon sheet-hero-icon--peach">
              <UiIcon name="anchor" />
            </div>
            <div className="sheet-heading">
              <small>第一步</small>
              <h2>设置上岸目标</h2>
              <p>只填负债总额，随后立即开始今日任务。</p>
            </div>
            <label className="amount-field">
              <span>负债总额</span>
              <div>
                <b>¥</b>
                <input
                  aria-label="负债总额"
                  inputMode="numeric"
                  placeholder="186420"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value.replace(/[^0-9]/g, ""))}
                />
                <small>CNY</small>
              </div>
            </label>
            <button type="button" className="sheet-upload" onClick={() => setAmount("186420")}>
              <UiIcon name="upload" />
              <span>
                <strong>上传账单</strong>
                <small>Mock AI 识别示例</small>
              </span>
              <UiIcon name="arrow" />
            </button>
            <button type="submit" className="sheet-primary">
              <UiIcon name="check" />
              <strong>确认</strong>
            </button>
          </form>
        ) : null}

        {mode === "progress" ? (
          <div className="sheet-content">
            <div className="sheet-hero-icon sheet-hero-icon--mint">
              <UiIcon name="anchor" />
            </div>
            <div className="sheet-heading">
              <small>我的目标</small>
              <h2>{state.debtAmount === null ? "尚未设置" : formatCny(state.debtAmount)}</h2>
              <p>这里只记录行动进度，不代表债务已经实际偿还。</p>
            </div>
            <ProgressTrack value={actionProgress} label="行动进度" />
            <div className="sheet-metrics sheet-metrics--three">
              <Metric
                icon="task"
                value={state.taskStatus === "verified" ? "1" : "0"}
                label="有效任务"
              />
              <Metric icon="flame" value={`${state.points}`} label="积分" />
              <Metric icon="share" value={`${state.shareCount}`} label="分享" />
            </div>
            <SheetPrimaryButton icon="anchor" onClick={() => onMode("setup")}>
              {state.debtAmount === null ? "设置目标" : "修改目标"}
            </SheetPrimaryButton>
          </div>
        ) : null}

        {mode === "assets" ? (
          <div className="sheet-content">
            <div className="sheet-hero-icon sheet-hero-icon--gold">
              <UiIcon name="coin" />
            </div>
            <div className="sheet-heading">
              <small>SHORE</small>
              <h2>{formatNumber(state.availableShore)}</h2>
              <p>{state.walletConnected ? "TON 钱包已连接" : "连接钱包后领取链上资产"}</p>
            </div>
            <div className="sheet-metrics sheet-metrics--three">
              <Metric icon="coin" value={formatNumber(state.availableShore)} label="可用" />
              <Metric
                icon="claim"
                value={state.taskStatus === "verified" && !state.claimedRound4 ? "150,000" : "0"}
                label="待领取"
              />
              <Metric icon="flame" value={`${state.points}`} label="积分" />
            </div>
            {primaryAction === "connect-wallet" || primaryAction === "claim" ? (
              <SheetPrimaryButton icon={actionIcons[primaryAction]} onClick={handlePrimaryAction}>
                {actionLabels[primaryAction]}
              </SheetPrimaryButton>
            ) : null}
            <button
              type="button"
              className="sheet-text-button"
              onClick={() => {
                onReset();
                onClose();
              }}
            >
              <UiIcon name="reset" />
              重置演示
            </button>
          </div>
        ) : null}

        {mode === "round" ? (
          <div className="sheet-content">
            <div className={`sheet-round-orb sheet-round-orb--${roundStatus}`}>
              <strong>{selectedRound}</strong>
              {roundStatus === "complete" ? (
                <UiIcon name="check" />
              ) : roundStatus === "locked" ? (
                <UiIcon name="lock" />
              ) : (
                <UiIcon name="flag" />
              )}
            </div>
            <div className="sheet-heading">
              <small>第 {selectedRound} 轮</small>
              <h2>
                {roundStatus === "complete"
                  ? "已完成"
                  : roundStatus === "locked"
                    ? "尚未解锁"
                    : selectedRound === 4
                      ? "当前轮次"
                      : "下一轮准备中"}
              </h2>
              <p>
                {roundStatus === "complete"
                  ? "可查看该轮历史结果。"
                  : roundStatus === "locked"
                    ? "价格与全网行动同时达标后开启。"
                    : "完成个人任务，等待全网条件达标。"}
              </p>
            </div>
            <ProgressTrack
              value={
                roundStatus === "complete"
                  ? 100
                  : selectedRound === activeRound
                    ? selectedRound === 4
                      ? 100
                      : 0
                    : 0
              }
              label="价格"
            />
            <ProgressTrack
              value={roundStatus === "complete" ? 100 : getRoundProgress(state, selectedRound)}
              label="行动"
            />
            <div className="sheet-metrics sheet-metrics--three">
              <Metric
                icon="flame"
                value={`${getRoundProgress(state, selectedRound)}%`}
                label="全网行动"
              />
              <Metric
                icon="coin"
                value={selectedRound === 4 ? "150K" : `${2 ** selectedRound}×`}
                label="本轮权益"
              />
              <Metric
                icon={roundStatus === "complete" ? "check" : "flag"}
                value={
                  roundStatus === "complete"
                    ? "完成"
                    : selectedRound === 4 && state.taskStatus === "verified"
                      ? "达标"
                      : "等待"
                }
                label="个人状态"
              />
            </div>
            {roundStatus === "current" && !state.claimedRound4 ? (
              <SheetPrimaryButton
                icon={actionIcons[primaryAction]}
                onClick={handlePrimaryAction}
                disabled={primaryAction === "wait"}
              >
                {actionLabels[primaryAction]}
              </SheetPrimaryButton>
            ) : null}
          </div>
        ) : null}

        {mode === "task" ? (
          <div className="sheet-content">
            <div className="sheet-hero-icon sheet-hero-icon--peach">
              <UiIcon name="task" />
            </div>
            <div className="sheet-heading">
              <small>今日任务</small>
              <h2>发布一条上岸行动记录</h2>
              <p>用自己的话写下今天准备完成的一件事。</p>
            </div>
            <div className="task-strip">
              <span>
                <b>3</b>
                <small>分钟</small>
              </span>
              <span>
                <b>300</b>
                <small>积分</small>
              </span>
              <span>
                <b>1</b>
                <small>证明</small>
              </span>
            </div>
            <ol className="task-steps">
              <li>
                <span>1</span>写下真实行动
              </li>
              <li>
                <span>2</span>发布到公开主页
              </li>
              <li>
                <span>3</span>返回提交链接
              </li>
            </ol>
            <SheetPrimaryButton
              icon="task"
              onClick={() => {
                onStartTask();
                onClose();
              }}
            >
              开始任务
            </SheetPrimaryButton>
          </div>
        ) : null}

        {mode === "proof" ? (
          <form className="sheet-content" onSubmit={submitProof}>
            <div className="sheet-hero-icon sheet-hero-icon--mint">
              <UiIcon name="upload" />
            </div>
            <div className="sheet-heading">
              <small>Proof of Action</small>
              <h2>提交证明</h2>
              <p>粘贴公开链接，或上传一张完成截图。</p>
            </div>
            <label className="proof-field">
              <span>证明链接</span>
              <div>
                <UiIcon name="link" />
                <input
                  aria-label="证明链接"
                  type="url"
                  placeholder="https://..."
                  value={proofUrl}
                  onChange={(event) => setProofUrl(event.target.value)}
                />
              </div>
            </label>
            <button
              type="button"
              className={`sheet-upload${uploaded ? " sheet-upload--done" : ""}`}
              onClick={() => setUploaded(true)}
            >
              <UiIcon name={uploaded ? "check" : "upload"} />
              <span>
                <strong>{uploaded ? "截图已添加" : "上传截图"}</strong>
                <small>演示模式不会上传真实文件</small>
              </span>
            </button>
            <button
              type="submit"
              className="sheet-primary"
              disabled={!proofUrl.trim() && !uploaded}
            >
              <UiIcon name="check" />
              <strong>提交</strong>
            </button>
          </form>
        ) : null}

        {mode === "wallet" ? (
          <div className="sheet-content">
            <div className="sheet-hero-icon sheet-hero-icon--blue">
              <UiIcon name="wallet" />
            </div>
            <div className="sheet-heading">
              <small>TON</small>
              <h2>连接钱包</h2>
              <p>当前为交互演示，不会请求私钥或发起真实交易。</p>
            </div>
            <div className="wallet-preview">
              <span className="wallet-preview__mark">TON</span>
              <span>
                <strong>TON Connect</strong>
                <small>Testnet Mock</small>
              </span>
              <UiIcon name="check" />
            </div>
            <SheetPrimaryButton
              icon="wallet"
              onClick={() => {
                onConnectWallet();
                onClose();
              }}
            >
              连接 TON 钱包
            </SheetPrimaryButton>
          </div>
        ) : null}

        {mode === "claim" ? (
          <div className="sheet-content">
            <div className="sheet-hero-icon sheet-hero-icon--gold">
              <UiIcon name="claim" />
            </div>
            <div className="sheet-heading">
              <small>第 4 轮</small>
              <h2>150,000 SHORE</h2>
              <p>个人任务与本轮解锁条件已经满足。</p>
            </div>
            <div className="claim-ticket">
              <span>
                <UiIcon name="coin" />
              </span>
              <div>
                <small>可领取</small>
                <strong>150,000</strong>
              </div>
              <b>SHORE</b>
            </div>
            <SheetPrimaryButton
              icon="claim"
              onClick={() => {
                onClaim();
                onMode("success");
              }}
            >
              领取 150,000
            </SheetPrimaryButton>
          </div>
        ) : null}

        {mode === "success" ? (
          <div className="sheet-content sheet-content--success">
            <div className="success-stamp">
              <UiIcon name="check" />
            </div>
            <div className="sheet-heading">
              <small>{state.claimedRound4 ? "ROUND 4" : "+300 POINTS"}</small>
              <h2>{state.claimedRound4 ? "领取成功" : "验证通过"}</h2>
              <p>
                {state.claimedRound4
                  ? "第 4 轮已经完成，第 5 轮进入准备状态。"
                  : "奖励已记录，下一步连接钱包领取 SHORE。"}
              </p>
            </div>
            <div className="success-actions">
              <button type="button" className="sheet-secondary" onClick={shareProgress}>
                <UiIcon name={shareState === "done" ? "check" : "share"} />
                {shareState === "done"
                  ? "已分享"
                  : shareState === "error"
                    ? "重试分享"
                    : "分享进度"}
              </button>
              <button type="button" className="sheet-primary" onClick={onClose}>
                <strong>继续</strong>
                <UiIcon name="arrow" />
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
