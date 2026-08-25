/**
 * Formats an ISO date as "5 March 2026".
 *
 * Always formats in UTC: posts are stored with a day-only picker (midnight UTC), and a
 * timezone-dependent format would render a different day on the server than in the browser
 * and trip React's hydration check.
 */
export const formatPostDate = (value?: string | null): string => {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

/** Calendar year of an ISO date in UTC, or `null` when it cannot be parsed. */
export const postYear = (value?: string | null): number | null => {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return date.getUTCFullYear()
}
