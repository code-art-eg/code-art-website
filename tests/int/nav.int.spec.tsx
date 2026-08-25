import React from 'react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Nav } from '@/components/Nav'
import { navHref } from '@/lib/navigation'

const mockPathname = vi.hoisted(() => ({ value: '/' }))

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname.value,
}))

type ObserverCallback = (entries: Partial<IntersectionObserverEntry>[]) => void

let observerCallback: ObserverCallback | undefined
let observed: Element[] = []
let disconnected = false

class FakeIntersectionObserver {
  constructor(callback: ObserverCallback) {
    observerCallback = callback
  }
  observe(element: Element) {
    observed.push(element)
  }
  disconnect() {
    disconnected = true
  }
  unobserve() {}
  takeRecords() {
    return []
  }
}

const renderSections = () => {
  const about = document.createElement('section')
  about.id = 'about'
  const experience = document.createElement('section')
  experience.id = 'experience'
  document.body.append(about, experience)
  return { about, experience }
}

beforeEach(() => {
  mockPathname.value = '/'
  observerCallback = undefined
  observed = []
  disconnected = false
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('navHref', () => {
  it('uses a bare hash on the home page and a root-relative link elsewhere', () => {
    expect(navHref('about', '/')).toBe('#about')
    expect(navHref('about', '/projects')).toBe('/#about')
  })
})

describe('<Nav />', () => {
  it('renders the About and Experience links inside a labelled nav', () => {
    render(<Nav />)

    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '#about')
    expect(screen.getByRole('link', { name: 'Experience' })).toHaveAttribute('href', '#experience')
  })

  it('links back to the home page anchors from another route', () => {
    mockPathname.value = '/projects'
    render(<Nav />)

    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/#about')
    expect(screen.getByRole('link', { name: 'Experience' })).toHaveAttribute('href', '/#experience')
  })

  it('smooth-scrolls to the target section when a menu item is clicked', async () => {
    const { experience } = renderSections()
    render(<Nav />)

    await userEvent.click(screen.getByRole('link', { name: 'Experience' }))

    expect(experience.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
    expect(window.location.hash).toBe('#experience')
  })

  it('jumps without animation when the visitor prefers reduced motion', async () => {
    const { about } = renderSections()
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    )
    render(<Nav />)

    await userEvent.click(screen.getByRole('link', { name: 'About' }))

    expect(about.scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' })
  })

  it('marks the section currently in view as the active menu item', () => {
    const { experience } = renderSections()
    render(<Nav />)

    expect(observed).toHaveLength(2)

    act(() => {
      observerCallback?.([{ isIntersecting: true, intersectionRatio: 0.9, target: experience }])
    })

    expect(screen.getByRole('link', { name: 'Experience' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('link', { name: 'About' })).not.toHaveAttribute('aria-current')
  })

  it('stops observing when unmounted', () => {
    renderSections()
    const { unmount } = render(<Nav />)

    unmount()

    expect(disconnected).toBe(true)
  })

  it('does not observe sections when rendered outside the home page', () => {
    mockPathname.value = '/blog'
    renderSections()
    render(<Nav />)

    expect(observed).toHaveLength(0)
  })
})
