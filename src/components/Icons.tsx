import type { SVGProps } from "react";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "width" | "height"> {
  size?: number;
}

function createIcon(paths: React.ReactNode) {
  return function PhosphorIcon({ size = 20, className, ...rest }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 256 256"
        fill="none"
        stroke="currentColor"
        strokeWidth={18}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        className={className}
        {...rest}
      >
        {paths}
      </svg>
    );
  };
}

export const IconArrowsLeftRight = createIcon(
  <>
    <polyline points="176 144 208 176 176 208" />
    <line x1="48" y1="176" x2="208" y2="176" />
    <polyline points="80 112 48 80 80 48" />
    <line x1="208" y1="80" x2="48" y2="80" />
  </>
);

export const IconScales = createIcon(
  <>
    <line x1="128" y1="40" x2="128" y2="216" />
    <line x1="104" y1="216" x2="152" y2="216" />
    <line x1="56" y1="88" x2="200" y2="56" />
    <path d="M24,168c0,17.67,14.33,24,32,24s32-6.33,32-24L56,88Z" />
    <path d="M168,136c0,17.67,14.33,24,32,24s32-6.33,32-24L200,56Z" />
  </>
);

export const IconDatabase = createIcon(
  <>
    <ellipse cx="128" cy="80" rx="88" ry="32" />
    <path d="M40,80v48c0,17.67,39.4,32,88,32s88-14.33,88-32V80" />
    <path d="M40,128v48c0,17.67,39.4,32,88,32s88-14.33,88-32v-48" />
  </>
);

export const IconGauge = createIcon(
  <>
    <path d="M24,184v-22.42a104,104,0,0,1,208,0V184a8,8,0,0,1-8,8H32A8,8,0,0,1,24,184Z" />
    <line x1="128" y1="56" x2="128" y2="88" />
    <line x1="40" y1="120" x2="68" y2="136" />
    <line x1="216" y1="120" x2="188" y2="136" />
    <line x1="104" y1="192" x2="170" y2="104" />
  </>
);

export const IconLockKey = createIcon(
  <>
    <circle cx="128" cy="140" r="20" />
    <line x1="128" y1="160" x2="128" y2="184" />
    <rect x="40" y="88" width="176" height="128" rx="12" />
    <path d="M88,88V56a40,40,0,0,1,80,0V88" />
  </>
);

export const IconShareNetwork = createIcon(
  <>
    <circle cx="64" cy="128" r="32" />
    <circle cx="176" cy="200" r="32" />
    <circle cx="176" cy="56" r="32" />
    <line x1="149.09" y1="73.3" x2="90.91" y2="110.7" />
    <line x1="90.91" y1="145.3" x2="149.09" y2="182.7" />
  </>
);

export const IconPulse = createIcon(
  <polyline points="24 128 56 128 96 40 160 208 200 128 232 128" />
);

export const IconLightning = createIcon(
  <polygon points="160 16 144 96 208 120 96 240 112 160 48 136 160 16" />
);

export const IconCopy = createIcon(
  <>
    <rect x="88" y="40" width="128" height="128" rx="8" />
    <path d="M168,168v40a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V96a8,8,0,0,1,8-8H88" />
  </>
);

export const IconCheck = createIcon(<polyline points="40 144 96 200 224 72" />);

export const IconX = createIcon(
  <>
    <line x1="200" y1="56" x2="56" y2="200" />
    <line x1="200" y1="200" x2="56" y2="56" />
  </>
);

export const IconPlay = createIcon(
  <path d="M72,39.88V216.12a8,8,0,0,0,12.15,6.69l144.08-88.12a7.82,7.82,0,0,0,0-13.38L84.15,33.19A8,8,0,0,0,72,39.88Z" />
);

export const IconPause = createIcon(
  <>
    <rect x="156" y="40" width="44" height="176" rx="8" />
    <rect x="56" y="40" width="44" height="176" rx="8" />
  </>
);

export const IconTerminal = createIcon(
  <>
    <polyline points="40 64 112 128 40 192" />
    <line x1="120" y1="192" x2="216" y2="192" />
  </>
);

export const IconArrowClockwise = createIcon(
  <>
    <polyline points="176 99.72 224 99.72 224 51.72" />
    <path d="M190.23,190.23a88,88,0,1,1,0-124.46L224,99.72" />
  </>
);

export const IconCompass = createIcon(
  <>
    <circle cx="128" cy="128" r="96" />
    <polygon points="176 80 112 112 80 176 144 144 176 80" />
  </>
);

export const IconFileText = createIcon(
  <>
    <path d="M200,224H56a8,8,0,0,1-8-8V40a8,8,0,0,1,8-8h96l56,56V216A8,8,0,0,1,200,224Z" />
    <polyline points="152 32 152 88 208 88" />
    <line x1="96" y1="136" x2="160" y2="136" />
    <line x1="96" y1="168" x2="160" y2="168" />
  </>
);

export const IconLayers = createIcon(
  <>
    <polyline points="32 176 128 232 224 176" />
    <polyline points="32 128 128 184 224 128" />
    <polygon points="32 80 128 136 224 80 128 24 32 80" />
  </>
);

export const IconGlobe = createIcon(
  <>
    <circle cx="128" cy="128" r="96" />
    <ellipse cx="128" cy="128" rx="40" ry="93.42" />
    <line x1="37.46" y1="96" x2="218.54" y2="96" />
    <line x1="37.46" y1="160" x2="218.54" y2="160" />
  </>
);
