import type { PaginatedDocs } from 'payload'

import type { Project, WorkExperience } from '@/payload-types'

import { getPayloadClient } from './payload'

/**
 * Work experience entries, most recent first. Ongoing roles (no `endYear`) sort
 * above finished ones that started in the same year.
 */
export const getWorkExperience = async (): Promise<WorkExperience[]> => {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'work-experience',
      sort: ['-startYear', '-endYear'],
      limit: 100,
      depth: 0,
    })
    return docs
  } catch {
    return []
  }
}

/**
 * Single project by slug, with `skills` and `images` populated.
 * Returns `null` when nothing matches, so the page can call `notFound()`.
 */
export const getProjectBySlug = async (slug: string): Promise<Project | null> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'projects',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  return docs[0] ?? null
}

export const PROJECTS_PER_PAGE = 9

/**
 * Paginated projects, newest first, with skills and images populated.
 */
export const getProjects = async ({
  page = 1,
  limit = PROJECTS_PER_PAGE,
}: {
  page?: number
  limit?: number
} = {}): Promise<PaginatedDocs<Project>> => {
  const payload = await getPayloadClient()
  return payload.find({
    collection: 'projects',
    sort: '-createdAt',
    page,
    limit,
    depth: 1,
  })
}
