'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

import { navHref, navItems as defaultNavItems, type NavItem } from '@/lib/navigation'

export type NavProps = {
  items?: NavItem[]
}

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Fixed main menu. On the home page the links smooth-scroll to their section and the
 * item for the section currently in view is highlighted; from any other route they
 * link back to the home page anchor.
 */
export const Nav: React.FC<NavProps> = ({ items = defaultNavItems }) => {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (!isHome || typeof IntersectionObserver === 'undefined') return

    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((section): section is HTMLElement => section !== null)

    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (visible) setActiveId(visible.target.id)
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: [0, 0.25, 0.5, 1] },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [isHome, items])

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      if (!isHome) return

      const target = document.getElementById(id)
      if (!target) return

      event.preventDefault()
      target.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start',
      })
      setActiveId(id)
      window.history.replaceState(null, '', `#${id}`)
    },
    [isHome],
  )

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-950/80">
      <nav aria-label="Main" className="mx-auto max-w-5xl px-6">
        <ul className="flex h-16 items-center justify-center gap-1 sm:gap-2">
          {items.map((item) => {
            const isActive = isHome && activeId === item.id

            return (
              <li key={item.id}>
                <a
                  href={navHref(item.id, pathname)}
                  onClick={(event) => handleClick(event, item.id)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`relative block rounded-md px-3 py-2 text-sm font-medium transition-colors after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:origin-left after:scale-x-0 after:bg-sky-600 after:transition-transform after:duration-300 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none dark:after:bg-sky-400 dark:hover:text-white ${
                    isActive
                      ? 'text-slate-900 after:scale-x-100 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {item.label}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}

export default Nav
