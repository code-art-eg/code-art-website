import React from 'react'
import Link from 'next/link'

import { buildQueryUrl } from '@/lib/pagination'

export type YearFilterProps = {
  years: number[]
  /** Currently selected year, or `null` for "All". */
  selected: number | null
  basePath?: string
}

const base =
  'inline-flex h-8 items-center rounded-full border px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:outline-none'
const idle =
  'border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
const active =
  'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'

/**
 * "All / 2026 / 2025 / …" filter links. Selecting a year always returns to page 1,
 * because the page count differs per year.
 */
export const YearFilter: React.FC<YearFilterProps> = ({ years, selected, basePath = '/blog' }) => {
  if (years.length === 0) return null

  return (
    <nav aria-label="Filter posts by year">
      <ul className="flex flex-wrap items-center gap-2">
        <li>
          <Link
            href={buildQueryUrl(basePath, {})}
            aria-current={selected === null ? 'true' : undefined}
            className={`${base} ${selected === null ? active : idle}`}
          >
            All
          </Link>
        </li>

        {years.map((year) => (
          <li key={year}>
            <Link
              href={buildQueryUrl(basePath, { year })}
              aria-current={selected === year ? 'true' : undefined}
              className={`${base} ${selected === year ? active : idle}`}
            >
              {year}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default YearFilter
