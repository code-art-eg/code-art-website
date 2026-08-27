import type { GlobalConfig } from 'payload'

/**
 * The projects shown in the home page "Projects" section, in the order they are listed here.
 * The list is the whole story: nothing else is shown, and an empty list hides the section.
 */
export const HomePageProjects: GlobalConfig = {
  slug: 'home-page-projects',
  label: 'Home Page Projects',
  access: {
    read: () => true,
  },
  admin: {
    description:
      'Projects featured in the home page "Projects" section. Only these are shown, in this order; leave it empty to hide the section.',
  },
  fields: [
    {
      name: 'projects',
      type: 'relationship',
      relationTo: 'projects',
      hasMany: true,
      label: 'Projects',
      admin: {
        description: 'Pick the projects to feature, then drag them into the order you want.',
        isSortable: true,
        allowCreate: false,
      },
    },
  ],
}
