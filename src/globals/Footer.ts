import type { GlobalConfig } from 'payload'

/**
 * Site-wide footer settings: the copyright line and the list of social profiles
 * rendered in the frontend footer.
 */
export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
  },
  admin: {
    description: 'Copyright line and social links shown at the bottom of every page.',
  },
  fields: [
    {
      name: 'copyright',
      type: 'text',
      label: 'Copyright',
      admin: {
        description: 'Example: © 2026 Your Name. All rights reserved.',
      },
    },
    {
      name: 'socialLinks',
      type: 'array',
      label: 'Social Links',
      labels: {
        singular: 'Social Link',
        plural: 'Social Links',
      },
      admin: {
        initCollapsed: false,
      },
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          defaultValue: 'github',
          options: [
            { label: 'GitHub', value: 'github' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'Facebook', value: 'facebook' },
            { label: 'Twitter', value: 'twitter' },
            { label: 'X', value: 'x' },
          ],
        },
        {
          name: 'url',
          type: 'text',
          required: true,
          label: 'URL',
          validate: (value: string | null | undefined) => {
            if (!value) return 'Please enter a URL.'
            try {
              const { protocol } = new URL(value)
              if (protocol !== 'http:' && protocol !== 'https:') {
                return 'URL must start with http:// or https://'
              }
            } catch {
              return 'Please enter a valid absolute URL, e.g. https://github.com/your-handle'
            }
            return true
          },
        },
      ],
    },
  ],
}
