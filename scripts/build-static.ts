/**
 * Builds a static copy of the site into `out/`.
 *
 * Payload renders this site from SQLite at request time, so there is nothing to export
 * directly: instead this builds the app into a throwaway `.next-static` directory, starts
 * it, crawls every page it links to and saves the HTML it gets back, together with the
 * assets and uploaded media those pages reference.
 *
 * The output holds only HTML, CSS, JavaScript and media files — no database, no admin
 * panel, no API routes and no server code. It is then published: the repository the site is
 * served from has its contents replaced with the build and the difference committed.
 *
 * Usage: `bun run build:static [--no-publish] [--no-push]`
 * (env: STATIC_PORT, STATIC_OUT_DIR, STATIC_PUBLISH_DIR).
 */
import { spawn } from 'node:child_process'
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { type BuildSummary, publish, publishOptions } from './publish'
import {
  extractAssetPaths,
  extractLinks,
  extractMediaFiles,
  outputPath,
  rewriteUrls,
  staticUrl,
} from './staticSite'

const ROOT = process.cwd()

/** Must match the `distDir` `next.config.ts` uses when `STATIC_EXPORT` is set. */
const DIST_DIR = '.next-static'
const OUT_DIR = process.env.STATIC_OUT_DIR ?? 'out'
const PORT = Number(process.env.STATIC_PORT ?? 4321)
const ORIGIN = `http://127.0.0.1:${PORT}`

/** Where Payload writes uploads, and the route the frontend asks for them through. */
const MEDIA_DIR = 'media'
const MEDIA_ROUTE = path.join('api', 'media', 'file')

/** Pages that exist whether or not anything links to them. */
const SEED_PATHS = ['/', '/projects', '/blog']

/** Requested purely to capture the 404 document; nothing should ever answer it. */
const NOT_FOUND_PROBE = '/__static-build-not-found__'

/**
 * Written so GitHub Pages serves the output as-is. Its Jekyll pass drops directories whose
 * name starts with an underscore, which would silently take `_next/` — every stylesheet and
 * script the site has — out of the deploy.
 */
const NO_JEKYLL = '.nojekyll'

const CHILD_ENV = {
  ...process.env,
  STATIC_EXPORT: 'true',
  NODE_OPTIONS: '--no-deprecation --max-old-space-size=8000',
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

const run = (command: string, args: string[]): Promise<void> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: ROOT, env: CHILD_ENV, stdio: 'inherit' })
    child.on('error', reject)
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`\`${command} ${args.join(' ')}\` exited ${code}`)),
    )
  })

/** Starts `next start` on PORT and resolves once it answers, with a function to stop it. */
const startServer = async (): Promise<() => void> => {
  const child = spawn('bunx', ['next', 'start', '--port', String(PORT)], {
    cwd: ROOT,
    env: CHILD_ENV,
    stdio: ['ignore', 'inherit', 'inherit'],
  })

  let exited = false
  child.on('exit', () => {
    exited = true
  })

  const stop = () => {
    if (!exited) child.kill('SIGTERM')
  }

  const deadline = Date.now() + 90_000
  while (Date.now() < deadline) {
    if (exited) throw new Error('`next start` exited before it served a request')

    try {
      await fetch(ORIGIN, { signal: AbortSignal.timeout(2_000) })
      return stop
    } catch {
      await sleep(250)
    }
  }

  stop()
  throw new Error(`\`next start\` did not answer on ${ORIGIN} within 90s`)
}

/** Every slug in a collection, read through the site's own REST API. */
const listSlugs = async (collection: string): Promise<string[]> => {
  const response = await fetch(`${ORIGIN}/api/${collection}?limit=0&depth=0`)
  if (!response.ok) throw new Error(`GET /api/${collection} returned ${response.status}`)

  const body = (await response.json()) as { docs?: { slug?: string | null }[] }
  return (body.docs ?? [])
    .map((doc) => doc.slug)
    .filter((slug): slug is string => typeof slug === 'string' && slug.length > 0)
}

/** Fetches every reachable page, following links until nothing new turns up. */
const crawl = async (seeds: string[]): Promise<Map<string, string>> => {
  const pages = new Map<string, string>()
  const queue = [...new Set(seeds)]
  const queued = new Set(queue)

  while (queue.length > 0) {
    const url = queue.shift() as string
    const response = await fetch(ORIGIN + url)
    const html = await response.text()

    if (!response.ok) {
      console.warn(`  ! skipped ${url} (HTTP ${response.status})`)
      continue
    }

    pages.set(url, html)

    for (const link of extractLinks(html, url)) {
      if (queued.has(link)) continue
      queued.add(link)
      queue.push(link)
    }
  }

  return pages
}

