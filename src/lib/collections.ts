import type { PaginatedDocs } from 'payload'

import type { Blog, Project, WorkExperience } from '@/payload-types'

import { postYear } from './date'
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

export const FEATURED_PROJECTS_LIMIT = 5

/**
 * The highlighted projects shown on the home page, plus the total number of projects
 * so the caller can decide whether to offer a "View all projects" link.
 */
export const getFeaturedProjects = async (
  limit = FEATURED_PROJECTS_LIMIT,
): Promise<{ projects: Project[]; totalProjects: number }> => {
  try {
    const payload = await getPayloadClient()

    const [highlighted, all] = await Promise.all([
      payload.find({
        collection: 'projects',
        where: { highlight: { equals: true } },
        sort: '-createdAt',
        limit,
        depth: 1,
      }),
      payload.count({ collection: 'projects' }),
    ])

    return { projects: highlighted.docs, totalProjects: all.totalDocs }
  } catch {
    return { projects: [], totalProjects: 0 }
  }
}

/**
 * Single blog post by slug. Returns `null` when nothing matches.
 */
export const getPostBySlug = async (slug: string): Promise<Blog | null> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'blog',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  return docs[0] ?? null
}

export const BLOG_POSTS_PER_PAGE = 10

/** UTC bounds of a calendar year, as ISO strings for Payload date queries. */
export const yearRange = (year: number): { from: string; to: string } => ({
  from: new Date(Date.UTC(year, 0, 1)).toISOString(),
  to: new Date(Date.UTC(year + 1, 0, 1)).toISOString(),
})

/**
 * Paginated blog posts, newest first, optionally restricted to one publication year.
 */
export const getPosts = async ({
  page = 1,
  limit = BLOG_POSTS_PER_PAGE,
  year,
}: {
  page?: number
  limit?: number
  year?: number | null
} = {}): Promise<PaginatedDocs<Blog>> => {
  const payload = await getPayloadClient()
  const { from, to } = year ? yearRange(year) : { from: undefined, to: undefined }

  return payload.find({
    collection: 'blog',
    where: year ? { publishedAt: { greater_than_equal: from, less_than: to } } : {},
    sort: '-publishedAt',
    page,
    limit,
    depth: 0,
  })
}

/**
 * Every publication year that has at least one post, newest first.
 * Only `publishedAt` is selected, so this stays cheap as the blog grows.
 */
export const getPostYears = async (): Promise<number[]> => {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'blog',
      sort: '-publishedAt',
      limit: 0,
      depth: 0,
      select: { publishedAt: true },
    })

    const years = new Set<number>()
    for (const doc of docs) {
      const year = postYear(doc.publishedAt)
      if (year !== null) years.add(year)
    }

    return [...years].sort((a, b) => b - a)
  } catch {
    return []
  }
}

/** The 5 most recent posts, for the home page. */
export const getLatestPosts = async (limit = 5): Promise<Blog[]> => {
  try {
    const { docs } = await getPosts({ page: 1, limit })
    return docs
  } catch {
    return []
  }
}
