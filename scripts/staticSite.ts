/**
 * Pure helpers behind `bun run build:static`.
 *
 * The static build renders the real site and saves what it gets, so everything here is
 * about the gap between "a URL the running site serves" and "a file a dumb static host can
 * serve": query strings become path segments, and the HTML has to be pointed at the result.
 *
 * They live apart from the crawler in `build-static.ts` so they can be unit tested without
 * a build, a server or a database.
 */

/** Query params that keep a fixed place in the path; anything else follows, alphabetically. */
const PARAM_ORDER = ['year', 'limit', 'page']

/** Route prefixes the static site has no copy of: Payload's admin panel and its API. */
const EXCLUDED_PREFIXES = ['/_next', '/api', '/admin']

/** Only used to resolve relative URLs; nothing is ever fetched from it. */
const BASE = 'http://static.invalid'

const startsWithSegment = (url: string, prefix: string): boolean => {
  if (!url.startsWith(prefix)) return false
  const next = url[prefix.length]
  return next === undefined || next === '/' || next === '?' || next === '#'
}

/**
 * The static location of a page URL. A static host ignores the query string, so
 * `/blog?year=2026&page=2` has to become a real path — `/blog/year/2026/page/2/`. The param
 * order is fixed so the same page always lands in the same place.
 */
export const staticUrl = (url: string): string => {
  const { pathname, searchParams } = new URL(url, BASE)
  const keys = [...new Set(searchParams.keys())]
  const ordered = [
    ...PARAM_ORDER.filter((key) => keys.includes(key)),
    ...keys.filter((key) => !PARAM_ORDER.includes(key)).sort(),
  ]

  const segments = ordered.map(
    (key) => `${encodeURIComponent(key)}/${encodeURIComponent(searchParams.get(key) ?? '')}`,
  )

  return `${[pathname.replace(/\/+$/, ''), ...segments].join('/')}/`
}

/** The file a page URL is written to, relative to the output directory. */
export const outputPath = (url: string): string => `${staticUrl(url).slice(1)}index.html`

/** Whether a same-origin URL is a page worth crawling, rather than an asset or the admin. */
export const isCrawlable = (url: string): boolean => {
  if (!url.startsWith('/') || url.startsWith('//')) return false
  if (EXCLUDED_PREFIXES.some((prefix) => startsWithSegment(url, prefix))) return false

  const lastSegment = new URL(url, BASE).pathname.split('/').pop() ?? ''
  return !lastSegment.includes('.')
}

/**
 * Resolves an `href` against the page it was found on, returning `path?query` for
 * same-origin links and `null` for anything else (external, `mailto:`, bare fragments).
 */
export const normalizeHref = (href: string, from = '/'): string | null => {
  const raw = href.replace(/&amp;/g, '&').trim()
  if (!raw || raw.startsWith('#')) return null

  let resolved: URL
  try {
    resolved = new URL(raw, new URL(from, BASE))
  } catch {
    return null
  }

  if (resolved.origin !== BASE) return null
  return `${resolved.pathname}${resolved.search}`
}

/** Same-origin page links in a rendered document, in the form the crawler queues them. */
export const extractLinks = (html: string, from = '/'): string[] => {
  const links = new Set<string>()

  for (const match of html.matchAll(/href="([^"]*)"/g)) {
    const url = normalizeHref(match[1], from)
    if (url && isCrawlable(url)) links.add(url)
  }

  return [...links]
}

/**
 * Build assets referenced by a document, stylesheet or chunk, relative to the build
 * directory (`static/chunks/abc.js`). Matches are checked against disk by the caller, so a
 * stray match inside a JavaScript string costs nothing.
 */
export const extractAssetPaths = (text: string): string[] => {
  const assets = new Set<string>()

  for (const match of text.matchAll(/(?:\/_next\/)?static\/[A-Za-z0-9._\-/]+\.[a-z0-9]{2,6}/g)) {
    assets.add(match[0].replace(/^\/_next\//, ''))
  }

  return [...assets]
}

/** Uploaded files a document asks Payload for, as plain names within the media directory. */
export const extractMediaFiles = (html: string): string[] => {
  const files = new Set<string>()

  for (const match of html.matchAll(/\/api\/media\/file\/([^"'\\?&\s]+)/g)) {
    try {
      files.add(decodeURIComponent(match[1]))
    } catch {
      files.add(match[1])
    }
  }

  return [...files]
}

/**
 * The three ways a URL is written into a rendered document: plainly in an attribute, with the
 * markup entity for `&`, and with the escape the React payload uses for it.
 */
const urlVariants = (url: string): string[] => [
  url,
  url.replace(/&/g, '&amp;'),
  url.replace(/&/g, '\\u0026'),
]

/**
 * Points every rewritten URL in a document at its static location — in the markup and in the
 * React payload alongside it, so the page still matches itself after hydration. Quoting is
 * what keeps this safe: only a whole attribute value is replaced, never a path that happens to
 * start with the same characters. The payload escapes the quotes around its copy as well, so
 * both quote forms are rewritten.
 */
export const rewriteUrls = (html: string, rewrites: Map<string, string>): string => {
  let output = html

  for (const [from, to] of rewrites) {
    if (from === to) continue

    for (const url of new Set(urlVariants(from))) {
      for (const quote of ['"', '\\"']) {
        output = output.split(`${quote}${url}${quote}`).join(`${quote}${to}${quote}`)
      }
    }
  }

  return output
}
