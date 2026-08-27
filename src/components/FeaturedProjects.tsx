import React from 'react'
import Link from 'next/link'

import type { Project } from '@/payload-types'

import { ProjectGrid } from './ProjectGrid'

export type FeaturedProjectsProps = {
  /** The curated projects, already in the order the editor arranged them. */
  projects: Project[]
  /** How many projects `/projects` lists, used to decide whether to link to it. */
  totalProjects: number
}

/**
 * Home page "Projects" section: the projects the Home Page Projects global curates, plus a
 * link to `/projects` whenever that page lists more than the ones shown here. Curating
 * nothing hides the section outright, rather than showing an empty heading.
 */
export const FeaturedProjects: React.FC<FeaturedProjectsProps> = ({ projects, totalProjects }) => {
  if (projects.length === 0) return null

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

      <ProjectGrid projects={projects} />
    </section>
  )
}

export default FeaturedProjects
