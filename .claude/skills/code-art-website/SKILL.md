---
name: code-art-website
description: Use when working anywhere in this personal-website repo - Payload CMS collections and globals (Bio, Footer, WorkExperience, Skills, Projects, Blog, Users, Media), the Next.js App Router frontend, the Local API data helpers in src/lib, Tailwind styling, or the Vitest/Playwright suites. Covers the content model, architecture, conventions and commands.
---

# Code Art Website

Personal website and portfolio: Payload CMS 3.88 (admin + API) and Next.js 16 (App Router)
in one app, on Bun, SQLite and Tailwind CSS v4.

## Commands

| Task                                | Command                      |
| ----------------------------------- | ---------------------------- |
| Install dependencies                | `bun install`                |
| Dev server (frontend + `/admin`)    | `bun run dev`                |
| Production build (also type-checks) | `bun run build`              |
| Regenerate `src/payload-types.ts`   | `bun run generate:types`     |
| Regenerate the admin import map     | `bun run generate:importmap` |
| Unit / integration tests            | `bun run test:int`           |
| End-to-end tests                    | `bun run test:e2e`           |
| Both suites                         | `bun run test`               |
| Format                              | `bunx prettier --write .`    |
| Lint                                | `bun run lint`               |
| Any Payload CLI command             | `bun run payload <command>`  |

Use **Bun**, never npm/pnpm/yarn. Type checking alone: `bunx tsc --noEmit`.

Run **both** generators after any collection/global/field change, and commit their output. The
import map is not only for custom components — `richText` fields resolve the Lexical editor and
its toolbar features through it, so a stale map makes those fields render as nothing at all with
no error shown in the admin UI. `tests/int/importMap.int.spec.ts` fails when the map is stale.

## Content model

Registered in `src/payload.config.ts`. Everything readable by the frontend sets
`access.read: () => true`.

### Globals (`src/globals/`)

| Global   | Slug     | Fields                                                                                           |
| -------- | -------- | ------------------------------------------------------------------------------------------------ |
| `Bio`    | `bio`    | `title` (required, the name), `subtitle`, `shortPhrase`, `aboutMe` (Lexical rich text)           |
| `Footer` | `footer` | `copyright`, `socialLinks[]` → `platform` (`github`/`linkedin`/`facebook`/`twitter`/`x`) + `url` |

### Collections (`src/collections/`)

| Collection       | Slug              | Notes                                                                                                                                                  |
| ---------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Users`          | `users`           | Auth collection backing the admin panel                                                                                                                |
| `Media`          | `media`           | Uploads; files land in `/media` (gitignored)                                                                                                           |
| `WorkExperience` | `work-experience` | `jobTitle`, `company`, `companyUrl`, `location`, `startYear`, `endYear` (empty = "Present"), `jobDescription` (rich text). `defaultSort: '-startYear'` |
| `Skills`         | `skills`          | `title` only — required, unique, indexed. Created inline from the Projects skills tag input                                                            |
| `Projects`       | `projects`        | `title`, `slug`, `summary`, `description` (rich text), `externalLink`, `githubLink`, `skills[]` (required), `images[]` → media, `highlight`            |
| `Blog`           | `blog`            | `title`, `slug`, `summary`, `content` (**Markdown** in a `code` field), `publishedAt` (indexed). `defaultSort: '-publishedAt'`                         |

`Projects.slug` and `Blog.slug` are required, unique and indexed, and a `beforeValidate` hook
derives them from the title when blank (and normalises hand-typed values) via `slugify()`.

## Architecture

```
src/
  app/(frontend)/          Public site. layout.tsx renders <Nav> + <Footer>.
    page.tsx               Home: Bio -> Experience -> Featured projects -> Latest posts
    projects/page.tsx      Grid + pagination
    projects/[slug]/       Detail page with image carousel
    blog/page.tsx          List + year filter + pagination
    blog/[slug]/           Post with rendered Markdown
  app/(payload)/           Payload-generated admin + REST/GraphQL routes. Do not hand-edit.
  collections/, globals/   Payload schema
  components/              Presentational React components
  components/admin/        Client components the Payload admin renders (custom fields)
  lib/                     Local API queries and pure helpers
  payload-types.ts         GENERATED — never edit by hand
