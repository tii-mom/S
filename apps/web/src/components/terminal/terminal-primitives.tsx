import type { ReactNode } from "react";

export function TerminalPanel({
  title,
  code,
  action,
  children,
  className = "",
}: {
  title: string;
  code?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`terminal-panel ${className}`}>
      <header className="terminal-panel__header">
        <div>
          {code ? <span className="terminal-panel__code">{code}</span> : null}
          <h2>{title}</h2>
        </div>
        {action ? <div className="terminal-panel__action">{action}</div> : null}
      </header>
      <div className="terminal-panel__body">{children}</div>
    </section>
  );
}

export function StatusDot({ tone = "green" }: { tone?: "green" | "gold" | "red" | "muted" }) {
  return <span className={`status-dot status-dot--${tone}`} aria-hidden="true" />;
}

export function StatusBadge({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "green" | "gold" | "red" | "blue" | "muted";
}) {
  return <span className={`status-badge status-badge--${tone}`}>{children}</span>;
}

export function MetricCell({
  label,
  value,
  delta,
  tone = "default",
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: "default" | "gold" | "green" | "red";
}) {
  return (
    <div className={`metric-cell metric-cell--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {delta ? <small>{delta}</small> : null}
    </div>
  );
}
