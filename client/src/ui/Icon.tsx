import type { ReactElement, SVGProps } from "react";

export type IconName =
  | "shield"
  | "plus"
  | "eye"
  | "eyeOff"
  | "copy"
  | "check"
  | "pen"
  | "trash";

const paths: Record<IconName, ReactElement> = {
  shield: (
    <>
      <path d="M12 2l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V5z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a3 3 0 0 0 4.2 4.2" />
      <path d="M9.9 4.6A9.4 9.4 0 0 1 12 4.5c6.5 0 10 7 10 7a13.7 13.7 0 0 1-2.4 3.2M6.1 6.1A13.6 13.6 0 0 0 2 11.5s3.5 7 10 7a9.3 9.3 0 0 0 3.9-.8" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </>
  ),
  check: <path d="M20 6L9 17l-5-5" />,
  pen: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </>
  ),
  trash: <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />,
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
