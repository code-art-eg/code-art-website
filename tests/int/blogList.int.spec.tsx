import React from 'react'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { BlogList } from '@/components/BlogList'
import { YearFilter } from '@/components/YearFilter'
import { yearRange } from '@/lib/collections'
import { parseYearParam } from '@/lib/pagination'
import { makePost } from '../helpers/fixtures'

const posts = [
  makePost({
    title: 'Newest post',
    slug: 'newest-post',
    summary: 'The newest summary.',
    publishedAt: '2026-05-01T00:00:00.000Z',
  }),
  makePost({
    title: 'Older post',
    slug: 'older-post',
    summary: 'The older summary.',
    publishedAt: '2025-07-01T00:00:00.000Z',
  }),
]

describe('yearRange', () => {
  it('spans the calendar year in UTC, exclusive of the next year', () => {
    expect(yearRange(2026)).toEqual({
      from: '2026-01-01T00:00:00.000Z',
      to: '2027-01-01T00:00:00.000Z',
    })
  })
})

describe('parseYearParam', () => {
  const years = [2026, 2025]

  it('returns null for "All" (no param)', () => {
    expect(parseYearParam(undefined, years)).toBeNull()
    expect(parseYearParam('', years)).toBeNull()
  })

  it('accepts a year that actually has posts', () => {
    expect(parseYearParam('2025', years)).toBe(2025)
  })

  it('ignores junk and years with no posts', () => {
    expect(parseYearParam('abc', years)).toBeNull()
    expect(parseYearParam('1999', years)).toBeNull()
    expect(parseYearParam('2025.5', years)).toBeNull()
  })

  it('uses the first entry when the param is repeated', () => {
    expect(parseYearParam(['2026', '2025'], years)).toBe(2026)
  })
})

describe('<BlogList />', () => {
  it('renders each post with a title link, formatted date and summary', () => {
    render(<BlogList posts={posts} />)

    const entries = screen.getAllByRole('listitem')
    expect(entries).toHaveLength(2)

    expect(screen.getByRole('link', { name: 'Newest post' })).toHaveAttribute(
      'href',
      '/blog/newest-post',
    )
    expect(within(entries[0]).getByText('1 May 2026')).toBeInTheDocument()
    expect(within(entries[0]).getByText('The newest summary.')).toBeInTheDocument()
    expect(within(entries[1]).getByText('1 July 2025')).toBeInTheDocument()
  })

  it('preserves the order it is given', () => {
    render(<BlogList posts={posts} />)

    const titles = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(titles).toEqual(['Newest post', 'Older post'])
  })

  it('shows the default empty state', () => {
    render(<BlogList posts={[]} />)

    expect(screen.getByText('No posts have been published yet.')).toBeInTheDocument()
  })

  it('shows a year-specific empty state when asked', () => {
    render(<BlogList posts={[]} emptyMessage="No posts were published in 2024." />)

    expect(screen.getByText('No posts were published in 2024.')).toBeInTheDocument()
  })
})

describe('<YearFilter />', () => {
  it('renders All plus one link per year', () => {
    render(<YearFilter years={[2026, 2025, 2024]} selected={null} />)

    const links = within(screen.getByRole('navigation', { name: /year/i })).getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual(['All', '2026', '2025', '2024'])
  })

  it('links each year with a ?year= query param and All without one', () => {
    render(<YearFilter years={[2026, 2025]} selected={null} />)

    expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute('href', '/blog')
    expect(screen.getByRole('link', { name: '2026' })).toHaveAttribute('href', '/blog?year=2026')
  })

  it('marks All as current when no year is selected', () => {
    render(<YearFilter years={[2026, 2025]} selected={null} />)

    expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('link', { name: '2026' })).not.toHaveAttribute('aria-current')
  })

  it('marks the selected year as current', () => {
    render(<YearFilter years={[2026, 2025]} selected={2025} />)

    expect(screen.getByRole('link', { name: '2025' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('link', { name: 'All' })).not.toHaveAttribute('aria-current')
  })

  it('renders nothing when there are no posts at all', () => {
    const { container } = render(<YearFilter years={[]} selected={null} />)

    expect(container).toBeEmptyDOMElement()
  })
})
