"use client";

import { useEffect, useState, type CSSProperties } from "react";

import {
  ActionSheet,
  PrimaryActionDock,
  StatusOrbs,
  type SheetMode,
} from "@/components/shore-interaction-layer";
import { getRoundProgress, useShoreExperience } from "@/lib/shore-experience";

const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 3440;

type Point = { x: number; y: number };
type StageKind =
  | "gem"
  | "star"
  | "key"
  | "shield"
  | "moon"
  | "sun"
  | "potion"
  | "scroll"
  | "shell"
  | "clover"
  | "medal"
  | "ring"
  | "spark"
  | "crown"
  | "gift"
  | "chest"
  | "tower"
  | "diamond";

type Stage = Point & {
  kind: StageKind;
  accent: string;
  accentSoft: string;
};

const stages: readonly Stage[] = [
  { x: 205, y: 250, kind: "gem", accent: "#ff7ca8", accentSoft: "#ffc1d7" },
  { x: 470, y: 410, kind: "star", accent: "#62d9df", accentSoft: "#b8f5ee" },
  { x: 785, y: 575, kind: "key", accent: "#ffd35d", accentSoft: "#fff1aa" },
  { x: 650, y: 750, kind: "shield", accent: "#ff8f6d", accentSoft: "#ffd1b8" },
  { x: 345, y: 925, kind: "moon", accent: "#8bd5ff", accentSoft: "#d7f1ff" },
  { x: 185, y: 1105, kind: "sun", accent: "#ffcb5b", accentSoft: "#fff0a8" },
  { x: 440, y: 1280, kind: "potion", accent: "#bd8cff", accentSoft: "#e7d2ff" },
  { x: 770, y: 1455, kind: "scroll", accent: "#ff8fa9", accentSoft: "#ffd1dc" },
  { x: 640, y: 1635, kind: "shell", accent: "#79dfc0", accentSoft: "#c9f5e5" },
  { x: 315, y: 1810, kind: "clover", accent: "#77d97a", accentSoft: "#d0f4c8" },
  { x: 175, y: 1990, kind: "medal", accent: "#ffbd4a", accentSoft: "#ffeab1" },
  { x: 455, y: 2170, kind: "ring", accent: "#77c8ff", accentSoft: "#d1edff" },
  { x: 790, y: 2345, kind: "spark", accent: "#ff79bb", accentSoft: "#ffc9e6" },
  { x: 655, y: 2520, kind: "crown", accent: "#ffca55", accentSoft: "#fff0a9" },
  { x: 330, y: 2700, kind: "gift", accent: "#ff7a87", accentSoft: "#ffc7cb" },
  { x: 175, y: 2875, kind: "chest", accent: "#d59a58", accentSoft: "#ffe0a8" },
  { x: 465, y: 3050, kind: "tower", accent: "#93a5ff", accentSoft: "#d9dfff" },
  { x: 760, y: 3220, kind: "diamond", accent: "#67e3e8", accentSoft: "#c7fbf4" },
] as const;

const decorationPoints = [
  { x: 780, y: 210, type: "cloud", scale: 1.1, rotate: -5 },
  { x: 120, y: 520, type: "flower", scale: 0.9, rotate: 16 },
  { x: 875, y: 820, type: "gem", scale: 0.9, rotate: -12 },
  { x: 115, y: 1000, type: "cloud", scale: 0.8, rotate: 5 },
  { x: 835, y: 1190, type: "star", scale: 1.1, rotate: 13 },
  { x: 145, y: 1425, type: "shell", scale: 0.85, rotate: -18 },
  { x: 875, y: 1650, type: "flower", scale: 0.8, rotate: 22 },
  { x: 120, y: 1775, type: "gem", scale: 0.7, rotate: 14 },
  { x: 850, y: 2010, type: "cloud", scale: 0.9, rotate: -4 },
  { x: 130, y: 2260, type: "star", scale: 1, rotate: 18 },
  { x: 870, y: 2480, type: "shell", scale: 0.8, rotate: 14 },
  { x: 110, y: 2630, type: "flower", scale: 0.82, rotate: -16 },
  { x: 855, y: 2860, type: "gem", scale: 0.82, rotate: -20 },
  { x: 125, y: 3140, type: "cloud", scale: 0.75, rotate: 4 },
] as const;

