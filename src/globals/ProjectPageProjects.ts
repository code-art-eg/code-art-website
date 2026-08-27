import type { GlobalConfig } from 'payload'

/**
 * The projects listed on `/projects`, in the order they are listed here. Only these are
 * paginated into the grid, so an empty list leaves the page with nothing to show.
 */
export const ProjectPageProjects: GlobalConfig = {
  slug: 'project-page-projects',
  label: 'Project Page Projects',
  access: {
    read: () => true,
  },
  admin: {
    description:
      'Projects listed on the /projects page. Only these are shown, in this order; leave it empty to list nothing.',
  },
  fields: [
    {
      name: 'projects',
      type: 'relationship',
      relationTo: 'projects',
      hasMany: true,
      label: 'Projects',
      admin: {
        description: 'Pick the projects to list, then drag them into the order you want.',
        isSortable: true,
        allowCreate: false,
      },
    },
  ],
}
