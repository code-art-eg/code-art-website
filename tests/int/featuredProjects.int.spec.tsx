import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FeaturedProjects } from '@/components/FeaturedProjects'
import { navItems } from '@/lib/navigation'
import { makeProject } from '../helpers/fixtures'

const featured = [
  makeProject({ title: 'Alpha', slug: 'alpha' }),
  makeProject({ title: 'Beta', slug: 'beta' }),
]

describe('<FeaturedProjects />', () => {
  it('renders the curated projects with links to their detail pages', () => {
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

  it('renders the projects in the order given, without re-sorting them', () => {
    const curated = [
      makeProject({ title: 'Gamma', slug: 'gamma' }),
      makeProject({ title: 'Alpha', slug: 'alpha' }),
      makeProject({ title: 'Beta', slug: 'beta' }),
    ]

    render(<FeaturedProjects projects={curated} totalProjects={3} />)

    const titles = screen
      .getAllByRole('article')
      .map((card) => card.querySelector('h2')?.textContent)
    expect(titles).toEqual(['Gamma', 'Alpha', 'Beta'])
  })

  it('renders as many projects as it is given, with no cap', () => {
    const many = Array.from({ length: 9 }, (_, index) =>
      makeProject({ title: `Project ${index}`, slug: `project-${index}` }),
    )

    render(<FeaturedProjects projects={many} totalProjects={9} />)

    expect(screen.getAllByRole('article')).toHaveLength(9)
  })

  it('renders nothing when the curation is empty, even if the projects page lists some', () => {
    const { container } = render(<FeaturedProjects projects={[]} totalProjects={4} />)

    // An empty curation hides the section outright, link included.
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when there are no projects at all', () => {
    const { container } = render(<FeaturedProjects projects={[]} totalProjects={0} />)

    expect(container).toBeEmptyDOMElement()
  })
})

describe('main menu', () => {
  it('includes Projects, after About and Experience', () => {
    const ids = navItems.map((item) => item.id)

    expect(ids).toContain('projects')
    expect(ids.indexOf('projects')).toBeGreaterThan(ids.indexOf('experience'))
    expect(ids.indexOf('experience')).toBeGreaterThan(ids.indexOf('about'))
  })
})
