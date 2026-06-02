import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

function BaseIcon({ title, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : "presentation"}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function SoccerBallIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m12 7 2.7 1.8-1 3.1h-3.4l-1-3.1L12 7Z" />
      <path d="m8.3 8.8-2.7 1.6.9 3" />
      <path d="m15.7 8.8 2.7 1.6-.9 3" />
      <path d="m7.2 15.4 2.5-1.8h4.6l2.5 1.8" />
      <path d="m9 18.4 1-3h4l1 3" />
    </BaseIcon>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6.5 9.5V20h11V9.5" />
    </BaseIcon>
  );
}

export function MatchIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m6 19 4-7" />
      <path d="m14 19 4-7" />
      <path d="M9 5 5 12h5l5-7" />
      <path d="M19 5 9 19" />
    </BaseIcon>
  );
}

export function RankingIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 20V9" />
      <path d="M12 20V5" />
      <path d="M19 20v-8" />
    </BaseIcon>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19c1.7-3 4-4.5 6.5-4.5S16.8 16 18.5 19" />
    </BaseIcon>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M15 5 8 12l7 7" />
      <path d="M9 12h10" />
    </BaseIcon>
  );
}

export function TrophyIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M8 5h8v3a4 4 0 0 1-8 0V5Z" />
      <path d="M8 6H5a2 2 0 0 0 2 3h1" />
      <path d="M16 6h3a2 2 0 0 1-2 3h-1" />
      <path d="M12 12v4" />
      <path d="M9 20h6" />
      <path d="M8.5 16h7" />
    </BaseIcon>
  );
}
