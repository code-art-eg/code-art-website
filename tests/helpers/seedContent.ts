import { getPayload } from 'payload'
import type { Payload } from 'payload'

import config from '../../src/payload.config.js'
import type { Config, Footer } from '../../src/payload-types.js'

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
