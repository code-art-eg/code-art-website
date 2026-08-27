import type { Bio, Footer, HomePageProject, ProjectPageProject } from '@/payload-types'

import { getPayloadClient } from './payload'

/**
 * Reads the footer global. Returns `null` when it has not been seeded yet, so
 * callers can fall back to sensible defaults instead of crashing the page.
 */
export const getFooter = async (): Promise<Footer | null> => {
  try {
    const payload = await getPayloadClient()
    return await payload.findGlobal({ slug: 'footer', depth: 0 })
  } catch {
    return null
  }
}

/**
 * Reads the bio global. Returns `null` when it has not been seeded yet.
 */
export const getBio = async (): Promise<Bio | null> => {
  try {
    const payload = await getPayloadClient()
    const bio = await payload.findGlobal({ slug: 'bio', depth: 0 })
    return bio?.title ? bio : null
  } catch {
    return null
  }
}

/**
 * Reads the home page project curation. Returns `null` when it has not been
 * seeded yet, which the caller treats the same as an empty list.
 */
export const getHomePageProjects = async (): Promise<HomePageProject | null> => {
  try {
    const payload = await getPayloadClient()
    return await payload.findGlobal({ slug: 'home-page-projects', depth: 0 })
  } catch {
    return null
  }
}

/**
 * Reads the `/projects` page curation. Returns `null` when it has not been
 * seeded yet, which the caller treats the same as an empty list.
 */
export const getProjectPageProjects = async (): Promise<ProjectPageProject | null> => {
  try {
    const payload = await getPayloadClient()
    return await payload.findGlobal({ slug: 'project-page-projects', depth: 0 })
  } catch {
    return null
  }
}