function createSmoothPath(points: readonly Point[]): string {
  if (points.length < 2) return "";

  let path = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index]!;
    const next = points[index + 1]!;
    const previous = points[index - 1] ?? current;
    const following = points[index + 2] ?? next;
    const controlOneX = current.x + (next.x - previous.x) / 6;
    const controlOneY = current.y + (next.y - previous.y) / 6;
    const controlTwoX = next.x - (following.x - current.x) / 6;
    const controlTwoY = next.y - (following.y - current.y) / 6;
    path += ` C ${controlOneX.toFixed(1)} ${controlOneY.toFixed(1)}, ${controlTwoX.toFixed(1)} ${controlTwoY.toFixed(1)}, ${next.x} ${next.y}`;
  }
  return path;
}

const pathData = createSmoothPath(stages);

function Glyph({ kind }: { kind: StageKind }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2.4,
    viewBox: "0 0 24 24",
  };

  switch (kind) {
    case "gem":
      return (
        <svg {...common}>
          <path d="m4 9 4-5h8l4 5-8 11Z" />
          <path d="m4 9 8 3 8-3M8 4l4 8 4-8" />
        </svg>
      );
    case "star":
      return (
        <svg {...common}>
          <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" />
        </svg>
      );
    case "key":
      return (
        <svg {...common}>
          <circle cx="8" cy="9" r="4" />
          <path d="m11 12 8 8M15 16l2-2M17 18l2-2" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3 5 6v5c0 4.8 3 8.2 7 10 4-1.8 7-5.2 7-10V6Z" />
          <path d="m9 12 2 2 4-5" />
        </svg>
      );
    case "moon":
      return (
        <svg {...common}>
          <path d="M19 15.5A8 8 0 0 1 8.5 5 8 8 0 1 0 19 15.5Z" />
        </svg>
      );
    case "sun":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
        </svg>
      );
    case "potion":
      return (
        <svg {...common}>
          <path d="M9 3h6M10 3v5l-4.5 7.2A3.8 3.8 0 0 0 8.7 21h6.6a3.8 3.8 0 0 0 3.2-5.8L14 8V3" />
          <path d="M8 14h8" />
        </svg>
      );
    case "scroll":
      return (
        <svg {...common}>
          <path d="M6 5h12v13H8a3 3 0 0 1-3-3V6a2 2 0 0 0-2 2v1h3" />
          <path d="M9 9h6M9 13h5" />
        </svg>
      );
    case "shell":
      return (
        <svg {...common}>
          <path d="M4 18c1-7 4.5-12 8-12s7 5 8 12Z" />
          <path d="M12 6v12M8 8l2 10M16 8l-2 10M5.5 12 9 18M18.5 12 15 18" />
        </svg>
      );
    case "clover":
      return (
        <svg {...common}>
          <path d="M12 12c-5-1-7-3.4-5.5-6C8 3.4 11 5 12 8c1-3 4-4.6 5.5-2 1.5 2.6-.5 5-5.5 6Z" />
          <path d="M12 12c-5 1-7 3.4-5.5 6C8 20.6 11 19 12 16c1 3 4 4.6 5.5 2 1.5-2.6-.5-5-5.5-6ZM12 12v9" />
        </svg>
      );
    case "medal":
      return (
        <svg {...common}>
          <path d="m8 3 4 6 4-6M9 4H6l4 7M15 4h3l-4 7" />
          <circle cx="12" cy="15" r="5" />
          <path d="m12 12 1 2 2 .3-1.5 1.5.4 2.2-1.9-1-1.9 1 .4-2.2L9 14.3l2-.3Z" />
        </svg>
      );
    case "ring":
      return (
        <svg {...common}>
          <path d="m8 8 4-5 4 5" />
          <circle cx="12" cy="14" r="6" />
          <path d="M8 8h8" />
        </svg>
      );
    case "spark":
      return (
        <svg {...common}>
          <path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8ZM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7Z" />
        </svg>
      );
    case "crown":
      return (
        <svg {...common}>
          <path d="m4 8 4 4 4-7 4 7 4-4-2 10H6Z" />
          <path d="M6 18h12" />
        </svg>
      );
    case "gift":
      return (
        <svg {...common}>
          <path d="M4 10h16v10H4ZM3 7h18v3H3ZM12 7v13" />
          <path d="M12 7c-3 0-5-1-5-3 0-1.5 1-2 2-2 2 0 3 3 3 5ZM12 7c3 0 5-1 5-3 0-1.5-1-2-2-2-2 0-3 3-3 5Z" />
        </svg>
      );
    case "chest":
      return (
        <svg {...common}>
          <path d="M4 9h16v11H4Z" />
          <path d="M5 9V6h14v3M4 14h16M10 12h4v4h-4Z" />
        </svg>
      );
    case "tower":
      return (
        <svg {...common}>
          <path d="M6 21V9l3-2V4h2v3h2V4h2v3l3 2v12Z" />
          <path d="M9 21v-5h6v5M8 11h2M14 11h2" />
        </svg>
      );
    case "diamond":
      return (
        <svg {...common}>
          <path d="m4 8 4-5h8l4 5-8 13Z" />
          <path d="m4 8 8 4 8-4M8 3l4 9 4-9" />
        </svg>
      );
  }
}

