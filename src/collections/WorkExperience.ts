import type { CollectionConfig } from 'payload'

import { optionalUrl, yearValidator } from '@/lib/validation'

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
      validate: optionalUrl,
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
