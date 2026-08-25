import React from 'react'

import type { Footer as FooterData } from '@/payload-types'

import { platformLabels, SocialIcon } from './SocialIcon'

export type FooterProps = {
  copyright?: FooterData['copyright']
  socialLinks?: FooterData['socialLinks']
}

/** Shown when the footer global has not been filled in yet. */
export const defaultCopyright = (year: number = new Date().getFullYear()): string =>
  `© ${year} All rights reserved.`

/**
 * Site footer: social profile links plus a copyright line.
 * Purely presentational — data is fetched by the layout and passed in.
 */
export const Footer: React.FC<FooterProps> = ({ copyright, socialLinks }) => {
  const links = (socialLinks ?? []).filter((link) => Boolean(link?.url))
  const copy = copyright?.trim() ? copyright : defaultCopyright()

  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 py-10 sm:flex-row sm:justify-between">
        <p className="order-2 text-center text-sm text-slate-600 sm:order-1 sm:text-left dark:text-slate-400">
          {copy}
        </p>

        {links.length > 0 && (
          <ul className="order-1 flex items-center gap-2 sm:order-2" aria-label="Social links">
            {links.map((link, index) => {
              const label = platformLabels[link.platform] ?? link.platform

              return (
                <li key={link.id ?? `${link.platform}-${index}`}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer me"
                    aria-label={label}
                    title={label}
                    className="flex size-10 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:outline-none dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:ring-offset-slate-900"
                  >
                    <SocialIcon platform={link.platform} className="size-5" />
                  </a>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </footer>
  )
}

export default Footer
