import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const common = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  strokeWidth: 1.8,
  viewBox: "0 0 24 24",
};

export function TerminalMark(props: IconProps) {
  return (
    <svg aria-hidden="true" {...common} {...props}>
      <path d="M5 5h14v14H5z" />
      <path d="m8 9 3 3-3 3M13 15h3" />
    </svg>
  );
}

export function WalletIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...common} {...props}>
      <path d="M4 6h14a2 2 0 0 1 2 2v11H4z" />
      <path d="M4 6V4h12v2M15 11h5v4h-5a2 2 0 0 1 0-4z" />
    </svg>
  );
}

export function DebtIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...common} {...props}>
      <path d="M5 4h14v16H5z" />
      <path d="M8 8h8M8 12h5M8 16h3" />
      <path d="m15 15 2 2 3-4" />
    </svg>
  );
}

export function ActionIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...common} {...props}>
      <path d="M12 2 4 14h7l-1 8 8-12h-7z" />
    </svg>
  );
}

export function ShoreIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...common} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 9.5c0-1.2 1.4-2 4-2s4 .8 4 2-1.4 2-4 2-4 .8-4 2 1.4 2 4 2 4-.8 4-2M12 5.5v13" />
    </svg>
  );
}

export function ProofIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...common} {...props}>
      <path d="M6 3h9l3 3v15H6z" />
      <path d="M15 3v4h4M9 12h6M9 16h4" />
      <path d="m8 8 1 1 2-2" />
    </svg>
  );
}

export function RoundIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...common} {...props}>
      <path d="M4 12a8 8 0 1 1 2.3 5.7L4 15.5M4 20v-4.5h4.5" />
      <path d="M12 8v4l3 2" />
    </svg>
  );
}

export function ActivityIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...common} {...props}>
      <path d="M3 12h4l2-6 4 12 2-6h6" />
    </svg>
  );
}

export function ChevronIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...common} {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...common} {...props}>
      <path d="m5 12 4 4 10-10" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...common} {...props}>
      <path d="M7 10V8a5 5 0 0 1 10 0v2M6 10h12v10H6z" />
    </svg>
  );
}

export function RadioIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...common} {...props}>
      <circle cx="12" cy="12" r="2" />
      <path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.5 5.5a9 9 0 0 0 0 13M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...common} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
