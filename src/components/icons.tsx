import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>

const base = (props: P) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  width: 20,
  height: 20,
  'aria-hidden': true,
  ...props,
})

export const HomeIcon = (p: P) => (
  <svg {...base(p)}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></svg>
)
export const PlusIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
)
export const BookIcon = (p: P) => (
  <svg {...base(p)}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" /><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" /></svg>
)
export const ChevronLeftIcon = (p: P) => (
  <svg {...base(p)}><path d="m15 18-6-6 6-6" /></svg>
)
export const ChevronRightIcon = (p: P) => (
  <svg {...base(p)}><path d="m9 18 6-6-6-6" /></svg>
)
export const ArrowUpIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 19V5M5 12l7-7 7 7" /></svg>
)
export const ArrowDownIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
)
export const SwapIcon = (p: P) => (
  <svg {...base(p)}><path d="M16 3l4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16" /></svg>
)
export const TrashIcon = (p: P) => (
  <svg {...base(p)}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
)
export const MinusIcon = (p: P) => (
  <svg {...base(p)}><path d="M5 12h14" /></svg>
)
export const ShareIcon = (p: P) => (
  <svg {...base(p)}><path d="M4 12v8h16v-8M12 3v13M7 8l5-5 5 5" /></svg>
)
export const RefreshIcon = (p: P) => (
  <svg {...base(p)}><path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" /></svg>
)
export const CheckIcon = (p: P) => (
  <svg {...base(p)}><path d="M20 6 9 17l-5-5" /></svg>
)
export const XIcon = (p: P) => (
  <svg {...base(p)}><path d="M18 6 6 18M6 6l12 12" /></svg>
)
export const PlayIcon = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="10" /><path d="m10 8 6 4-6 4z" /></svg>
)

export const Logo = (p: P) => (
  <svg viewBox="0 0 32 32" width={28} height={28} aria-hidden {...p}>
    <rect width="32" height="32" rx="8" fill="#047857" />
    <ellipse cx="16" cy="16" rx="11" ry="7" transform="rotate(-35 16 16)" fill="#fff" />
    <path d="M11 21 21 11M13 15l2 2m1-5 2 2m-7 5 2 2" stroke="#047857" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)
