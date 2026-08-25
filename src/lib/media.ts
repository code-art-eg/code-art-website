import type { Media } from '@/payload-types'

type MaybeMedia = number | Media | null | undefined

/** Keeps only relationship entries that were actually populated (`depth` >= 1). */
export const populatedMedia = (images?: (number | Media)[] | null): Media[] =>
  (images ?? []).filter((image): image is Media => typeof image === 'object' && image !== null)

/** First populated image of a project, used as the card thumbnail. */
export const firstImage = (images?: (number | Media)[] | null): Media | null =>
  populatedMedia(images)[0] ?? null

export const isPopulatedMedia = (image: MaybeMedia): image is Media =>
  typeof image === 'object' && image !== null
