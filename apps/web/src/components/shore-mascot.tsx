import { useId } from "react";

type ShoreMascotProps = {
  mood?: "wave" | "cheer" | "sleep";
  compact?: boolean;
};

export function ShoreMascot({ mood = "wave", compact = false }: ShoreMascotProps) {
  const instanceId = useId().replaceAll(":", "");
  const bodyGradientId = `shore-body-${instanceId}`;
  const leafGradientId = `shore-leaf-${instanceId}`;
  const ringGradientId = `shore-ring-${instanceId}`;
  const shadowFilterId = `shore-shadow-${instanceId}`;

  return (
    <div
      className={compact ? "shore-mascot shore-mascot--compact" : "shore-mascot"}
      aria-label="上岸精灵岸宝"
      role="img"
    >
      <svg viewBox="0 0 220 220" aria-hidden="true">
        <defs>
          <linearGradient
            id={bodyGradientId}
            x1="56"
            y1="38"
            x2="157"
            y2="179"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#fffce8" />
            <stop offset="0.55" stopColor="#d8f4d5" />
            <stop offset="1" stopColor="#8fd0a5" />
          </linearGradient>
          <linearGradient
            id={leafGradientId}
            x1="88"
            y1="18"
            x2="144"
            y2="84"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#8ed99d" />
            <stop offset="1" stopColor="#3d9e74" />
          </linearGradient>
          <linearGradient
            id={ringGradientId}
            x1="64"
            y1="118"
            x2="167"
            y2="193"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#ffd96c" />
            <stop offset="1" stopColor="#e79a3c" />
          </linearGradient>
          <filter id={shadowFilterId} x="-30%" y="-30%" width="160%" height="180%">
            <feDropShadow dx="0" dy="9" stdDeviation="7" floodColor="#4b7d68" floodOpacity="0.2" />
          </filter>
        </defs>

        <ellipse cx="111" cy="194" rx="61" ry="13" fill="#6ea98d" opacity="0.18" />
        <g filter={`url(#${shadowFilterId})`}>
          <path
            d="M53 126c0-47 24-79 60-79s61 31 61 79c0 38-23 65-61 65-37 0-60-27-60-65Z"
            fill={`url(#${bodyGradientId})`}
            stroke="#4b9b79"
            strokeWidth="5"
          />
          <path
            d="M105 53c-3-23 9-37 28-39 4 23-6 40-28 39Z"
            fill={`url(#${leafGradientId})`}
            stroke="#3b8b69"
            strokeWidth="4"
          />
          <path
            d="M107 54c8-13 17-24 27-33"
            fill="none"
            stroke="#2f7a5b"
            strokeLinecap="round"
            strokeWidth="3"
          />
          <path
            d="M91 57c-6-14-19-21-34-19 1 17 11 27 29 29"
            fill="#a8e5ad"
            stroke="#4b9b79"
            strokeWidth="4"
          />
          <path
            d="M135 59c9-11 22-15 35-10-3 16-14 24-30 23"
            fill="#a8e5ad"
            stroke="#4b9b79"
            strokeWidth="4"
          />

          <path
            d="M72 149c9-13 24-20 42-20 19 0 35 7 45 20l-9 35H81Z"
            fill={`url(#${ringGradientId})`}
            stroke="#c47b2e"
            strokeWidth="5"
          />
          <ellipse
            cx="115"
            cy="151"
            rx="30"
            ry="14"
            fill="#fff2b7"
            stroke="#c47b2e"
            strokeWidth="4"
          />
          <path
            d="M95 153c6 4 12 6 20 6 7 0 13-2 19-6"
            fill="none"
            stroke="#dcaa4b"
            strokeWidth="3"
          />

          {mood === "sleep" ? (
            <>
              <path
                d="M82 105c6 5 12 5 18 0"
                fill="none"
                stroke="#315f54"
                strokeLinecap="round"
                strokeWidth="4"
              />
              <path
                d="M128 105c6 5 12 5 18 0"
                fill="none"
                stroke="#315f54"
                strokeLinecap="round"
                strokeWidth="4"
              />
            </>
          ) : (
            <>
              <ellipse cx="92" cy="104" rx="7" ry="9" fill="#315f54" />
              <ellipse cx="139" cy="104" rx="7" ry="9" fill="#315f54" />
              <circle cx="94" cy="101" r="2" fill="white" />
              <circle cx="141" cy="101" r="2" fill="white" />
            </>
          )}
          <path
            d={mood === "cheer" ? "M103 120c8 8 17 8 25 0" : "M107 119c5 4 11 4 16 0"}
            fill="none"
            stroke="#315f54"
            strokeLinecap="round"
            strokeWidth="4"
          />
          <ellipse cx="78" cy="119" rx="10" ry="5" fill="#f5a8a7" opacity="0.58" />
          <ellipse cx="151" cy="119" rx="10" ry="5" fill="#f5a8a7" opacity="0.58" />

          <path
            d={
              mood === "wave"
                ? "M58 122c-17-8-29-3-33 11 14 1 24 7 31 18"
                : "M59 124c-15 1-24 8-26 22"
            }
            fill="none"
            stroke="#4b9b79"
            strokeLinecap="round"
            strokeWidth="9"
          />
          <path
            d={
              mood === "cheer"
                ? "M170 121c17-11 29-7 34 6-13 2-23 8-30 18"
                : "M170 126c14 1 23 8 25 21"
            }
            fill="none"
            stroke="#4b9b79"
            strokeLinecap="round"
            strokeWidth="9"
          />
        </g>
      </svg>
    </div>
  );
}