```

### The data-fetching rule

**Pages fetch; components render.** Route files are async server components that call a helper
from `src/lib/`, then pass plain props into presentational components. Those components take no
Payload client and do no I/O, which is what makes them unit-testable with React Testing Library.

- `src/lib/payload.ts` — `getPayloadClient()`, the shared Local API client.
- `src/lib/globals.ts` — `getFooter()`, `getBio()`. Return `null` when unseeded so pages can fall
  back instead of crashing.
- `src/lib/collections.ts` — `getWorkExperience()`, `getProjects()`, `getProjectBySlug()`,
  `getFeaturedProjects()`, `getPosts()`, `getPostBySlug()`, `getPostYears()`, `getLatestPosts()`,
  plus `yearRange()` and the per-page constants.
- `src/lib/pagination.ts` — `parsePositiveInt()`, `parseYearParam()`, `buildQueryUrl()`,
  `pageWindow()`. **Always** parse query params through these; they reject junk, zero, negative,
  fractional and repeated values.
- `src/lib/date.ts` — `formatPostDate()`, `postYear()`. Both format in **UTC** on purpose:
  posts use a day-only picker, and a local-timezone format would render a different day on the
  server than in the browser and break hydration.
- `src/lib/validation.ts` — `requiredUrl`, `optionalUrl`, `yearValidator`, `validateSlug`.
  Reuse these instead of writing another URL check.
- `src/lib/media.ts` — `populatedMedia()`, `firstImage()` filter relationship entries down to
  those actually populated by `depth >= 1`.
- `src/lib/navigation.ts` — `navItems` drives the fixed menu. **Adding a menu entry means adding
  an entry here and a matching `<section id="...">`; `Nav` needs no change.**

### Rendering notes

- `src/app/(frontend)/layout.tsx` sets `export const dynamic = 'force-dynamic'`. Route segment
  config in a layout applies to the whole subtree, so every frontend route reads live CMS
  content instead of being frozen into the build. Do not remove it.
- `<html>` carries `data-scroll-behavior="smooth"`. Next 16 no longer suspends global smooth
  scrolling during route transitions unless this attribute is present — without it, paginating
  smooth-scrolls the whole page instead of jumping.
- `params` and `searchParams` are **Promises** and must be awaited.
- Rich text renders through `RichText` from `@payloadcms/richtext-lexical/react`; Markdown
  renders through `src/components/Markdown.tsx` (`react-markdown` + `remark-gfm`). Raw HTML is
  deliberately **not** enabled, so CMS content cannot inject markup.

## Styling

Tailwind CSS v4, configured entirely in `src/app/(frontend)/styles.css` — `@import 'tailwindcss'`,
`@plugin '@tailwindcss/typography'`, an `@theme` block for fonts, and a small `@layer base`.
There is no `tailwind.config.js`; PostCSS is wired up in `postcss.config.mjs`.

- Utility classes in JSX only; no CSS modules or styled-components.
- Every surface must work in light **and** dark mode — pair colours with a `dark:` variant.
- Mobile-first responsive utilities; long-form text sits in `prose` / `dark:prose-invert`.
- Interactive elements need a visible `focus-visible:` ring, and icons need an accessible name
  on the surrounding control (icons themselves are `aria-hidden`).
- Anchor targets use `scroll-mt-24` to clear the fixed 4rem navigation bar.

## Testing

**Unit / integration — `tests/int/*.int.spec.{ts,tsx}` (Vitest + React Testing Library, jsdom).**

- Schema specs assert collection/global config: slug, access, `useAsTitle`, field types,
  `required` flags and validators. Use the helpers in `tests/helpers/payloadFields.ts`
  (`getField` flattens `row`/`collapsible` containers).
- Component specs render presentational components with fixtures from `tests/helpers/fixtures.ts`
  and query by role/label rather than class names.
- `fileParallelism: false` is set deliberately — parallel spec files raced Payload's dev schema
  push against the one SQLite file and failed intermittently on cold runs.
- `vitest.setup.ts` registers `afterEach(cleanup)` explicitly, because `globals` is off and RTL
  cannot auto-register it.

**End-to-end — `tests/e2e/*.e2e.spec.ts` (Playwright, Chromium).**

- `playwright.config.ts` boots `bun run dev` and runs with `workers: 1`: the specs share one
  SQLite file with the dev server and seed shared globals, so they must not interleave.
- Seed through `tests/helpers/seedContent.ts`. It snapshots a global before overwriting it and
  restores it in `afterAll`, and collection fixtures use `test-`-prefixed slugs that the
  matching `cleanup*` helper deletes. **Never leave seeded rows behind** — this runs against the
  developer's own database.
- The SQLite adapter sets `wal: true` and `busyTimeout: 10_000` in `src/payload.config.ts` so the
  dev server and test process can hold the file at once. Do not remove them.

### Admin customisations

`Projects.skills` renders through `src/components/admin/SkillsTagInput.tsx` instead of the stock
relationship field: an editor types a skill name and either picks the one that exists or presses
Enter to create it inline, with no "+" button or document drawer. The field still stores an array
of `skills` ids, so the API and the frontend are unaffected.

- The selection logic lives in `src/lib/skillOptions.ts` (`resolveSkillSelection` and friends) so
  it can be unit tested without rendering the admin panel; matching is case- and
  whitespace-insensitive, which is what stops "react"/"React" both being created in a collection
  whose `title` is unique.
- Payload's creatable `ReactSelect` probes the field's `filterOption` with a `null` option when
  Enter is pressed, to decide whether to turn the raw text into a value. The component declines
  that probe on purpose: it hands Enter back to react-select so a partial name selects the
  highlighted skill rather than creating a skill with the partial name.
- A custom `Field` component must be in the import map like any rich text editor —
  `bun run generate:importmap`, and `tests/int/importMap.int.spec.ts` guards it.

## Gotchas

- Payload's Local API bypasses access control unless you pass `overrideAccess: false`.
- Relationship fields come back as bare ids at `depth: 0` — query with `depth: 1` before
  reading `.title` or `.url`, or filter through `src/lib/media.ts`.
- Adding a collection makes Drizzle rebuild `payload_locked_documents_rels`. If a push aborts
  with `no such column: <x>_id` and leaves a `__new_*` table behind, that table only tracks admin
  document locks: drop the orphan and the empty original and let the next push recreate it.
- `next dev` rewrites the `nextjs-agent-rules` block in `CLAUDE.md`; commit it rather than
  fighting it.
