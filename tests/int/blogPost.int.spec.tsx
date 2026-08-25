import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { BlogPost } from '@/components/BlogPost'
import { Markdown } from '@/components/Markdown'
import { formatPostDate, postYear } from '@/lib/date'
import { makePost } from '../helpers/fixtures'

describe('formatPostDate', () => {
  it('formats an ISO date in UTC so server and client agree', () => {
    expect(formatPostDate('2026-03-05T00:00:00.000Z')).toBe('5 March 2026')
    expect(formatPostDate('2026-12-31T23:30:00.000Z')).toBe('31 December 2026')
  })

  it('returns an empty string for missing or unparseable dates', () => {
    expect(formatPostDate(null)).toBe('')
    expect(formatPostDate(undefined)).toBe('')
    expect(formatPostDate('not a date')).toBe('')
  })
})

describe('postYear', () => {
  it('reads the UTC calendar year', () => {
    expect(postYear('2026-03-05T00:00:00.000Z')).toBe(2026)
    expect(postYear('2025-01-01T00:00:00.000Z')).toBe(2025)
  })

  it('returns null when there is no usable date', () => {
    expect(postYear(null)).toBeNull()
    expect(postYear('nope')).toBeNull()
  })
})

describe('<Markdown />', () => {
  it('renders headings, emphasis and links', () => {
    render(<Markdown>{'## Sub heading\n\nSome **bold** text.'}</Markdown>)

    expect(screen.getByRole('heading', { level: 2, name: 'Sub heading' })).toBeInTheDocument()
    expect(screen.getByText('bold').tagName).toBe('STRONG')
  })

  it('renders lists and GitHub-flavoured tables', () => {
    render(<Markdown>{'- one\n- two\n\n| a | b |\n| - | - |\n| 1 | 2 |'}</Markdown>)

    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'a' })).toBeInTheDocument()
  })

  it('opens external links in a new tab but keeps internal links in place', () => {
    render(<Markdown>{'[out](https://example.com) and [in](/blog)'}</Markdown>)

    const external = screen.getByRole('link', { name: 'out' })
    expect(external).toHaveAttribute('target', '_blank')
    expect(external.getAttribute('rel')).toContain('noopener')

    expect(screen.getByRole('link', { name: 'in' })).not.toHaveAttribute('target')
  })

  it('escapes raw HTML instead of rendering it', () => {
    const { container } = render(<Markdown>{'<script>alert(1)</script>'}</Markdown>)

    expect(container.querySelector('script')).toBeNull()
    expect(container.textContent).toContain('<script>')
  })
})

describe('<BlogPost />', () => {
  it('renders the title, formatted date, summary and markdown body', () => {
    render(<BlogPost post={makePost()} />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Testing Payload collections' }),
    ).toBeInTheDocument()
    expect(screen.getByText('5 March 2026')).toBeInTheDocument()
    expect(screen.getByText('How I test Payload CMS collections with Vitest.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Heading' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'link' })).toHaveAttribute(
      'href',
      'https://example.com',
    )
  })

  it('exposes the publication date as a machine-readable <time>', () => {
    const { container } = render(<BlogPost post={makePost()} />)

    expect(container.querySelector('time')).toHaveAttribute('dateTime', '2026-03-05T00:00:00.000Z')
  })

  it('links back to the blog list', () => {
    render(<BlogPost post={makePost()} />)

    expect(screen.getByRole('link', { name: /back to blog/i })).toHaveAttribute('href', '/blog')
  })
})
