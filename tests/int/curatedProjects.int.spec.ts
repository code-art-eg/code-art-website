import { describe, expect, it } from 'vitest'

import { curatedPageMeta, curatedProjectIds } from '@/lib/collections'
import { makeProject } from '../helpers/fixtures'

describe('curatedProjectIds', () => {
  it('returns an empty list for an unset curation', () => {
    expect(curatedProjectIds(undefined)).toEqual([])
    expect(curatedProjectIds(null)).toEqual([])
    expect(curatedProjectIds([])).toEqual([])
  })

  it('keeps bare relationship ids in the order the editor arranged them', () => {
    expect(curatedProjectIds([7, 2, 5])).toEqual([7, 2, 5])
  })

  it('reads the id out of populated relationship docs', () => {
    const first = makeProject({ title: 'First' })
    const second = makeProject({ title: 'Second' })

    expect(curatedProjectIds([first, second])).toEqual([first.id, second.id])
  })

  it('handles a curation that mixes ids and populated docs', () => {
    const project = makeProject({ title: 'Populated' })

    expect(curatedProjectIds([3, project, 9])).toEqual([3, project.id, 9])
  })
})

describe('curatedPageMeta', () => {
  it('reports the first of three pages', () => {
    expect(curatedPageMeta(5, 1, 2)).toStrictEqual({
      hasNextPage: true,
      hasPrevPage: false,
      limit: 2,
      nextPage: 2,
      page: 1,
      pagingCounter: 1,
      prevPage: null,
      totalDocs: 5,
      totalPages: 3,
    })
  })

  it('reports a middle page as having both neighbours', () => {
    const meta = curatedPageMeta(5, 2, 2)

    expect(meta.hasPrevPage).toBe(true)
    expect(meta.hasNextPage).toBe(true)
    expect(meta.prevPage).toBe(2 - 1)
    expect(meta.nextPage).toBe(2 + 1)
    expect(meta.pagingCounter).toBe(3)
  })

  it('closes off the last page, however short it is', () => {
    const meta = curatedPageMeta(5, 3, 2)

    expect(meta.hasNextPage).toBe(false)
    expect(meta.nextPage).toBeNull()
    expect(meta.totalPages).toBe(3)
  })

  it('reports no pages at all for an empty curation', () => {
    const meta = curatedPageMeta(0, 1, 9)

    // `totalPages: 0` is what keeps <Pagination /> from rendering.
    expect(meta.totalPages).toBe(0)
    expect(meta.totalDocs).toBe(0)
    expect(meta.hasNextPage).toBe(false)
    expect(meta.hasPrevPage).toBe(false)
  })

  it('reports a single page when everything fits on it', () => {
    const meta = curatedPageMeta(4, 1, 9)

    expect(meta.totalPages).toBe(1)
    expect(meta.hasNextPage).toBe(false)
    expect(meta.hasPrevPage).toBe(false)
  })

  it('does not claim a next page for a page past the end', () => {
    const meta = curatedPageMeta(5, 4, 2)

    expect(meta.hasNextPage).toBe(false)
    expect(meta.nextPage).toBeNull()
    expect(meta.hasPrevPage).toBe(true)
  })
})
