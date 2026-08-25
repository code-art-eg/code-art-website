import React from 'react'

import type { Project } from '@/payload-types'

import { ProjectCard } from './ProjectCard'

export type ProjectGridProps = {
  projects: Project[]
  emptyMessage?: string
}

/** Responsive card grid: one column on phones, two on tablets, three on desktops. */
export const ProjectGrid: React.FC<ProjectGridProps> = ({
  projects,
  emptyMessage = 'No projects have been published yet.',
}) => {
  if (projects.length === 0) {
    return <p className="text-slate-600 dark:text-slate-400">{emptyMessage}</p>
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}

export default ProjectGrid
