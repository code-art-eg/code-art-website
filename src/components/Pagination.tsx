import React from 'react'
import Link from 'next/link'

import { buildQueryUrl, pageWindow } from '@/lib/pagination'

export type PaginationProps = {
  page: number
  totalPages: number
  /** Route the links point at, e.g. `/projects`. */
  basePath: string
  /** Extra query params to preserve across pages, e.g. `{ year: '2026' }`. */
  params?: Record<string, string | number | undefined | null>
  label?: string
}

const linkClass =
  'inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:outline-none'
const idle =
  'border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
const active =
  'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
const disabled =
  'pointer-events-none border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-600'

/**
 * Previous / page numbers / Next, rendered as plain links so pagination works
 * without JavaScript and each page keeps a shareable URL.
 */
export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  basePath,
  params,
  label = 'Pagination',
}) => {
  if (totalPages <= 1) return null

  const href = (target: number) => buildQueryUrl(basePath, { ...params, page: target })
  const hasPrevious = page > 1
  const hasNext = page < totalPages

  return (
    <nav aria-label={label} className="mt-12 flex items-center justify-center gap-2">
      <Link
        href={hasPrevious ? href(page - 1) : '#'}
        aria-disabled={!hasPrevious || undefined}
        tabIndex={hasPrevious ? undefined : -1}
        className={`${linkClass} ${hasPrevious ? idle : disabled}`}
      >
        Previous
      </Link>

      <ul className="flex items-center gap-1">
        {pageWindow(page, totalPages).map((target, index) =>
          target === null ? (
            <li
              key={`gap-${index}`}
              aria-hidden="true"
              className="px-1 text-sm text-slate-400 dark:text-slate-600"
            >
              …
            </li>
          ) : (
            <li key={target}>
              <Link
                href={href(target)}
                aria-label={`Page ${target}`}
                aria-current={target === page ? 'page' : undefined}
                className={`${linkClass} ${target === page ? active : idle}`}
              >
                {target}
              </Link>
            </li>
          ),
        )}
      </ul>

      <Link
        href={hasNext ? href(page + 1) : '#'}
        aria-disabled={!hasNext || undefined}
        tabIndex={hasNext ? undefined : -1}
        className={`${linkClass} ${hasNext ? idle : disabled}`}
      >
        Next
      </Link>
    </nav>
  )
}

export default Pagination
