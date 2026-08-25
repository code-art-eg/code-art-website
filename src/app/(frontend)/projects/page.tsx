import React from 'react'
import type { Metadata } from 'next'

import { Pagination } from '@/components/Pagination'
import { ProjectGrid } from '@/components/ProjectGrid'
import { getProjects, PROJECTS_PER_PAGE } from '@/lib/collections'
import { parsePositiveInt } from '@/lib/pagination'

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Portfolio projects, side projects and experiments.',
}

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ProjectsPage({ searchParams }: PageProps) {
  const query = await searchParams
  const page = parsePositiveInt(query.page, 1)
  const limit = parsePositiveInt(query.limit, PROJECTS_PER_PAGE)

  const { docs, totalPages, totalDocs } = await getProjects({ page, limit })

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          Projects
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {totalDocs === 1 ? '1 project' : `${totalDocs} projects`}
        </p>
      </header>

      <ProjectGrid projects={docs} />

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/projects"
        params={limit === PROJECTS_PER_PAGE ? undefined : { limit }}
        label="Projects pagination"
      />
    </div>
  )
}
