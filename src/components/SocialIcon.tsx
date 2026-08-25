import React from 'react'

import type { Footer } from '@/payload-types'

type SocialLink = NonNullable<Footer['socialLinks']>[number]
export type SocialPlatform = SocialLink['platform']

export const platformLabels: Record<SocialPlatform, string> = {
  github: 'GitHub',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  twitter: 'Twitter',
  x: 'X',
}

/** Single-path brand glyphs, drawn on a 24×24 grid and filled with `currentColor`. */
const platformPaths: Record<SocialPlatform, string> = {
  github:
    'M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.26 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z',
  linkedin:
    'M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.64h.05A4.17 4.17 0 0 1 17.6 8.7c4 0 4.74 2.5 4.74 5.76V21h-4v-5.75c0-1.37-.03-3.13-1.96-3.13-1.96 0-2.26 1.49-2.26 3.03V21h-4V9Z',
  facebook:
    'M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.5-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12Z',
  twitter:
    'M23 4.94a9.2 9.2 0 0 1-2.6.72 4.53 4.53 0 0 0 1.99-2.5 9.06 9.06 0 0 1-2.88 1.1 4.52 4.52 0 0 0-7.7 4.12A12.83 12.83 0 0 1 2.5 3.6a4.52 4.52 0 0 0 1.4 6.04 4.5 4.5 0 0 1-2.05-.57v.06a4.52 4.52 0 0 0 3.63 4.43 4.55 4.55 0 0 1-2.04.08 4.52 4.52 0 0 0 4.22 3.14A9.07 9.07 0 0 1 1 18.65a12.8 12.8 0 0 0 6.92 2.03c8.3 0 12.85-6.88 12.85-12.85l-.01-.59A9.18 9.18 0 0 0 23 4.94Z',
  x: 'M17.53 3h3.1l-6.77 7.74L21.83 21h-6.24l-4.89-6.39L5.1 21H2l7.24-8.28L2.17 3h6.4l4.42 5.85L17.53 3Zm-1.09 16.13h1.72L7.64 4.78H5.8l10.64 14.35Z',
}

type SocialIconProps = {
  platform: SocialPlatform
  className?: string
}

/**
 * Brand glyph for a social platform. Decorative — the accessible name lives on the
 * surrounding link.
 */
export const SocialIcon: React.FC<SocialIconProps> = ({ platform, className }) => (
  <svg
    aria-hidden="true"
    focusable="false"
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d={platformPaths[platform]} />
  </svg>
)
