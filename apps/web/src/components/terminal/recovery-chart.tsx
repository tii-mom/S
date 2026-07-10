"use client";

import { useMemo, useState } from "react";

import { formatCny, formatInteger, formatRound, formatUsd } from "@/lib/shore-terminal/formatters";
import type { ChartMode, RecoverySnapshot, RoundDefinition } from "@/lib/shore-terminal/types";

const WIDTH = 920;
const HEIGHT = 340;
const PADDING = { top: 28, right: 58, bottom: 40, left: 52 };

function toPath(values: number[], min: number, max: number) {
  const usableWidth = WIDTH - PADDING.left - PADDING.right;
  const usableHeight = HEIGHT - PADDING.top - PADDING.bottom;
  return values
    .map((value, index) => {
      const x = PADDING.left + (index / Math.max(1, values.length - 1)) * usableWidth;
      const y = PADDING.top + (1 - (value - min) / Math.max(1, max - min)) * usableHeight;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function areaPath(values: number[], min: number, max: number) {
  const line = toPath(values, min, max);
  const bottom = HEIGHT - PADDING.bottom;
  const lastX = WIDTH - PADDING.right;
  return `${line} L${lastX},${bottom} L${PADDING.left},${bottom} Z`;
}

function getNearestIndex(clientX: number, rect: DOMRect, length: number) {
  const localX = ((clientX - rect.left) / rect.width) * WIDTH;
  const ratio = (localX - PADDING.left) / (WIDTH - PADDING.left - PADDING.right);
  return Math.min(length - 1, Math.max(0, Math.round(ratio * (length - 1))));
}

export function RecoveryChart({
  mode,
  onModeChange,
  recoverySeries,
  rounds,
}: {
  mode: ChartMode;
  onModeChange: (mode: ChartMode) => void;
  recoverySeries: RecoverySnapshot[];
  rounds: RoundDefinition[];
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const recoveryModel = useMemo(() => {
    const covered = recoverySeries.map((point) => point.coveredValue);
    const actions = recoverySeries.map((point) => point.verifiedActionValue);
    const max = Math.max(...covered, ...actions) * 1.08;
    return {
      covered,
      actions,
      min: 0,
      max,
      coveredPath: toPath(covered, 0, max),
      coveredArea: areaPath(covered, 0, max),
      actionPath: toPath(actions, 0, max),
    };
  }, [recoverySeries]);

  const roundModel = useMemo(() => {
    const values = rounds.map((round) => round.targetPrice);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return {
      values,
      min,
      max,
      path: toPath(values, min, max),
      area: areaPath(values, min, max),
    };
  }, [rounds]);

  const points = mode === "recovery" ? recoverySeries.length : rounds.length;
  const activeIndex = hoverIndex ?? (mode === "recovery" ? recoverySeries.length - 1 : 3);
  const usableWidth = WIDTH - PADDING.left - PADDING.right;
  const activeX = PADDING.left + (activeIndex / Math.max(1, points - 1)) * usableWidth;

  const activeRecovery = recoverySeries[Math.min(activeIndex, recoverySeries.length - 1)]!;
  const activeRound = rounds[Math.min(activeIndex, rounds.length - 1)]!;

  return (
    <section className="terminal-chart" aria-label="上岸进度与十八轮图表">
      <header className="terminal-chart__header">
        <div>
          <span className="terminal-chart__code">CHART / ANALYTICS</span>
          <h2>{mode === "recovery" ? "上岸进度曲线" : "18轮SHORE解锁图"}</h2>
        </div>
        <div className="terminal-segmented" role="group" aria-label="图表模式">
          <button
            type="button"
            aria-pressed={mode === "recovery"}
            onClick={() => onModeChange("recovery")}
          >
            上岸进度
          </button>
          <button
            type="button"
            aria-pressed={mode === "rounds"}
            onClick={() => onModeChange("rounds")}
          >
            18轮解锁
          </button>
        </div>
      </header>

      <div className="terminal-chart__legend">
        {mode === "recovery" ? (
          <>
            <span>
              <i className="legend-line legend-line--gold" />
              累计覆盖价值
            </span>
            <span>
              <i className="legend-line legend-line--green" />
              有效行动价值
            </span>
          </>
        ) : (
          <>
            <span>
              <i className="legend-line legend-line--gold" />
              轮次目标价
            </span>
            <span>
              <i className="legend-marker" />
              当前轮次
            </span>
          </>
        )}
        <small>DEMO DATA · NOT FINANCIAL DATA</small>
      </div>

      <div className="terminal-chart__canvas">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={mode === "recovery" ? "上岸行动价值增长图" : "十八轮目标价格图"}
          onPointerMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            setHoverIndex(getNearestIndex(event.clientX, rect, points));
          }}
          onPointerLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="chartGoldArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#d4af37" stopOpacity="0.32" />
              <stop offset="1" stopColor="#d4af37" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="chartRoundArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#d4af37" stopOpacity="0.22" />
              <stop offset="1" stopColor="#d4af37" stopOpacity="0" />
            </linearGradient>
          </defs>

          {Array.from({ length: 6 }, (_, index) => {
            const y = PADDING.top + (index / 5) * (HEIGHT - PADDING.top - PADDING.bottom);
            return (
              <line
                key={`h-${index}`}
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={y}
                y2={y}
                className="chart-grid-line"
              />
            );
          })}
          {Array.from({ length: 9 }, (_, index) => {
            const x = PADDING.left + (index / 8) * (WIDTH - PADDING.left - PADDING.right);
            return (
              <line
                key={`v-${index}`}
                y1={PADDING.top}
                y2={HEIGHT - PADDING.bottom}
                x1={x}
                x2={x}
                className="chart-grid-line chart-grid-line--vertical"
              />
            );
          })}

          {mode === "recovery" ? (
            <>
              <path d={recoveryModel.coveredArea} fill="url(#chartGoldArea)" />
              <path d={recoveryModel.coveredPath} className="chart-line chart-line--gold" />
              <path d={recoveryModel.actionPath} className="chart-line chart-line--green" />
            </>
          ) : (
            <>
              <path d={roundModel.area} fill="url(#chartRoundArea)" />
              <path d={roundModel.path} className="chart-line chart-line--gold" />
              {rounds.map((round, index) => {
                const x = PADDING.left + (index / (rounds.length - 1)) * usableWidth;
                const y =
                  PADDING.top +
                  (1 - (round.targetPrice - roundModel.min) / (roundModel.max - roundModel.min)) *
                    (HEIGHT - PADDING.top - PADDING.bottom);
                return (
                  <g key={round.round}>
                    <circle
                      cx={x}
                      cy={y}
                      r={round.round === 4 ? 6 : 3.5}
                      className={
                        round.round === 4 ? "chart-point chart-point--active" : "chart-point"
                      }
                    />
                    {round.round === 4 ? (
                      <line
                        x1={x}
                        x2={x}
                        y1={PADDING.top}
                        y2={HEIGHT - PADDING.bottom}
                        className="chart-current-line"
                      />
                    ) : null}
                  </g>
                );
              })}
            </>
          )}

          <line
            x1={activeX}
            x2={activeX}
            y1={PADDING.top}
            y2={HEIGHT - PADDING.bottom}
            className="chart-crosshair"
          />

          {mode === "recovery"
            ? recoverySeries.map((point, index) => {
                if (index % 4 !== 0 && index !== recoverySeries.length - 1) return null;
                const x = PADDING.left + (index / (recoverySeries.length - 1)) * usableWidth;
                return (
                  <text
                    key={point.label}
                    x={x}
                    y={HEIGHT - 14}
                    textAnchor="middle"
                    className="chart-axis-label"
                  >
                    {point.label}
                  </text>
                );
              })
            : rounds.map((round, index) => {
                if (index % 2 !== 0 && index !== rounds.length - 1) return null;
                const x = PADDING.left + (index / (rounds.length - 1)) * usableWidth;
                return (
                  <text
                    key={round.round}
                    x={x}
                    y={HEIGHT - 14}
                    textAnchor="middle"
                    className="chart-axis-label"
                  >
                    {formatRound(round.round)}
                  </text>
                );
              })}
        </svg>

        <div className="terminal-chart__tooltip" style={{ left: `${(activeX / WIDTH) * 100}%` }}>
          {mode === "recovery" ? (
            <>
              <small>{activeRecovery.label}</small>
              <strong>{formatCny(activeRecovery.coveredValue)}</strong>
              <span>有效行动 {formatCny(activeRecovery.verifiedActionValue)}</span>
            </>
          ) : (
            <>
              <small>{formatRound(activeRound.round)}</small>
              <strong>{formatUsd(activeRound.targetPrice)}</strong>
              <span>{formatInteger(activeRound.releaseAmount)} SHORE</span>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
