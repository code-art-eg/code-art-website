import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { BioSection } from '@/components/BioSection'
import type { Bio } from '@/payload-types'
import { lexicalParagraphs } from '../helpers/lexical'

const aboutMe = lexicalParagraphs(
  'I build web applications with TypeScript and .NET.',
  'Outside of work I enjoy photography.',
) as unknown as Bio['aboutMe']

describe('<BioSection />', () => {
  it('renders the name as the page heading', () => {
    render(<BioSection title="Jane Doe" />)

    expect(screen.getByRole('heading', { level: 1, name: 'Jane Doe' })).toBeInTheDocument()
  })

  it('renders the subtitle and the short phrase', () => {
    render(
      <BioSection title="Jane Doe" subtitle="Software Engineer" shortPhrase="I ship things." />,
    )

    expect(screen.getByText('Software Engineer')).toBeInTheDocument()
    expect(screen.getByText('I ship things.')).toBeInTheDocument()
  })

  it('renders the about me rich text content', () => {
    render(<BioSection title="Jane Doe" aboutMe={aboutMe} />)

    expect(screen.getByRole('heading', { level: 2, name: 'About me' })).toBeInTheDocument()
    expect(
      screen.getByText('I build web applications with TypeScript and .NET.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Outside of work I enjoy photography.')).toBeInTheDocument()
  })

  it('omits optional blocks that have no content', () => {
    render(<BioSection title="Jane Doe" />)

    expect(screen.queryByRole('heading', { level: 2, name: 'About me' })).not.toBeInTheDocument()
    expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument()
  })

  it('exposes an #about anchor for the navigation menu', () => {
    const { container } = render(<BioSection title="Jane Doe" />)

    expect(container.querySelector('section#about')).not.toBeNull()
  })
})
