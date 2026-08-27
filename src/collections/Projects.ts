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
        description:
          'Type a skill and pick it from the list, or press Enter to add one that does not exist yet.',
        isSortable: true,
        components: {
          // A tag-style picker that creates missing skills inline, instead of the stock
          // relationship field's "+" button and document drawer.
          Field: '@/components/admin/SkillsTagInput#SkillsTagInput',
        },
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
        description:
          'Marks a project as a highlight. The home page list itself is curated in the Home Page Projects global.',
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
