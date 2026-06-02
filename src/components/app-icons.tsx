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

export function MailIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="4" y="6" width="16" height="12" rx="1.5" />
      <path d="m5.5 7.5 6.5 5 6.5-5" />
    </BaseIcon>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="5" y="11" width="14" height="9" rx="1.5" />
      <path d="M8 11V8.8A4 4 0 0 1 12 5a4 4 0 0 1 4 3.8V11" />
    </BaseIcon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m5 12 4.2 4.2L19 7" />
    </BaseIcon>
  );
}

export function GoogleIcon({ title = "Google", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : "presentation"}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M21.76 12.26c0-.82-.07-1.43-.22-2.07H12.2v3.81h5.48c-.11.95-.7 2.38-2.01 3.34l-.02.13 3.05 2.31.21.02c1.95-1.77 3.08-4.37 3.08-7.54Z"
        fill="#4285F4"
      />
      <path
        d="M12.2 22c2.69 0 4.95-.86 6.6-2.34l-3.24-2.46c-.87.6-2.03 1.03-3.36 1.03-2.64 0-4.88-1.72-5.68-4.11l-.12.01-3.17 2.4-.04.11A9.98 9.98 0 0 0 12.2 22Z"
        fill="#34A853"
      />
      <path
        d="M6.52 14.12A5.92 5.92 0 0 1 6.2 12c0-.74.13-1.46.31-2.12l-.01-.14-3.21-2.44-.1.05A9.72 9.72 0 0 0 2.1 12c0 1.75.42 3.4 1.09 4.65l3.33-2.53Z"
        fill="#FBBC05"
      />
      <path
        d="M12.2 5.77c1.67 0 2.8.71 3.44 1.3l2.52-2.4C17.14 3.75 14.89 2 12.2 2A9.98 9.98 0 0 0 3.2 7.35l3.32 2.53c.8-2.39 3.04-4.11 5.68-4.11Z"
        fill="#EA4335"
      />
    </svg>
  );
}
