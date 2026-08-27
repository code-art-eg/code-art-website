import { getPayload } from 'payload'
import type { Payload } from 'payload'

import config from '@/payload.config.js'
import type {
  Bio,
  Blog,
  Config,
  Footer,
  HomePageProject,
  Media,
  Project,
  ProjectPageProject,
  Skill,
  WorkExperience,
} from '@/payload-types'
import { lexicalParagraphs } from './lexical'

type GlobalSlug = keyof Config['globals']

const getClient = async (): Promise<Payload> => getPayload({ config })

const snapshots = new Map<GlobalSlug, unknown>()

/**
 * Overwrites a global with test data, remembering its previous value so
 * `restoreGlobal` can put the developer's content back afterwards.
 */
export async function seedGlobal<T>(slug: GlobalSlug, data: Record<string, unknown>): Promise<T> {
  const payload = await getClient()

  if (!snapshots.has(slug)) {
    const current = await payload.findGlobal({ slug, depth: 0 })
    snapshots.set(slug, current)
  }

  return (await payload.updateGlobal({ slug, data: data as never, depth: 0 })) as T
}

/** Restores whatever the global held before `seedGlobal` was first called for it. */
export async function restoreGlobal(slug: GlobalSlug): Promise<void> {
  if (!snapshots.has(slug)) return

  const payload = await getClient()
  const previous = snapshots.get(slug) as Record<string, unknown>
  snapshots.delete(slug)

  const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...data } = previous ?? {}
  await payload.updateGlobal({ slug, data: data as never, depth: 0 })
}

export const footerFixture = {
  copyright: '© 2026 Test Engineer. All rights reserved.',
  socialLinks: [
    { platform: 'github', url: 'https://github.com/test-engineer' },
    { platform: 'linkedin', url: 'https://www.linkedin.com/in/test-engineer' },
    { platform: 'x', url: 'https://x.com/test-engineer' },
  ],
}

export const seedFooter = async (): Promise<Footer> => seedGlobal<Footer>('footer', footerFixture)

export const restoreFooter = async (): Promise<void> => restoreGlobal('footer')

export const bioFixture = {
  title: 'Test Engineer',
  subtitle: 'Senior Software Engineer',
  shortPhrase: 'I build reliable web applications end to end.',
  aboutMe: lexicalParagraphs(
    'I have been writing software professionally for over a decade.',
    'These days I work mostly with TypeScript, React and .NET.',
  ),
}

export const seedBio = async (): Promise<Bio> => seedGlobal<Bio>('bio', bioFixture)

export const restoreBio = async (): Promise<void> => restoreGlobal('bio')

export const workExperienceFixture = [
  {
    jobTitle: 'Principal Software Engineer',
    company: 'Globex Test',
    companyUrl: 'https://globex.example.com',
    location: 'Remote',
    startYear: 2022,
    jobDescription: lexicalParagraphs('Leading the platform team and its architecture.'),
  },
  {
    jobTitle: 'Senior Software Engineer',
    company: 'Initech Test',
    location: 'Berlin, Germany',
    startYear: 2017,
    endYear: 2022,
    jobDescription: lexicalParagraphs('Built internal tooling used across the company.'),
  },
]

/** Removes any work experience rows left over from a previous run, then seeds fresh ones. */
export const seedWorkExperience = async (): Promise<WorkExperience[]> => {
  const payload = await getClient()
  await cleanupWorkExperience()

  const created: WorkExperience[] = []
  for (const data of workExperienceFixture) {
    created.push(
      (await payload.create({
        collection: 'work-experience',
        data: data as never,
      })) as WorkExperience,
    )
  }
  return created
}

export const cleanupWorkExperience = async (): Promise<void> => {
  const payload = await getClient()
  await payload.delete({
    collection: 'work-experience',
    where: {
      company: { in: workExperienceFixture.map((item) => item.company) },
    },
  })
}

/** A tiny valid PNG, so media uploads do not need a fixture file on disk. */
const pngPixel = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

export const seedMedia = async (alt: string, name: string): Promise<Media> => {
  const payload = await getClient()
  return (await payload.create({
    collection: 'media',
    data: { alt },
    file: {
      data: pngPixel,
      mimetype: 'image/png',
      name,
      size: pngPixel.byteLength,
    },
  })) as Media
}

export const seedSkill = async (title: string): Promise<Skill> => {
  const payload = await getClient()
  const existing = await payload.find({
    collection: 'skills',
    where: { title: { equals: title } },
    limit: 1,
  })
  if (existing.docs[0]) return existing.docs[0] as Skill

  return (await payload.create({ collection: 'skills', data: { title } })) as Skill
}

export const projectFixture = {
  title: 'Test Portfolio Project',
  slug: 'test-portfolio-project',
  summary: 'A project seeded by the end-to-end tests.',
  externalLink: 'https://project.example.com',
  githubLink: 'https://github.com/test-engineer/test-project',
  skills: ['TypeScript E2E', 'React E2E'],
  images: [
    { alt: 'First screenshot', name: 'e2e-one.png' },
    { alt: 'Second screenshot', name: 'e2e-two.png' },
    { alt: 'Third screenshot', name: 'e2e-three.png' },
  ],
  description: 'This project exercises the project detail page.',
}

