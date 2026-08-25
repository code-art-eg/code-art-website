/**
 * Turns a title into a URL-safe slug: "My  Cool Project!" -> "my-cool-project".
 */
export const slugify = (value: string): string =>
  value
    .normalize('NFKD')
    // Strip combining diacritical marks left behind by the NFKD decomposition.
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