function DecorationGlyph({ type }: { type: (typeof decorationPoints)[number]["type"] }) {
  if (type === "cloud") {
    return (
      <svg viewBox="0 0 120 70">
        <path
          d="M20 55h78c18 0 23-22 8-31-8-5-16-4-22 0C77 6 51 6 42 26 22 18 8 32 12 45c1 5 4 8 8 10Z"
          fill="#d8ddff"
          stroke="#8c8bcc"
          strokeWidth="5"
        />
      </svg>
    );
  }
  if (type === "flower") {
    return (
      <svg viewBox="0 0 90 90">
        <g fill="#ff86b3" stroke="#913c83" strokeWidth="4">
          <ellipse cx="45" cy="21" rx="14" ry="20" />
          <ellipse cx="69" cy="42" rx="14" ry="20" transform="rotate(72 69 42)" />
          <ellipse cx="60" cy="69" rx="14" ry="20" transform="rotate(144 60 69)" />
          <ellipse cx="30" cy="69" rx="14" ry="20" transform="rotate(216 30 69)" />
          <ellipse cx="21" cy="42" rx="14" ry="20" transform="rotate(288 21 42)" />
        </g>
        <circle cx="45" cy="45" r="12" fill="#ffd45e" stroke="#9a5d51" strokeWidth="4" />
      </svg>
    );
  }
  if (type === "gem") {
    return (
      <svg viewBox="0 0 90 100">
        <path d="m12 38 18-25h30l18 25-33 50Z" fill="#72e3ed" stroke="#3d4c9b" strokeWidth="6" />
        <path
          d="m12 38 33 12 33-12M30 13l15 37 15-37"
          fill="none"
          stroke="#d9ffff"
          strokeWidth="5"
        />
      </svg>
    );
  }
  if (type === "shell") {
    return (
      <svg viewBox="0 0 100 90">
        <path
          d="M12 76C17 36 32 12 50 12s33 24 38 64Z"
          fill="#ffb38e"
          stroke="#9b4d7b"
          strokeWidth="6"
        />
        <path
          d="M50 12v64M30 22l10 54M70 22 60 76M17 45l22 31M83 45 61 76"
          fill="none"
          stroke="#ffe2c4"
          strokeWidth="5"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 90 90">
      <path
        d="m45 6 10 25 27 2-21 17 7 27-23-15-23 15 7-27L8 33l27-2Z"
        fill="#ffd35e"
        stroke="#9d557e"
        strokeWidth="6"
      />
    </svg>
  );
}

type StageStatus = "complete" | "current" | "locked";

function StageButton({
  stage,
  index,
  status,
  progress,
  selected,
  onSelect,
}: {
  stage: Stage;
  index: number;
  status: StageStatus;
  progress: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const round = index + 1;
  const style = {
    "--stage-x": `${(stage.x / VIEWBOX_WIDTH) * 100}%`,
    "--stage-y": `${(stage.y / VIEWBOX_HEIGHT) * 100}%`,
    "--stage-accent": stage.accent,
    "--stage-soft": stage.accentSoft,
    "--stage-progress": `${progress * 3.6}deg`,
  } as CSSProperties;

  return (
    <button
      type="button"
      className={`round-node round-node--${status}${progress === 100 && status === "current" ? " round-node--claimable" : ""}${selected ? " round-node--selected" : ""}`}
      style={style}
      data-round={round}
      aria-label={`第${round}轮${status === "complete" ? "已完成" : status === "current" ? "进行中" : "未解锁"}`}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="round-node__progress" aria-hidden="true" />
      <span className="round-node__halo" />
      <span className="round-node__rim">
        <span className="round-node__face">
          <Glyph kind={stage.kind} />
        </span>
      </span>
      <span className="round-node__number" aria-hidden="true">
        {round}
      </span>
      {status === "complete" ? (
        <span className="round-node__check" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="m5 12 4 4 10-10" />
          </svg>
        </span>
      ) : null}
      {status === "locked" ? (
        <span className="round-node__lock" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M7 10V8a5 5 0 0 1 10 0v2M6 10h12v10H6Z" />
          </svg>
        </span>
      ) : null}
    </button>
  );
}

function TopPortal() {
  return (
    <div className="map-portal" aria-hidden="true">
      <span className="map-portal__wing map-portal__wing--left" />
      <span className="map-portal__wing map-portal__wing--right" />
      <span className="map-portal__core">
        <svg viewBox="0 0 64 64">
          <path d="m32 7 7 17 18 2-14 11 4 18-15-10-15 10 4-18L7 26l18-2Z" />
        </svg>
      </span>
      <span className="map-portal__spark map-portal__spark--one" />
      <span className="map-portal__spark map-portal__spark--two" />
      <span className="map-portal__spark map-portal__spark--three" />
    </div>
  );
}

function FinalChest() {
  return (
    <div className="final-chest" aria-hidden="true">
      <span className="final-chest__glow" />
      <svg viewBox="0 0 220 170">
        <path
          d="M40 73c0-35 25-58 70-58s70 23 70 58Z"
          fill="#f5a84e"
          stroke="#5c327d"
          strokeWidth="10"
        />
        <path d="M29 70h162v82H29Z" fill="#d87841" stroke="#5c327d" strokeWidth="10" />
        <path d="M29 95h162v24H29Z" fill="#ffcf5e" stroke="#5c327d" strokeWidth="8" />
        <path d="M92 93h36v43H92Z" fill="#76e0db" stroke="#5c327d" strokeWidth="8" />
        <circle cx="110" cy="108" r="7" fill="#fff5a6" />
        <path
          d="M57 28 45 7M92 17 87 0M163 31l18-17M133 17l4-17"
          stroke="#ffd969"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function RoundMap() {
  const {
    state,
    hydrated,
    primaryAction,
    actionProgress,
    activeRound,
    confirmDebt,
    startTask,
    submitProof,
    connectWallet,
    claimRound,
    recordShare,
    reset,
  } = useShoreExperience();
  const [selectedRound, setSelectedRound] = useState(activeRound);
  const [sheetMode, setSheetMode] = useState<SheetMode | null>(null);
  const activeRoundProgress = getRoundProgress(state, activeRound);
  const routeCompletion = Math.min(100, ((activeRound - 1 + activeRoundProgress / 100) / 17) * 100);
  const claimableShore = state.taskStatus === "verified" && !state.claimedRound4 ? 150_000 : 0;

  useEffect(() => {
    if (!hydrated) return;
    setSelectedRound(activeRound);
    const timer = window.setTimeout(() => {
      document.querySelector<HTMLElement>(`[data-round="${activeRound}"]`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 280);
    return () => window.clearTimeout(timer);
  }, [activeRound, hydrated]);

  function openPrimaryAction() {
    switch (primaryAction) {
      case "setup":
        setSheetMode("setup");
        break;
      case "start-task":
        setSheetMode("task");
        break;
      case "submit-proof":
        setSheetMode("proof");
        break;
      case "connect-wallet":
        setSheetMode("wallet");
        break;
      case "claim":
        setSheetMode("claim");
        break;
      case "wait":
        setSelectedRound(activeRound);
        setSheetMode("round");
        break;
    }
  }

  async function shareProgress() {
    const text = `我正在上岸：已完成 ${state.taskStatus === "verified" ? 1 : 0} 个有效任务，行动进度 ${actionProgress}%。`;
    if (navigator.share) {
      await navigator.share({ title: "我的上岸进度", text });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
    recordShare();
  }

  return (
    <main className="round-map" aria-label="十八轮解锁路线">
      <div className="round-map__ambient" aria-hidden="true">
        {Array.from({ length: 34 }, (_, index) => (
          <span key={index} style={{ "--spark-index": index } as CSSProperties} />
        ))}
      </div>

      <StatusOrbs
        progress={actionProgress}
        availableShore={state.availableShore}
        claimableShore={claimableShore}
        onProgress={() => setSheetMode("progress")}
        onAssets={() => setSheetMode("assets")}
      />

      <div className="round-map__canvas">
        <TopPortal />

        <svg
          className="round-map__route"
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          aria-hidden="true"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="routeGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#b7b6f3" />
              <stop offset="0.46" stopColor="#d5caf4" />
              <stop offset="1" stopColor="#a8b8ef" />
            </linearGradient>
            <linearGradient id="routeProgressGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7df0da" />
              <stop offset="0.55" stopColor="#ffe47b" />
              <stop offset="1" stopColor="#ff87b5" />
            </linearGradient>
            <filter id="routeShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="18"
                stdDeviation="16"
                floodColor="#151350"
                floodOpacity="0.45"
              />
            </filter>
          </defs>
          <path
            d={pathData}
            fill="none"
            stroke="#171852"
            strokeWidth="118"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.55"
            transform="translate(0 15)"
          />
          <path
            d={pathData}
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="106"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#routeShadow)"
          />
          <path
            d={pathData}
            fill="none"
            stroke="url(#routeProgressGradient)"
            strokeWidth="42"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength="100"
            strokeDasharray={`${routeCompletion} 100`}
            className="round-map__route-progress"
          />
          <path
            d={pathData}
            fill="none"
            stroke="#f1edff"
            strokeWidth="18"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.86"
          />
          <path
            d={pathData}
            fill="none"
            stroke="#ffe173"
            strokeWidth="10"
            strokeDasharray="1 54"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.95"
          />
        </svg>

        {decorationPoints.map((item, index) => (
          <div
            key={`${item.type}-${item.x}-${item.y}`}
            className={`map-decoration map-decoration--${item.type}`}
            style={{
              left: `${(item.x / VIEWBOX_WIDTH) * 100}%`,
              top: `${(item.y / VIEWBOX_HEIGHT) * 100}%`,
              transform: `translate(-50%, -50%) scale(${item.scale}) rotate(${item.rotate}deg)`,
              animationDelay: `${index * -0.27}s`,
            }}
            aria-hidden="true"
          >
            <DecorationGlyph type={item.type} />
          </div>
        ))}

        {stages.map((stage, index) => {
          const round = index + 1;
          const status: StageStatus =
            round < activeRound ? "complete" : round === activeRound ? "current" : "locked";
          return (
            <StageButton
              key={`${stage.x}-${stage.y}`}
              stage={stage}
              index={index}
              status={status}
              progress={getRoundProgress(state, round)}
              selected={selectedRound === round}
              onSelect={() => {
                setSelectedRound(round);
                setSheetMode("round");
              }}
            />
          );
        })}

        <FinalChest />
      </div>

      <PrimaryActionDock action={primaryAction} onAction={openPrimaryAction} />

      <ActionSheet
        mode={sheetMode}
        selectedRound={selectedRound}
        state={state}
        actionProgress={actionProgress}
        primaryAction={primaryAction}
        onClose={() => setSheetMode(null)}
        onMode={setSheetMode}
        onConfirmDebt={confirmDebt}
        onStartTask={startTask}
        onSubmitProof={submitProof}
        onConnectWallet={connectWallet}
        onClaim={claimRound}
        onShare={shareProgress}
        onReset={reset}
      />
    </main>
  );
}