const writeOutputFile = async (relativePath: string, contents: string | Buffer): Promise<void> => {
  const destination = path.join(ROOT, OUT_DIR, relativePath)
  await mkdir(path.dirname(destination), { recursive: true })
  await writeFile(destination, contents)
}

/**
 * Walks out from the documents to the chunks and stylesheets they load, and from those to
 * whatever they load in turn, so lazily-requested chunks and font files come along too.
 * Only assets that exist in the build are kept — the admin panel's bundles are never
 * referenced by a frontend page, so they never get copied.
 */
const collectAssets = async (documents: Iterable<string>): Promise<string[]> => {
  const queue: string[] = []
  for (const document of documents) queue.push(...extractAssetPaths(document))

  const found = new Set<string>()

  while (queue.length > 0) {
    const asset = queue.shift() as string
    if (found.has(asset)) continue

    const contents = await readFile(path.join(ROOT, DIST_DIR, asset)).catch(() => null)
    if (!contents) continue

    found.add(asset)

    if (asset.endsWith('.js') || asset.endsWith('.css')) {
      queue.push(...extractAssetPaths(contents.toString('utf8')))
    }
  }

  return [...found]
}

/** Copies the uploads the pages actually show into the path Payload served them from. */
const copyMedia = async (documents: Iterable<string>): Promise<number> => {
  const wanted = new Set<string>()
  for (const document of documents) for (const file of extractMediaFiles(document)) wanted.add(file)

  let copied = 0

  for (const file of wanted) {
    const source = path.join(ROOT, MEDIA_DIR, file)
    const exists = await stat(source).then(
      (entry) => entry.isFile(),
      () => false,
    )

    if (!exists) {
      console.warn(`  ! missing upload ${file}`)
      continue
    }

    await writeOutputFile(path.join(MEDIA_ROUTE, file), await readFile(source))
    copied += 1
  }

  return copied
}

const directorySize = async (directory: string): Promise<number> => {
  const entries = await readdir(directory, { withFileTypes: true })
  const sizes = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name)
      if (entry.isDirectory()) return directorySize(entryPath)
      return (await stat(entryPath)).size
    }),
  )

  return sizes.reduce((total, size) => total + size, 0)
}

const main = async (): Promise<void> => {
  const options = publishOptions(process.argv.slice(2), process.env)
  let summary: BuildSummary = { pages: 0, assets: 0, media: 0 }

  console.log(`> building into ${DIST_DIR}`)
  await rm(path.join(ROOT, DIST_DIR), { recursive: true, force: true })
  await run('bunx', ['next', 'build'])

  console.log(`> starting the built site on ${ORIGIN}`)
  const stopServer = await startServer()

  try {
    const [projectSlugs, postSlugs] = await Promise.all([listSlugs('projects'), listSlugs('blog')])
    const seeds = [
      ...SEED_PATHS,
      ...projectSlugs.map((slug) => `/projects/${slug}`),
      ...postSlugs.map((slug) => `/blog/${slug}`),
    ]

    console.log('> crawling')
    const pages = await crawl(seeds)

    const notFound = await fetch(ORIGIN + NOT_FOUND_PROBE)
    const notFoundHtml = await notFound.text()

    // Every page links to the paginated and filtered ones, so they all need rewriting.
    const rewrites = new Map(
      [...pages.keys()].filter((url) => url.includes('?')).map((url) => [url, staticUrl(url)]),
    )

    console.log(`> writing ${OUT_DIR}`)
    await rm(path.join(ROOT, OUT_DIR), { recursive: true, force: true })

    const documents: string[] = []

    for (const [url, html] of pages) {
      const rewritten = rewriteUrls(html, rewrites)
      documents.push(rewritten)
      await writeOutputFile(outputPath(url), rewritten)
    }

    const notFoundDocument = rewriteUrls(notFoundHtml, rewrites)
    documents.push(notFoundDocument)
    await writeOutputFile('404.html', notFoundDocument)

    const assets = await collectAssets(documents)
    for (const asset of assets) {
      const destination = path.join(ROOT, OUT_DIR, '_next', asset)
      await mkdir(path.dirname(destination), { recursive: true })
      await cp(path.join(ROOT, DIST_DIR, asset), destination)
    }

    const mediaFiles = await copyMedia(documents)
    await writeOutputFile(NO_JEKYLL, '')
    const bytes = await directorySize(path.join(ROOT, OUT_DIR))

    summary = { pages: pages.size + 1, assets: assets.length, media: mediaFiles }

    console.log(
      `\n${OUT_DIR}/: ${summary.pages} pages, ${summary.assets} assets, ${summary.media} media files, ` +
        `${(bytes / 1024 / 1024).toFixed(1)} MB`,
    )
  } finally {
    stopServer()
  }

  await publish(path.join(ROOT, OUT_DIR), options, summary)
}

await main()
