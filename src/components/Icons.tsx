import React from 'react'

type IconProps = { className?: string }

const base = {
  'aria-hidden': 'true' as const,
  focusable: 'false' as const,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  xmlns: 'http://www.w3.org/2000/svg',
}

/** Arrow leaving a box — marks a link that opens the live project. */
export const ExternalLinkIcon: React.FC<IconProps> = ({ className }) => (
  <svg {...base} className={className}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
  </svg>
)

export const ChevronLeftIcon: React.FC<IconProps> = ({ className }) => (
  <svg {...base} className={className}>
    <path d="m15 18-6-6 6-6" />
  </svg>
)

export const ChevronRightIcon: React.FC<IconProps> = ({ className }) => (
  <svg {...base} className={className}>
    <path d="m9 18 6-6-6-6" />
  </svg>
)
