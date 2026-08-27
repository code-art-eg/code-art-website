import type { PaginatedDocs } from 'payload'

import type { Blog, Project, WorkExperience } from '@/payload-types'

import { postYear } from './date'
import { getHomePageProjects, getProjectPageProjects } from './globals'
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
 * The ordered project ids a curation global holds. Relationship values come back as bare
 * ids at `depth: 0`, but tolerate populated docs so the caller cannot get this wrong.
 */
export const curatedProjectIds = (selection: (number | Project)[] | null | undefined): number[] =>
  (selection ?? []).map((entry) => (typeof entry === 'object' ? entry.id : entry))

/**
 * Loads projects by id and hands them back in the order the ids were given, since
 * `where: { id: { in } }` has no order of its own. Ids with no matching document are
 * dropped rather than rendered as a hole.
 */
const findProjectsInOrder = async (ids: number[]): Promise<Project[]> => {
  if (ids.length === 0) return []

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'projects',
    where: { id: { in: ids } },
    limit: ids.length,
    depth: 1,
  })

  const byId = new Map(docs.map((doc) => [doc.id, doc]))
  return ids.map((id) => byId.get(id)).filter((doc): doc is Project => doc !== undefined)
}

/**
 * The `PaginatedDocs` bookkeeping for a list of `totalDocs` items, matching what
 * `payload.find` would report. Split out from the query so the arithmetic can be tested
 * without a database.
 */
export const curatedPageMeta = (
  totalDocs: number,
  page: number,
  limit: number,
): Omit<PaginatedDocs<Project>, 'docs'> => {
  const totalPages = Math.ceil(totalDocs / limit)

  return {
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    limit,
    nextPage: page < totalPages ? page + 1 : null,
    page,
    pagingCounter: (page - 1) * limit + 1,
    prevPage: page > 1 ? page - 1 : null,
    totalDocs,
    totalPages,
  }
}

/**
 * Paginates a curated id list in memory. Payload cannot sort by "the order an editor
 * dragged these into", so the slicing happens here and only the current page is fetched.
 */
const curatedProjectPage = async (
  ids: number[],
  page: number,
  limit: number,
): Promise<PaginatedDocs<Project>> => ({
  docs: await findProjectsInOrder(ids.slice((page - 1) * limit, page * limit)),
  ...curatedPageMeta(ids.length, page, limit),
})

/**
 * The projects listed on `/projects`, paginated. The `project-page-projects` global picks
 * them and fixes their order, so an empty global lists nothing at all.
 */
export const getProjects = async ({
  page = 1,
  limit = PROJECTS_PER_PAGE,
}: {
  page?: number
  limit?: number
} = {}): Promise<PaginatedDocs<Project>> => {
  const ids = curatedProjectIds((await getProjectPageProjects())?.projects)
  return curatedProjectPage(ids, page, limit)
}

/**
 * The projects shown on the home page, picked and ordered by the `home-page-projects`
 * global, plus how many projects `/projects` lists so the caller can decide whether a
 * "View all projects" link would lead anywhere new.
 */
export const getFeaturedProjects = async (): Promise<{
  projects: Project[]
  totalProjects: number
}> => {
  try {
    const [home, projectPage] = await Promise.all([getHomePageProjects(), getProjectPageProjects()])

    return {
      projects: await findProjectsInOrder(curatedProjectIds(home?.projects)),
      totalProjects: curatedProjectIds(projectPage?.projects).length,
    }
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
