import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const commonProps = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  strokeWidth: 2,
  viewBox: "0 0 24 24",
};

export function HomeIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...commonProps} {...props}>
      <path d="m3 11 9-8 9 8" />
      <path d="M5.5 9.5V21h13V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}

export function ScrollIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...commonProps} {...props}>
      <path d="M6 4h11a2 2 0 0 1 2 2v13H8a3 3 0 0 1-3-3V5a2 2 0 0 0-2 2v1h3" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  );
}

export function VaultIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...commonProps} {...props}>
      <path d="M4 8.5 12 4l8 4.5V20H4Z" />
      <path d="M8 20v-7h8v7" />
      <path d="M9 9h6" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...commonProps} {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 20c.7-4 3-6 6.5-6s5.8 2 6.5 6" />
    </svg>
  );
}

export function ArrowIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...commonProps} {...props}>
      <path d="M5 12h13M14 7l5 5-5 5" />
    </svg>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...commonProps} {...props}>
      <path d="m12 2 1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5Z" />
      <path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7Z" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...commonProps} {...props}>
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export function ShareIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...commonProps} {...props}>
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5" />
    </svg>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...commonProps} {...props}>
      <path d="M4 7h4l1.5-2h5L16 7h4v12H4Z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...commonProps} {...props}>
      <path d="m9 15 6-6" />
      <path d="M7.5 17.5h-1a4 4 0 0 1 0-8h3M16.5 6.5h1a4 4 0 0 1 0 8h-3" />
    </svg>
  );
}

export function CoinIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...commonProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9.5c0-1 1-1.8 3-1.8s3 .8 3 1.8-1 1.6-3 1.6-3 .8-3 1.8 1 1.8 3 1.8 3-.8 3-1.8M12 6v12" />
    </svg>
  );
}
