/**
 * Reads a positive integer query param, falling back to `fallback` for anything
 * missing, non-numeric, zero or negative (`?page=abc`, `?page=-3`, `?page[]=1&page[]=2`).
 */
export const parsePositiveInt = (
  value: string | string[] | undefined,
  fallback: number,
): number => {
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw) return fallback

  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed < 1) return fallback

  return parsed
}

/** Builds `path?key=value&...`, dropping empty values and `page=1`. */
export const buildQueryUrl = (
  path: string,
  params: Record<string, string | number | undefined | null>,
): string => {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    if (key === 'page' && Number(value) === 1) continue
    search.set(key, String(value))
  }

  const query = search.toString()
  return query ? `${path}?${query}` : path
}

/**
 * Page numbers to show around the current page, with `null` marking an ellipsis.
 * e.g. current 7 of 12 -> [1, null, 6, 7, 8, null, 12]
 */
export const pageWindow = (current: number, totalPages: number, span = 1): (number | null)[] => {
  if (totalPages <= 1) return totalPages === 1 ? [1] : []

  const pages = new Set<number>([1, totalPages])
  for (let page = current - span; page <= current + span; page++) {
    if (page >= 1 && page <= totalPages) pages.add(page)
  }

  const sorted = [...pages].sort((a, b) => a - b)
  const result: (number | null)[] = []

  sorted.forEach((page, index) => {
    const previous = sorted[index - 1]
    if (index > 0 && page - previous > 1) {
      // A gap of exactly one page is shorter to render than an ellipsis.
      if (page - previous === 2) result.push(page - 1)
      else result.push(null)
    }
    result.push(page)
  })

  return result
}
