import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { LatestPosts } from '@/components/LatestPosts'
import { navItems } from '@/lib/navigation'
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

describe('<LatestPosts />', () => {
  it('renders each post with a title link, date and summary', () => {
    render(<LatestPosts posts={posts} />)

    expect(screen.getByRole('heading', { level: 2, name: 'Blog' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Newest post' })).toHaveAttribute(
      'href',
      '/blog/newest-post',
    )
    expect(screen.getByText('1 May 2026')).toBeInTheDocument()
    expect(screen.getByText('The newest summary.')).toBeInTheDocument()
  })

  it('keeps the order it is given (newest first)', () => {
    render(<LatestPosts posts={posts} />)

    const titles = screen
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.textContent)
    expect(titles).toEqual(['Blog', 'Newest post', 'Older post'])
  })

  it('links to the full blog archive', () => {
    render(<LatestPosts posts={posts} />)

    expect(screen.getByRole('link', { name: /view all blog posts/i })).toHaveAttribute(
      'href',
      '/blog',
    )
  })

  it('exposes a #blog anchor for the navigation menu', () => {
    const { container } = render(<LatestPosts posts={posts} />)

    expect(container.querySelector('section#blog')).not.toBeNull()
  })

  it('renders nothing when there are no posts', () => {
    const { container } = render(<LatestPosts posts={[]} />)

    expect(container).toBeEmptyDOMElement()
  })
})

describe('main menu', () => {
  it('lists About, Experience, Projects and Blog in order', () => {
    expect(navItems.map((item) => item.id)).toEqual(['about', 'experience', 'projects', 'blog'])
  })
})
