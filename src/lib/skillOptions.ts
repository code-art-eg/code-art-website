/**
 * Helpers shared by the Projects admin skill picker (`src/components/admin/SkillsTagInput.tsx`).
 *
 * The picker lets an editor type a skill name and press Enter: an existing skill is selected,
 * an unknown one is created on the spot. Matching therefore has to be forgiving about case and
 * stray whitespace, or "react", "React " and "React" would each end up as their own row in a
 * collection whose `title` is unique.
 */

export type SkillId = number | string

/** A react-select option: the skill's id as the value, its title as the label. */
export interface SkillOption {
  /** Payload's react-select `Option` allows arbitrary extra keys; matching it avoids casts. */
  [key: string]: unknown
  label: string
  value: SkillId
}

/** Collapses runs of whitespace and trims, so " React   Native " becomes "React Native". */
export const normalizeSkillTitle = (title: string): string => title.replace(/\s+/g, ' ').trim()

/** Finds an already-loaded skill whose title matches, ignoring case and surrounding whitespace. */
export const findSkillByTitle = (
  options: SkillOption[],
  title: string,
): SkillOption | undefined => {
  const normalized = normalizeSkillTitle(title).toLowerCase()
  if (!normalized) return undefined

  return options.find((option) => normalizeSkillTitle(option.label).toLowerCase() === normalized)
}

/** Keeps the first occurrence of each id, preserving the editor's chosen order. */
export const dedupeSkillIds = (ids: SkillId[]): SkillId[] => [...new Set(ids)]

/** Case-insensitive title sort, matching the `defaultSort: 'title'` of the Skills collection. */
export const sortSkillOptions = (options: SkillOption[]): SkillOption[] =>
  [...options].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))

/**
 * Turns what react-select handed back into the ids the relationship field stores.
 *
 * Values that belong to a known skill pass straight through. Anything else is text the editor
 * typed — react-select puts the raw text on the option's `value` — so it is matched against the
 * loaded skills first and only created when it is genuinely new.
 */
export const resolveSkillSelection = async ({
  createSkill,
  known,
  selected,
}: {
  createSkill: (title: string) => Promise<SkillOption | null>
  known: SkillOption[]
  selected: SkillId[]
}): Promise<SkillId[]> => {
  const ids: SkillId[] = []

  for (const value of selected) {
    if (known.some((option) => option.value === value)) {
      ids.push(value)
      continue
    }

    const title = normalizeSkillTitle(String(value))
    if (!title) continue

    const existing = findSkillByTitle(known, title)
    if (existing) {
      ids.push(existing.value)
      continue
    }

    const created = await createSkill(title)
    if (created) {
      // A freshly created skill counts as known for the rest of this selection, so typing the
      // same new name twice cannot create it twice.
      known = [...known, created]
      ids.push(created.value)
    }
  }

  return dedupeSkillIds(ids)
}
