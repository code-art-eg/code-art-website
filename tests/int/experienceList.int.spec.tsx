import React from 'react'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ExperienceList, formatYearRange } from '@/components/ExperienceList'
import { makeExperience, richText } from '../helpers/fixtures'

describe('formatYearRange', () => {
  it('renders an open-ended role as "Present"', () => {
    expect(formatYearRange(2021)).toBe('2021 — Present')
    expect(formatYearRange(2021, null)).toBe('2021 — Present')
  })

  it('renders a closed range', () => {
    expect(formatYearRange(2016, 2019)).toBe('2016 — 2019')
  })

  it('collapses a single-year role', () => {
    expect(formatYearRange(2019, 2019)).toBe('2019')
  })
})

describe('<ExperienceList />', () => {
  it('renders each role with its title, company, location, years and description', () => {
    render(
      <ExperienceList
        items={[
          makeExperience({
            jobTitle: 'Principal Engineer',
            company: 'Globex',
            location: 'Berlin, Germany',
            startYear: 2023,
            endYear: null,
            jobDescription: richText('Leading the platform team.'),
          }),
        ]}
      />,
    )

    expect(
      screen.getByRole('heading', { level: 3, name: 'Principal Engineer' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Globex')).toBeInTheDocument()
    expect(screen.getByText('Berlin, Germany')).toBeInTheDocument()
    expect(screen.getByText('2023 — Present')).toBeInTheDocument()
    expect(screen.getByText('Leading the platform team.')).toBeInTheDocument()
  })

  it('links the company name when a company url is set', () => {
    render(
      <ExperienceList items={[makeExperience({ companyUrl: 'https://globex.example.com' })]} />,
    )

    const link = screen.getByRole('link', { name: 'Acme Corp' })
    expect(link).toHaveAttribute('href', 'https://globex.example.com')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('renders the company as plain text when there is no url', () => {
    render(<ExperienceList items={[makeExperience({ companyUrl: null })]} />)

    expect(screen.queryByRole('link', { name: 'Acme Corp' })).not.toBeInTheDocument()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })

  it('omits the location when it is not set', () => {
    render(<ExperienceList items={[makeExperience({ location: null })]} />)

    expect(screen.queryByText('Remote')).not.toBeInTheDocument()
  })

  it('preserves the order it is given', () => {
    render(
      <ExperienceList
        items={[
          makeExperience({ jobTitle: 'Newest role', startYear: 2023 }),
          makeExperience({ jobTitle: 'Older role', startYear: 2018, endYear: 2020 }),
        ]}
      />,
    )

    const entries = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(entries).toHaveLength(2)
    expect(entries[0]).toHaveTextContent('Newest role')
    expect(entries[1]).toHaveTextContent('Older role')
  })

  it('exposes an #experience anchor for the navigation menu', () => {
    const { container } = render(<ExperienceList items={[makeExperience()]} />)

    expect(container.querySelector('section#experience')).not.toBeNull()
  })

  it('renders nothing when there are no roles', () => {
    const { container } = render(<ExperienceList items={[]} />)

    expect(container).toBeEmptyDOMElement()
  })
})
