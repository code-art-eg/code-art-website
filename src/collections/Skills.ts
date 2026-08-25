import type { CollectionConfig } from 'payload'

/**
 * Technical skills, referenced by projects and rendered as badges.
 */
export const Skills: CollectionConfig = {
  slug: 'skills',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'updatedAt'],
    description: 'Technologies used across your projects, e.g. C#, .NET, TypeScript, React.',
  },
  defaultSort: 'title',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
  ],
  timestamps: true,
}
