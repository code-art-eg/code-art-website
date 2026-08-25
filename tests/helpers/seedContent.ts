import { getPayload } from 'payload'
import type { Payload } from 'payload'

import config from '../../src/payload.config.js'
import type { Bio, Config, Footer, WorkExperience } from '../../src/payload-types.js'
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
