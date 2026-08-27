import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'

import {
  extractAssetPaths,
  extractLinks,
  extractMediaFiles,
  isCrawlable,
  normalizeHref,
  outputPath,
  rewriteUrls,
  staticUrl,
} from '../../scripts/staticSite'

describe('staticUrl', () => {
  it('keeps plain page paths, with a trailing slash for the directory it becomes', () => {
    expect(staticUrl('/')).toBe('/')
    expect(staticUrl('/blog')).toBe('/blog/')
    expect(staticUrl('/blog/my-post')).toBe('/blog/my-post/')
  })

  it('turns query params into path segments, because static hosts ignore the query', () => {
    expect(staticUrl('/blog?page=2')).toBe('/blog/page/2/')
    expect(staticUrl('/projects?page=3')).toBe('/projects/page/3/')
    expect(staticUrl('/blog?year=2026')).toBe('/blog/year/2026/')
  })

  it('orders params so the same page always lands in the same file', () => {
    expect(staticUrl('/blog?page=2&year=2026')).toBe('/blog/year/2026/page/2/')
    expect(staticUrl('/blog?year=2026&page=2')).toBe('/blog/year/2026/page/2/')
    expect(staticUrl('/blog?page=2&limit=5&year=2026')).toBe('/blog/year/2026/limit/5/page/2/')
  })

  it('appends unknown params alphabetically rather than dropping them', () => {
    expect(staticUrl('/blog?tag=payload&page=2&author=me')).toBe(
      '/blog/page/2/author/me/tag/payload/',
    )
  })

  it('encodes values that would otherwise create extra path segments', () => {
    expect(staticUrl('/blog?year=a/b')).toBe('/blog/year/a%2Fb/')
  })
})

describe('outputPath', () => {
  it('writes each page as the index of its own directory', () => {
    expect(outputPath('/')).toBe('index.html')
    expect(outputPath('/projects')).toBe('projects/index.html')
    expect(outputPath('/projects/a-project')).toBe('projects/a-project/index.html')
    expect(outputPath('/blog?year=2026&page=2')).toBe('blog/year/2026/page/2/index.html')
  })
})

describe('isCrawlable', () => {
  it('accepts frontend pages', () => {
    expect(isCrawlable('/')).toBe(true)
    expect(isCrawlable('/blog')).toBe(true)
    expect(isCrawlable('/blog?page=2')).toBe(true)
  })

  it('rejects the admin panel, the API and build assets', () => {
    expect(isCrawlable('/admin')).toBe(false)
    expect(isCrawlable('/admin/collections/projects')).toBe(false)
    expect(isCrawlable('/api/media/file/shot.png')).toBe(false)
    expect(isCrawlable('/_next/static/chunks/main.js')).toBe(false)
  })

  it('does not mistake a page for the admin because it starts with the same letters', () => {
    expect(isCrawlable('/administration-notes')).toBe(true)
    expect(isCrawlable('/apis')).toBe(true)
  })

  it('rejects files and anything that is not a same-origin path', () => {
    expect(isCrawlable('/favicon.ico')).toBe(false)
    expect(isCrawlable('//example.com/blog')).toBe(false)
    expect(isCrawlable('https://example.com/blog')).toBe(false)
  })
})

describe('normalizeHref', () => {
  it('resolves relative links against the page they were found on', () => {
    expect(normalizeHref('my-post', '/blog/')).toBe('/blog/my-post')
    expect(normalizeHref('/projects', '/blog/a-post')).toBe('/projects')
  })

  it('decodes the HTML entity Next writes into hrefs', () => {
    expect(normalizeHref('/blog?year=2026&amp;page=2')).toBe('/blog?year=2026&page=2')
  })

  it('drops fragments, external links and other schemes', () => {
    expect(normalizeHref('#about')).toBeNull()
    expect(normalizeHref('https://github.com/someone')).toBeNull()
    expect(normalizeHref('mailto:someone@example.com')).toBeNull()
    expect(normalizeHref('//example.com/blog')).toBeNull()
  })

  it('keeps the path of a home page anchor so the crawler still queues the page', () => {
    expect(normalizeHref('/#projects', '/blog')).toBe('/')
  })
})

