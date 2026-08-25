import type { CollectionConfig } from 'payload'

import { slugify } from '@/lib/slug'
import { validateSlug } from '@/lib/validation'

/**
 * Blog posts. `content` holds Markdown, rendered to HTML by the frontend.
 */
export const Blog: CollectionConfig = {
  slug: 'blog',
  labels: {
    singular: 'Blog Post',
    plural: 'Blog Posts',
  },
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'publishedAt', 'updatedAt'],
    description: 'Markdown posts listed on /blog.',
  },
  defaultSort: '-publishedAt',
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
        description: 'URL segment, e.g. /blog/my-post. Generated from the title if empty.',
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
      type: 'textarea',
      required: true,
      admin: {
        description: 'Short teaser shown in the blog list.',
      },
    },
    {
      name: 'content',
      type: 'code',
      required: true,
      admin: {
        language: 'markdown',
        description: 'Markdown. Rendered to HTML on the post page.',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      index: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'd MMM yyyy',
        },
      },
    },
  ],
  timestamps: true,
}
