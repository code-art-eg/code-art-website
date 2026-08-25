import type { GlobalConfig } from 'payload'

/**
 * The author's biography, rendered as the hero + "About me" section of the home page.
 */
export const Bio: GlobalConfig = {
  slug: 'bio',
  access: {
    read: () => true,
  },
  admin: {
    description: 'Name, role and biography shown at the top of the home page.',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Name',
      admin: {
        description: "The author's name, shown as the main heading.",
      },
    },
    {
      name: 'subtitle',
      type: 'text',
      label: 'Subtitle',
      admin: {
        description: 'Example: Software Engineer',
      },
    },
    {
      name: 'shortPhrase',
      type: 'text',
      label: 'Short Phrase',
      admin: {
        description: 'A single-line tagline shown under the subtitle.',
      },
    },
    {
      name: 'aboutMe',
      type: 'richText',
      label: 'About Me',
      admin: {
        description: 'Longer biography, rendered as rich text.',
      },
    },
  ],
}
