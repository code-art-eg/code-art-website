import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { ZoomableImage } from '@/components/ZoomableImage'

const renderImage = () =>
  render(
    <div className="relative">
      <ZoomableImage src="/api/media/file/shot.png" alt="Home screen" sizes="100vw" />
    </div>,
  )

/** Renders the image and clicks it open, returning the overlay. */
const openZoom = async () => {
  renderImage()

  await userEvent.click(screen.getByRole('button', { name: 'Enlarge image: Home screen' }))
  return screen.getByRole('dialog')
}

describe('<ZoomableImage />', () => {
  it('renders the image with a control that enlarges it', () => {
    renderImage()

    expect(screen.getByAltText('Home screen')).toHaveClass('object-contain')
    expect(screen.getByRole('button', { name: 'Enlarge image: Home screen' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens a labelled modal holding the image and a close button', async () => {
    const dialog = await openZoom()

    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleName('Home screen')
    expect(within(dialog).getByAltText('Home screen')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Close image' })).toHaveFocus()
  })

  it('closes on the close button', async () => {
    await openZoom()

    await userEvent.click(screen.getByRole('button', { name: 'Close image' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enlarge image: Home screen' })).toHaveFocus()
  })

  it('closes on Escape', async () => {
    await openZoom()

    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes when the backdrop is clicked', async () => {
    const dialog = await openZoom()

    await userEvent.click(dialog)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('keeps focus on the close button while open', async () => {
    await openZoom()

    await userEvent.tab()

    expect(screen.getByRole('button', { name: 'Close image' })).toHaveFocus()
  })

  it('locks and restores page scrolling around the overlay', async () => {
    expect(document.body.style.overflow).toBe('')

    await openZoom()
    expect(document.body.style.overflow).toBe('hidden')

    await userEvent.keyboard('{Escape}')
    expect(document.body.style.overflow).toBe('')
  })
})
