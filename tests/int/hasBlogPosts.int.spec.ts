import { afterEach, describe, expect, it, vi } from 'vitest'

import { hasBlogPosts } from '@/lib/collections'

const count = vi.hoisted(() => vi.fn())

vi.mock('@/lib/payload', () => ({
  getPayloadClient: async () => ({ count }),
}))

afterEach(() => {
  vi.clearAllMocks()
})

describe('hasBlogPosts', () => {
  it('counts the blog collection', async () => {
    count.mockResolvedValue({ totalDocs: 3 })

    await expect(hasBlogPosts()).resolves.toBe(true)
    expect(count).toHaveBeenCalledWith({ collection: 'blog' })
  })

  it('is false when the blog is empty', async () => {
    count.mockResolvedValue({ totalDocs: 0 })

    await expect(hasBlogPosts()).resolves.toBe(false)
  })

  it('is false when the database cannot be reached', async () => {
    count.mockRejectedValue(new Error('no database'))

    await expect(hasBlogPosts()).resolves.toBe(false)
  })
})
