import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { ProjectDetail } from '@/components/ProjectDetail'
import { makeMedia, makeProject, makeSkill } from '../helpers/fixtures'

describe('<ProjectDetail />', () => {
  it('renders the title, summary and rich text description', () => {
    render(
      <ProjectDetail
        project={makeProject({ title: 'Weather App', summary: 'Forecasts at a glance.' })}
      />,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Weather App' })).toBeInTheDocument()
    expect(screen.getByText('Forecasts at a glance.')).toBeInTheDocument()
    expect(screen.getByText('It renders content from a headless CMS.')).toBeInTheDocument()
  })

  it('renders the external and GitHub links', () => {
    render(<ProjectDetail project={makeProject()} />)

    const external = screen.getByRole('link', { name: /visit project/i })
    expect(external).toHaveAttribute('href', 'https://example.com')
    expect(external).toHaveAttribute('target', '_blank')

    expect(screen.getByRole('link', { name: /view source/i })).toHaveAttribute(
      'href',
      'https://github.com/someone/portfolio',
    )
  })

  it('omits link buttons that are not set', () => {
    render(<ProjectDetail project={makeProject({ externalLink: null, githubLink: null })} />)

    expect(screen.queryByRole('link', { name: /visit project/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /view source/i })).not.toBeInTheDocument()
  })

  it('renders the associated skills as badges', () => {
    render(
      <ProjectDetail project={makeProject({ skills: [makeSkill('C#'), makeSkill('.NET')] })} />,
    )

    const badges = within(screen.getByRole('list', { name: 'Skills' })).getAllByRole('listitem')
    expect(badges.map((badge) => badge.textContent)).toEqual(['C#', '.NET'])
  })

  it('links back to the projects list', () => {
    render(<ProjectDetail project={makeProject()} />)

    expect(screen.getByRole('link', { name: /back to projects/i })).toHaveAttribute(
      'href',
      '/projects',
    )
  })

  describe('image carousel', () => {
    const images = [
      makeMedia({ alt: 'Home screen', url: '/api/media/file/one.png' }),
      makeMedia({ alt: 'Settings screen', url: '/api/media/file/two.png' }),
      makeMedia({ alt: 'Detail screen', url: '/api/media/file/three.png' }),
    ]

    it('is not rendered when the project has no images', () => {
      render(<ProjectDetail project={makeProject({ images: [] })} />)

      expect(screen.queryByRole('button', { name: 'Next image' })).not.toBeInTheDocument()
    })

    it('shows a single image without controls', () => {
      render(<ProjectDetail project={makeProject({ images: [images[0]] })} />)

      expect(screen.getByAltText('Home screen')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Next image' })).not.toBeInTheDocument()
    })

    it('fits each image inside the frame instead of cropping it', async () => {
      render(<ProjectDetail project={makeProject({ images })} />)

      expect(screen.getByAltText('Home screen')).toHaveClass('object-contain')

      await userEvent.click(screen.getByRole('button', { name: 'Next image' }))
      expect(screen.getByAltText('Settings screen')).toHaveClass('object-contain')
    })

    it('advances and rewinds through the images, wrapping around', async () => {
      render(<ProjectDetail project={makeProject({ images })} />)

      expect(screen.getByAltText('Home screen')).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: 'Next image' }))
      expect(screen.getByAltText('Settings screen')).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: 'Previous image' }))
      expect(screen.getByAltText('Home screen')).toBeInTheDocument()

      // Wraps backwards from the first image to the last.
      await userEvent.click(screen.getByRole('button', { name: 'Previous image' }))
      expect(screen.getByAltText('Detail screen')).toBeInTheDocument()

      // ...and forwards from the last back to the first.
      await userEvent.click(screen.getByRole('button', { name: 'Next image' }))
      expect(screen.getByAltText('Home screen')).toBeInTheDocument()
    })

    it('jumps straight to an image via the indicator dots and marks the current one', async () => {
      render(<ProjectDetail project={makeProject({ images })} />)

      await userEvent.click(screen.getByRole('button', { name: 'Go to image 3' }))

      expect(screen.getByAltText('Detail screen')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Go to image 3' })).toHaveAttribute(
        'aria-current',
        'true',
      )
      expect(screen.getByRole('button', { name: 'Go to image 1' })).not.toHaveAttribute(
        'aria-current',
      )
    })

    it('announces the current position for screen readers', async () => {
      render(<ProjectDetail project={makeProject({ images })} />)

      expect(screen.getByText('Image 1 of 3')).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: 'Next image' }))
      expect(screen.getByText('Image 2 of 3')).toBeInTheDocument()
    })
  })
})
