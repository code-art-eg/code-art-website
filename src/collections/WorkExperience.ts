import type { CollectionConfig } from 'payload'

const currentYear = new Date().getFullYear()

/** Years are plain integers; guard against typos like 202 or 20255. */
const yearValidator =
  (required: boolean) =>
  (value: number | null | undefined): string | true => {
    if (value === null || value === undefined) {
      return required ? 'Please enter a year.' : true
    }
    if (!Number.isInteger(value)) return 'Please enter a whole year, e.g. 2019.'
    if (value < 1950 || value > currentYear + 10) {
      return `Please enter a year between 1950 and ${currentYear + 10}.`
    }
    return true
  }

/**
 * Work history entries rendered as the "Experience" timeline on the home page.
 */
export const WorkExperience: CollectionConfig = {
  slug: 'work-experience',
  labels: {
    singular: 'Work Experience',
    plural: 'Work Experience',
  },
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'jobTitle',
    defaultColumns: ['jobTitle', 'company', 'startYear', 'endYear'],
    description: 'Roles shown in the experience timeline, newest first.',
  },
  defaultSort: '-startYear',
  fields: [
    {
      name: 'jobTitle',
      type: 'text',
      required: true,
    },
    {
      name: 'company',
      type: 'text',
      required: true,
    },
    {
      name: 'companyUrl',
      type: 'text',
      label: 'Company URL',
      admin: {
        description: 'Optional link to the company website.',
      },
      validate: (value: string | null | undefined): string | true => {
        if (!value) return true
        try {
          const { protocol } = new URL(value)
          if (protocol !== 'http:' && protocol !== 'https:') {
            return 'URL must start with http:// or https://'
          }
        } catch {
          return 'Please enter a valid absolute URL, e.g. https://example.com'
        }
        return true
      },
    },
    {
      name: 'location',
      type: 'text',
      admin: {
        description: 'Optional, e.g. "Berlin, Germany" or "Remote".',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startYear',
          type: 'number',
          required: true,
          admin: { width: '50%' },
          validate: yearValidator(true),
        },
        {
          name: 'endYear',
          type: 'number',
          admin: {
            width: '50%',
            description: 'Leave empty for a role you currently hold — it renders as "Present".',
          },
          validate: yearValidator(false),
        },
      ],
    },
    {
      name: 'jobDescription',
      type: 'richText',
      required: true,
    },
  ],
  timestamps: true,
}
