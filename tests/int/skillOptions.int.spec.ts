import { describe, expect, it, vi } from 'vitest'

import {
  dedupeSkillIds,
  findSkillByTitle,
  normalizeSkillTitle,
  resolveSkillSelection,
  sortSkillOptions,
  type SkillOption,
} from '@/lib/skillOptions'

const known: SkillOption[] = [
  { label: 'React', value: 1 },
  { label: 'TypeScript', value: 2 },
]

describe('normalizeSkillTitle', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeSkillTitle('  React   Native ')).toBe('React Native')
  })

  it('leaves an already clean title alone', () => {
    expect(normalizeSkillTitle('C#')).toBe('C#')
  })
})

describe('findSkillByTitle', () => {
  it('matches regardless of case and padding', () => {
    expect(findSkillByTitle(known, '  typescript ')?.value).toBe(2)
  })

  it('does not match a prefix', () => {
    expect(findSkillByTitle(known, 'Type')).toBeUndefined()
  })

  it('ignores an empty search', () => {
    expect(findSkillByTitle(known, '   ')).toBeUndefined()
  })
})

describe('sortSkillOptions', () => {
  it('sorts by title without regard to case', () => {
    const sorted = sortSkillOptions([
      { label: 'zod', value: 3 },
      { label: 'React', value: 1 },
      { label: 'ansible', value: 2 },
    ])
    expect(sorted.map((option) => option.label)).toStrictEqual(['ansible', 'React', 'zod'])
  })
})

describe('dedupeSkillIds', () => {
  it('keeps the first occurrence of each id', () => {
    expect(dedupeSkillIds([2, 1, 2, 3])).toStrictEqual([2, 1, 3])
  })
})

describe('resolveSkillSelection', () => {
  /** Stands in for the POST to /api/skills, handing back ids from 100 up. */
  const createSkill = () => {
    let nextId = 100
    return vi.fn(async (title: string): Promise<SkillOption | null> => ({
      label: title,
      value: nextId++,
    }))
  }

  it('passes existing selections straight through as ids', async () => {
    const create = createSkill()

    await expect(
      resolveSkillSelection({ createSkill: create, known, selected: [2, 1] }),
    ).resolves.toStrictEqual([2, 1])
    expect(create).not.toHaveBeenCalled()
  })

  it('creates a skill for text that does not match anything', async () => {
    const create = createSkill()

    await expect(
      resolveSkillSelection({ createSkill: create, known, selected: [1, 'Rust'] }),
    ).resolves.toStrictEqual([1, 100])
    expect(create).toHaveBeenCalledWith('Rust')
  })

  it('reuses an existing skill instead of creating a case variant', async () => {
    const create = createSkill()

    await expect(
      resolveSkillSelection({ createSkill: create, known, selected: [' react '] }),
    ).resolves.toStrictEqual([1])
    expect(create).not.toHaveBeenCalled()
  })

  it('normalises the title it creates', async () => {
    const create = createSkill()

    await resolveSkillSelection({ createSkill: create, known, selected: ['  Rust   Lang '] })

    expect(create).toHaveBeenCalledWith('Rust Lang')
  })

  it('creates a new skill only once when it is typed twice', async () => {
    const create = createSkill()

    await expect(
      resolveSkillSelection({ createSkill: create, known, selected: ['Rust', 'rust'] }),
    ).resolves.toStrictEqual([100])
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('skips blank text and drops duplicate ids', async () => {
    const create = createSkill()

    await expect(
      resolveSkillSelection({ createSkill: create, known, selected: ['   ', 1, 1] }),
    ).resolves.toStrictEqual([1])
    expect(create).not.toHaveBeenCalled()
  })

  it('leaves the selection out when creating fails', async () => {
    const create = vi.fn(async (): Promise<SkillOption | null> => null)

    await expect(
      resolveSkillSelection({ createSkill: create, known, selected: [1, 'Broken'] }),
    ).resolves.toStrictEqual([1])
  })
})
