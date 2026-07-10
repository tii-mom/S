import Link from "next/link";
import type { ReactNode } from "react";

import { ArrowIcon } from "@/components/icons";

type PageHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function PageHeading({ eyebrow, title, description, action }: PageHeadingProps) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow ? <p className="page-heading__eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="page-heading__action">{action}</div> : null}
    </div>
  );
}

type ScrollPanelProps = {
  children: ReactNode;
  className?: string;
  tone?: "jade" | "peach" | "gold" | "plain";
};

export function ScrollPanel({ children, className = "", tone = "plain" }: ScrollPanelProps) {
  return (
    <section className={`scroll-panel scroll-panel--${tone} ${className}`}>{children}</section>
  );
}

type PrimaryLinkProps = {
  href: string;
  children: ReactNode;
  icon?: boolean;
  className?: string;
};

export function PrimaryLink({ href, children, icon = true, className = "" }: PrimaryLinkProps) {
  return (
    <Link href={href} className={`fantasy-button fantasy-button--primary ${className}`}>
      <span>{children}</span>
      {icon ? <ArrowIcon className="fantasy-button__icon" /> : null}
    </Link>
  );
}

type SecondaryLinkProps = {
  href: string;
  children: ReactNode;
};

export function SecondaryLink({ href, children }: SecondaryLinkProps) {
  return (
    <Link href={href} className="fantasy-button fantasy-button--secondary">
      {children}
    </Link>
  );
}

type ProgressBarProps = {
  value: number;
  label: string;
  detail?: string;
};

export function ProgressBar({ value, label, detail }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="quest-progress">
      <div className="quest-progress__label">
        <span>{label}</span>
        <strong>{detail ?? `${clamped}%`}</strong>
      </div>
      <div className="quest-progress__track" aria-label={`${label} ${clamped}%`}>
        <span style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

type StatPillProps = {
  label: string;
  value: string;
  accent?: "jade" | "gold" | "peach";
};

export function StatPill({ label, value, accent = "jade" }: StatPillProps) {
  return (
    <div className={`stat-petal stat-petal--${accent}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
