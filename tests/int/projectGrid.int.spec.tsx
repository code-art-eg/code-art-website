import React from 'react'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ProjectGrid } from '@/components/ProjectGrid'
import { makeMedia, makeProject, makeSkill } from '../helpers/fixtures'

describe('<ProjectGrid />', () => {
  it('renders a card per project with title link, summary and skills', () => {
    render(
      <ProjectGrid
        projects={[
          makeProject({
            title: 'Weather App',
            slug: 'weather-app',
            summary: 'Forecasts at a glance.',
            skills: [makeSkill('React')],
          }),
          makeProject({ title: 'CLI Tool', slug: 'cli-tool', summary: 'A handy CLI.' }),
        ]}
      />,
    )

    const cards = screen.getAllByRole('article')
    expect(cards).toHaveLength(2)

    expect(screen.getByRole('link', { name: 'Weather App' })).toHaveAttribute(
      'href',
      '/projects/weather-app',
    )
    expect(screen.getByText('Forecasts at a glance.')).toBeInTheDocument()
    expect(within(cards[0]).getByText('React')).toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'CLI Tool' })).toHaveAttribute(
      'href',
      '/projects/cli-tool',
    )
  })

  it('renders the first image as the thumbnail', () => {
    render(
      <ProjectGrid
        projects={[
          makeProject({
            images: [
              makeMedia({ alt: 'Cover shot', url: '/api/media/file/cover.png' }),
              makeMedia({ alt: 'Second shot', url: '/api/media/file/second.png' }),
            ],
          }),
        ]}
      />,
    )

    expect(screen.getByAltText('Cover shot')).toBeInTheDocument()
    expect(screen.queryByAltText('Second shot')).not.toBeInTheDocument()
  })

  it('fits the thumbnail inside its frame instead of cropping it', () => {
    render(<ProjectGrid projects={[makeProject({ images: [makeMedia({ alt: 'Cover shot' })] })]} />)

    expect(screen.getByAltText('Cover shot')).toHaveClass('object-contain')
  })

  it('falls back to a placeholder when the project has no images', () => {
    render(<ProjectGrid projects={[makeProject({ title: 'Weather App', images: [] })]} />)

    expect(screen.getByRole('img', { name: 'Weather App (no image)' })).toBeInTheDocument()
  })

  it('renders the external and GitHub links when present', () => {
    render(
      <ProjectGrid
        projects={[
          makeProject({
            title: 'Weather App',
            externalLink: 'https://weather.example.com',
            githubLink: 'https://github.com/someone/weather',
          }),
        ]}
      />,
    )

    expect(screen.getByRole('link', { name: 'Visit Weather App' })).toHaveAttribute(
      'href',
      'https://weather.example.com',
    )
    expect(screen.getByRole('link', { name: 'Weather App on GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/someone/weather',
    )
  })

  it('omits links that are not set', () => {
    render(
      <ProjectGrid
        projects={[makeProject({ title: 'Weather App', externalLink: null, githubLink: null })]}
      />,
    )

    expect(screen.queryByRole('link', { name: 'Visit Weather App' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Weather App on GitHub' })).not.toBeInTheDocument()
  })

  it('shows an empty state when there is nothing to list', () => {
    render(<ProjectGrid projects={[]} />)

    expect(screen.getByText('No projects have been published yet.')).toBeInTheDocument()
  })
})
