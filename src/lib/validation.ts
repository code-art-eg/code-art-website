/**
 * Shared field validators. Payload calls these with the field value; returning a
 * string marks the field invalid and shows that string to the editor.
 */

const checkAbsoluteUrl = (value: string): string | true => {
  try {
    const { protocol } = new URL(value)
    if (protocol !== 'http:' && protocol !== 'https:') {
      return 'URL must start with http:// or https://'
    }
  } catch {
    return 'Please enter a valid absolute URL, e.g. https://example.com'
  }
  return true
}

/** Requires an absolute http(s) URL. */
export const requiredUrl = (value: string | null | undefined): string | true => {
  if (!value) return 'Please enter a URL.'
  return checkAbsoluteUrl(value)
}

/** Allows an empty value, but validates anything that is entered. */
export const optionalUrl = (value: string | null | undefined): string | true => {
  if (!value) return true
  return checkAbsoluteUrl(value)
}

const currentYear = new Date().getFullYear()

/** Whole years within a sane range; empty is allowed only when `required` is false. */
export const yearValidator =
  (required: boolean) =>
  (value: number | null | undefined): string | true => {
    if (value === null || value === undefined) {
      return required ? 'Please enter a year.' : true
    }
    if (!Number.isInteger(value)) return 'Please enter a whole year, e.g. 2019.'
    if (value < 1950 || value > currentYear + 10) {
      return `Please enter a year between 1950 and ${currentYear + 10}.`
    }
    return true
  }

/** URL-safe slugs: lowercase letters, digits and single hyphens. */
export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const validateSlug = (value: string | null | undefined): string | true => {
  if (!value) return 'Please enter a slug.'
  if (!slugPattern.test(value)) {
    return 'Use lowercase letters, numbers and single hyphens, e.g. my-project'
  }
  return true
}
