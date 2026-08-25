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
