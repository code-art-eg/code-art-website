import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { defaultCopyright, Footer } from '@/components/Footer'

const socialLinks = [
  { id: '1', platform: 'github' as const, url: 'https://github.com/someone' },
  { id: '2', platform: 'linkedin' as const, url: 'https://linkedin.com/in/someone' },
  { id: '3', platform: 'x' as const, url: 'https://x.com/someone' },
]

describe('<Footer />', () => {
  it('renders the copyright text from the footer global', () => {
    render(<Footer copyright="© 2026 Jane Doe. All rights reserved." />)

    expect(screen.getByText('© 2026 Jane Doe. All rights reserved.')).toBeInTheDocument()
  })

  it('renders every social link with an accessible name and safe rel attributes', () => {
    render(<Footer copyright="© 2026 Jane Doe." socialLinks={socialLinks} />)

    const github = screen.getByRole('link', { name: 'GitHub' })
    expect(github).toHaveAttribute('href', 'https://github.com/someone')
    expect(github).toHaveAttribute('target', '_blank')
    expect(github.getAttribute('rel')).toContain('noopener')

    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      'https://linkedin.com/in/someone',
    )
    expect(screen.getByRole('link', { name: 'X' })).toHaveAttribute('href', 'https://x.com/someone')
    expect(screen.getAllByRole('link')).toHaveLength(3)
  })

  it('falls back to a default copyright when the global is not seeded', () => {
    render(<Footer />)

    expect(screen.getByText(defaultCopyright())).toBeInTheDocument()
    expect(screen.queryAllByRole('link')).toHaveLength(0)
  })

  it('falls back when the copyright is blank or whitespace only', () => {
    render(<Footer copyright="   " />)

    expect(screen.getByText(defaultCopyright())).toBeInTheDocument()
  })

  it('skips social links that have no url', () => {
    render(
      <Footer
        socialLinks={[
          { id: '1', platform: 'github', url: 'https://github.com/someone' },
          { id: '2', platform: 'facebook', url: '' },
        ]}
      />,
    )

    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'GitHub' })).toBeInTheDocument()
  })
})
