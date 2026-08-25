import React from 'react'
import Link from 'next/link'

import type { Project } from '@/payload-types'

import { ProjectGrid } from './ProjectGrid'

export type FeaturedProjectsProps = {
  projects: Project[]
  /** Total number of projects, used to decide whether to link to the full list. */
  totalProjects: number
}

/**
 * Home page "Projects" section: the highlighted projects, plus a link to the full
 * list whenever there are more projects than the ones shown here.
 */
export const FeaturedProjects: React.FC<FeaturedProjectsProps> = ({ projects, totalProjects }) => {
  if (totalProjects === 0) return null

  const hasMore = totalProjects > projects.length

  return (
    <section
      id="projects"
      aria-labelledby="projects-heading"
      className="mx-auto max-w-5xl scroll-mt-24 px-6 py-16"
    >
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
        <h2
          id="projects-heading"
          className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white"
        >
          Projects
        </h2>

        {hasMore && (
          <Link
            href="/projects"
            className="text-sm font-medium text-sky-700 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none dark:text-sky-400"
          >
            View all projects →
          </Link>
        )}
      </div>

      <ProjectGrid projects={projects} emptyMessage="No projects have been highlighted yet." />
    </section>
  )
}

export default FeaturedProjects
