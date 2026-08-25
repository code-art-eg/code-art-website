import React from 'react'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Pagination } from '@/components/Pagination'
import { buildQueryUrl, pageWindow, parsePositiveInt } from '@/lib/pagination'

describe('parsePositiveInt', () => {
  it('parses a positive integer', () => {
    expect(parsePositiveInt('3', 1)).toBe(3)
  })

  it('falls back for missing, non-numeric, zero, negative and fractional values', () => {
    expect(parsePositiveInt(undefined, 1)).toBe(1)
    expect(parsePositiveInt('abc', 1)).toBe(1)
    expect(parsePositiveInt('0', 1)).toBe(1)
    expect(parsePositiveInt('-2', 1)).toBe(1)
    expect(parsePositiveInt('1.5', 1)).toBe(1)
  })

  it('uses the first entry when the param is repeated', () => {
    expect(parsePositiveInt(['2', '5'], 1)).toBe(2)
  })
})

describe('buildQueryUrl', () => {
  it('omits page=1 so the first page has a canonical url', () => {
    expect(buildQueryUrl('/projects', { page: 1 })).toBe('/projects')
  })

  it('keeps other params and drops empty ones', () => {
    expect(buildQueryUrl('/blog', { page: 2, year: '2026', empty: '' })).toBe(
      '/blog?page=2&year=2026',
    )
  })
})

describe('pageWindow', () => {
  it('returns nothing to paginate for zero or one page', () => {
    expect(pageWindow(1, 0)).toEqual([])
    expect(pageWindow(1, 1)).toEqual([1])
  })

  it('lists every page when they all fit', () => {
    expect(pageWindow(2, 4)).toEqual([1, 2, 3, 4])
  })

  it('collapses distant pages into ellipses', () => {
    expect(pageWindow(7, 12)).toEqual([1, null, 6, 7, 8, null, 12])
  })

  it('renders a single skipped page instead of an ellipsis', () => {
    // {1, 2, 4} leaves only page 3 out, which is shorter to show than "…".
    expect(pageWindow(1, 4, 1)).toEqual([1, 2, 3, 4])
  })

  it('still uses an ellipsis when more than one page is skipped', () => {
    expect(pageWindow(1, 5, 1)).toEqual([1, 2, null, 5])
  })
})

describe('<Pagination />', () => {
  it('renders nothing when there is a single page', () => {
    const { container } = render(<Pagination page={1} totalPages={1} basePath="/projects" />)

    expect(container).toBeEmptyDOMElement()
  })

  it('links to the previous and next pages', () => {
    render(<Pagination page={2} totalPages={3} basePath="/projects" />)

    expect(screen.getByRole('link', { name: 'Previous' })).toHaveAttribute('href', '/projects')
    expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute('href', '/projects?page=3')
  })

  it('disables Previous on the first page and Next on the last', () => {
    const { unmount } = render(<Pagination page={1} totalPages={3} basePath="/projects" />)
    expect(screen.getByRole('link', { name: 'Previous' })).toHaveAttribute('aria-disabled', 'true')
    unmount()

    render(<Pagination page={3} totalPages={3} basePath="/projects" />)
    expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute('aria-disabled', 'true')
  })

  it('marks the current page and links the others', () => {
    render(<Pagination page={2} totalPages={3} basePath="/projects" />)

    const pages = within(screen.getByRole('list')).getAllByRole('link')
    expect(pages.map((link) => link.textContent)).toEqual(['1', '2', '3'])
    expect(screen.getByRole('link', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Page 3' })).toHaveAttribute('href', '/projects?page=3')
  })

  it('preserves extra query params such as a year filter', () => {
    render(<Pagination page={1} totalPages={2} basePath="/blog" params={{ year: '2026' }} />)

    expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
      'href',
      '/blog?year=2026&page=2',
    )
    expect(screen.getByRole('link', { name: 'Page 1' })).toHaveAttribute('href', '/blog?year=2026')
  })
})