describe('extractLinks', () => {
  const html = `
    <a href="/blog">Blog</a>
    <a href="/blog?year=2026&amp;page=2">2</a>
    <a href="/blog/hello-world">Hello</a>
    <a href="https://github.com/someone">GitHub</a>
    <a href="#about">About</a>
    <a href="/admin">Admin</a>
    <link rel="stylesheet" href="/_next/static/chunks/abc.css" />
  `

  it('returns the same-origin pages, deduplicated and query-decoded', () => {
    expect(extractLinks(html).sort()).toEqual([
      '/blog',
      '/blog/hello-world',
      '/blog?year=2026&page=2',
    ])
  })
})

describe('extractAssetPaths', () => {
  it('finds assets in markup and strips the route prefix', () => {
    expect(extractAssetPaths('<script src="/_next/static/chunks/abc-1.js"></script>')).toEqual([
      'static/chunks/abc-1.js',
    ])
  })

  it('finds chunks a chunk loads itself, so lazy chunks are not left behind', () => {
    expect(extractAssetPaths('loadChunk("static/chunks/lazy_9f.js")')).toEqual([
      'static/chunks/lazy_9f.js',
    ])
  })

  it('keeps the whole name of a hashed font, not just its first extension', () => {
    expect(extractAssetPaths('url(/_next/static/media/inter.a1b2c3.woff2)')).toEqual([
      'static/media/inter.a1b2c3.woff2',
    ])
  })

  it('deduplicates repeated references', () => {
    expect(
      extractAssetPaths('/_next/static/chunks/a.js and /_next/static/chunks/a.js'),
    ).toHaveLength(1)
  })
})

describe('extractMediaFiles', () => {
  it('returns the upload names behind the media route', () => {
    expect(extractMediaFiles('<img src="/api/media/file/shot.png" />')).toEqual(['shot.png'])
  })

  it('decodes escaped names and deduplicates', () => {
    expect(
      extractMediaFiles('src="/api/media/file/a%20shot.png" href="/api/media/file/a%20shot.png"'),
    ).toEqual(['a shot.png'])
  })
})

describe('rewriteUrls', () => {
  const rewrites = new Map([
    ['/blog?page=2', '/blog/page/2/'],
    ['/blog?year=2026&page=2', '/blog/year/2026/page/2/'],
  ])

  it('rewrites hrefs, including the entity-encoded form', () => {
    expect(rewriteUrls('<a href="/blog?page=2">2</a>', rewrites)).toBe(
      '<a href="/blog/page/2/">2</a>',
    )
    expect(rewriteUrls('<a href="/blog?year=2026&amp;page=2">2</a>', rewrites)).toBe(
      '<a href="/blog/year/2026/page/2/">2</a>',
    )
  })

  it('rewrites the payload copy of a URL, where `&` is escaped again', () => {
    const payload = String.raw`{\"href\":\"/blog?year=2026\u0026page=2\"}`

    expect(rewriteUrls(payload, rewrites)).toBe(String.raw`{\"href\":\"/blog/year/2026/page/2/\"}`)
  })

  it('rewrites the copy inside the React payload, so hydration agrees with the markup', () => {
    const payload = String.raw`self.__next_f.push([1,"3:[\"$\",\"a\",null,{\"href\":\"/blog?page=2\"}]"])`

    expect(rewriteUrls(payload, rewrites)).toBe(
      String.raw`self.__next_f.push([1,"3:[\"$\",\"a\",null,{\"href\":\"/blog/page/2/\"}]"])`,
    )
  })

  it('leaves links that were never rewritten alone', () => {
    expect(rewriteUrls('<a href="/blog">Blog</a>', rewrites)).toBe('<a href="/blog">Blog</a>')
  })
})

describe('the build:static script', () => {
  it('is wired up in package.json', async () => {
    const manifest = JSON.parse(await readFile('package.json', 'utf8')) as {
      scripts: Record<string, string>
    }

    expect(manifest.scripts['build:static']).toContain('scripts/build-static.ts')
  })
})