export const seedProject = async (
  overrides: Partial<{ title: string; slug: string; highlight: boolean; summary: string }> = {},
): Promise<Project> => {
  const payload = await getClient()
  const skills = await Promise.all(projectFixture.skills.map((title) => seedSkill(title)))
  const images = await Promise.all(
    projectFixture.images.map((image) => seedMedia(image.alt, image.name)),
  )

  return (await payload.create({
    collection: 'projects',
    data: {
      title: projectFixture.title,
      slug: projectFixture.slug,
      summary: projectFixture.summary,
      description: lexicalParagraphs(projectFixture.description),
      externalLink: projectFixture.externalLink,
      githubLink: projectFixture.githubLink,
      skills: skills.map((skill) => skill.id),
      images: images.map((image) => image.id),
      highlight: false,
      ...overrides,
    } as never,
  })) as Project
}

/** Deletes every project/skill/media row created by the E2E fixtures. */
export const cleanupProjects = async (): Promise<void> => {
  const payload = await getClient()

  await payload.delete({
    collection: 'projects',
    where: { slug: { like: 'test-portfolio-project' } },
  })
  await payload.delete({
    collection: 'skills',
    where: { title: { in: projectFixture.skills } },
  })
  await payload.delete({
    collection: 'media',
    where: { alt: { in: projectFixture.images.map((image) => image.alt) } },
  })
}

/**
 * Seeds `count` projects sharing the fixture skills/images, titled
 * "E2E Project 1..n" with slugs "test-portfolio-project-1..n".
 */
export const seedManyProjects = async (
  count: number,
  { highlight = false }: { highlight?: boolean } = {},
): Promise<Project[]> => {
  const payload = await getClient()
  const skills = await Promise.all(projectFixture.skills.map((title) => seedSkill(title)))
  const image = await seedMedia(projectFixture.images[0].alt, projectFixture.images[0].name)

  const created: Project[] = []
  for (let index = 1; index <= count; index++) {
    created.push(
      (await payload.create({
        collection: 'projects',
        data: {
          title: `E2E Project ${index}`,
          slug: `test-portfolio-project-${index}`,
          summary: `Summary for E2E project ${index}.`,
          description: lexicalParagraphs(`Description for E2E project ${index}.`),
          skills: skills.map((skill) => skill.id),
          images: index % 2 === 0 ? [image.id] : [],
          highlight,
        } as never,
      })) as Project,
    )
  }
  return created
}

/**
 * Points the home page "Projects" section at exactly these projects, in this order.
 * The developer's own curation is snapshotted and put back by `restoreHomePageProjects`.
 */
export const seedHomePageProjects = async (projects: Project[]): Promise<HomePageProject> =>
  seedGlobal<HomePageProject>('home-page-projects', {
    projects: projects.map((project) => project.id),
  })

export const restoreHomePageProjects = async (): Promise<void> =>
  restoreGlobal('home-page-projects')

/** The same, for the list on `/projects`. */
export const seedProjectPageProjects = async (projects: Project[]): Promise<ProjectPageProject> =>
  seedGlobal<ProjectPageProject>('project-page-projects', {
    projects: projects.map((project) => project.id),
  })

export const restoreProjectPageProjects = async (): Promise<void> =>
  restoreGlobal('project-page-projects')

export const postFixture = {
  title: 'E2E Testing With Playwright',
  slug: 'test-post-e2e-testing-with-playwright',
  summary: 'A post seeded by the end-to-end tests.',
  publishedAt: '2026-03-05T00:00:00.000Z',
  formattedDate: '5 March 2026',
  content: [
    '# Getting started',
    '',
    'Some **bold** text and a [link](https://example.com).',
    '',
    '- first item',
    '- second item',
  ].join('\n'),
}

/** Posts spread across three years, used by the blog list filter tests. */
export const postsByYear = [
  { title: 'E2E Post 2026 A', slug: 'test-post-2026-a', publishedAt: '2026-05-01T00:00:00.000Z' },
  { title: 'E2E Post 2026 B', slug: 'test-post-2026-b', publishedAt: '2026-02-01T00:00:00.000Z' },
  { title: 'E2E Post 2025 A', slug: 'test-post-2025-a', publishedAt: '2025-07-01T00:00:00.000Z' },
  { title: 'E2E Post 2024 A', slug: 'test-post-2024-a', publishedAt: '2024-09-01T00:00:00.000Z' },
]

export const seedPost = async (
  overrides: Partial<{
    title: string
    slug: string
    summary: string
    content: string
    publishedAt: string
  }> = {},
): Promise<Blog> => {
  const payload = await getClient()

  return (await payload.create({
    collection: 'blog',
    data: {
      title: postFixture.title,
      slug: postFixture.slug,
      summary: postFixture.summary,
      content: postFixture.content,
      publishedAt: postFixture.publishedAt,
      ...overrides,
    } as never,
  })) as Blog
}

export const seedPostsByYear = async (): Promise<Blog[]> => {
  const created: Blog[] = []
  for (const post of postsByYear) {
    created.push(
      await seedPost({
        ...post,
        summary: `Summary for ${post.title}.`,
        content: `Body for ${post.title}.`,
      }),
    )
  }
  return created
}

/** Removes every blog post created by the E2E fixtures. */
export const cleanupPosts = async (): Promise<void> => {
  const payload = await getClient()
  await payload.delete({
    collection: 'blog',
    where: { slug: { like: 'test-post-' } },
  })
}
