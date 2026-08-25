import type { CollectionConfig } from 'payload'

import { slugify } from '@/lib/slug'
import { optionalUrl, validateSlug } from '@/lib/validation'

/**
 * Portfolio projects, listed on `/projects` and detailed at `/projects/[slug]`.
 */
export const Projects: CollectionConfig = {
  slug: 'projects',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'highlight', 'createdAt'],
    description: 'Portfolio projects shown on the projects pages and the home page.',
  },
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'URL segment, e.g. /projects/my-project. Generated from the title if empty.',
      },
      hooks: {
        beforeValidate: [
          ({ data, value }) => {
            const candidate = value || data?.title
            return typeof candidate === 'string' ? slugify(candidate) : value
          },
        ],
      },
      validate: validateSlug,
    },
    {
      name: 'summary',
      type: 'text',
      required: true,
      admin: {
        description: 'One or two sentences shown on project cards.',
      },
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
    },
    {
      name: 'externalLink',
      type: 'text',
      label: 'External Link',
      admin: {
        description: 'Optional link to the live project.',
      },
      validate: optionalUrl,
    },
    {
      name: 'githubLink',
      type: 'text',
      label: 'GitHub Link',
      admin: {
        description: 'Optional link to the source repository.',
      },
      validate: optionalUrl,
    },
    {
      name: 'skills',
      type: 'relationship',
      relationTo: 'skills',
      hasMany: true,
      required: true,
      admin: {
        description: 'Start typing to search; new skills can be created inline.',
        allowCreate: true,
        allowEdit: true,
        isSortable: true,
      },
    },
    {
      name: 'images',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
      admin: {
        description: 'Optional gallery. The first image is used as the card thumbnail.',
        allowCreate: true,
        isSortable: true,
      },
    },
    {
      name: 'highlight',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Highlighted projects are featured on the home page.',
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
