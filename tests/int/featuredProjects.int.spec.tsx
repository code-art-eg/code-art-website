import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FeaturedProjects } from '@/components/FeaturedProjects'
import { navItems } from '@/lib/navigation'
import { makeProject } from '../helpers/fixtures'

const featured = [
  makeProject({ title: 'Alpha', slug: 'alpha', highlight: true }),
  makeProject({ title: 'Beta', slug: 'beta', highlight: true }),
]

describe('<FeaturedProjects />', () => {
  it('renders the highlighted projects with links to their detail pages', () => {
    render(<FeaturedProjects projects={featured} totalProjects={2} />)

    expect(screen.getByRole('heading', { level: 2, name: 'Projects' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Alpha' })).toHaveAttribute('href', '/projects/alpha')
    expect(screen.getByRole('link', { name: 'Beta' })).toHaveAttribute('href', '/projects/beta')
  })

  it('exposes a #projects anchor for the navigation menu', () => {
    const { container } = render(<FeaturedProjects projects={featured} totalProjects={2} />)

    expect(container.querySelector('section#projects')).not.toBeNull()
  })

  it('offers "View all projects" when more projects exist than are shown', () => {
    render(<FeaturedProjects projects={featured} totalProjects={7} />)

    expect(screen.getByRole('link', { name: /view all projects/i })).toHaveAttribute(
      'href',
      '/projects',
    )
  })

  it('hides "View all projects" when everything is already on screen', () => {
    render(<FeaturedProjects projects={featured} totalProjects={2} />)

    expect(screen.queryByRole('link', { name: /view all projects/i })).not.toBeInTheDocument()
  })

  it('still links to the full list when nothing is highlighted but projects exist', () => {
    render(<FeaturedProjects projects={[]} totalProjects={4} />)

    expect(screen.getByText('No projects have been highlighted yet.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /view all projects/i })).toBeInTheDocument()
  })

  it('renders nothing when there are no projects at all', () => {
    const { container } = render(<FeaturedProjects projects={[]} totalProjects={0} />)

    expect(container).toBeEmptyDOMElement()
  })
})

describe('main menu', () => {
  it('includes Projects after About and Experience', () => {
    expect(navItems.map((item) => item.id)).toEqual(['about', 'experience', 'projects'])
  })
})
