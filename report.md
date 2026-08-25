# Implementation Report

This report tracks the tasks defined in `instructions.md`.

---

## Task 1: Fix Broken Lint Error

**Status:** Completed

### Summary of changes

`bun run lint` crashed with `TypeError: Converting circular structure to JSON` before linting
a single file. The root cause was `eslint.config.mjs` loading `next/core-web-vitals` and
`next/typescript` through `FlatCompat.extends()`. As of `eslint-config-next@16`, those entry
points already export **flat** config arrays, so pushing them back through the legacy
eslintrc compatibility layer made `@eslint/eslintrc` try to `JSON.stringify` a plugin object
graph that contains circular references (`eslint-plugin-react`).

- Replaced `FlatCompat` with direct ESM imports of `eslint-config-next/core-web-vitals` and
  `eslint-config-next/typescript`, spreading the flat arrays into the config.
- Extended the `ignores` list with generated/report output (`playwright-report/`,
  `test-results/`, the generated admin `importMap.js`).
- Cleared the 5 remaining lint warnings so the run is completely clean:
  - `src/app/my-route/route.ts`: removed the unused `request` parameter and actually used the
    `payload` instance (returns a user count) instead of leaving it dangling.
  - `tests/e2e/admin.e2e.spec.ts`, `tests/e2e/frontend.e2e.spec.ts`: dropped unused `testInfo`
    parameters and the unused module-scoped `page` variable in the frontend spec.
- Added `.prettierignore` so formatting skips lockfiles, generated Payload files and test output.

### Files modified / created

- `eslint.config.mjs` (modified)
- `src/app/my-route/route.ts` (modified)
- `tests/e2e/admin.e2e.spec.ts` (modified)
- `tests/e2e/frontend.e2e.spec.ts` (modified)
- `tsconfig.json` (formatted by Prettier)
- `.prettierignore` (created)

### Test verification

| Check              | Command                   | Result                        |
| ------------------ | ------------------------- | ----------------------------- |
| Lint               | `bun run lint`            | Passes — 0 errors, 0 warnings |
| Unit / integration | `bun run test:int`        | 1 file, 1 test passed         |
| Format             | `bunx prettier --write .` | Clean                         |

No new tests were required for this task (it is a tooling/configuration fix); the existing
integration suite was re-run to confirm nothing regressed.

---

## Task 2: Update Packages to Latest Compatible Versions

**Status:** Completed

### Summary of changes

Audited with `bun outdated` and bumped every dependency that could move without breaking the
Payload 3.88 / Next 16 / React 19 alignment.

**Updated**

| Package                  | From    | To      |
| ------------------------ | ------- | ------- |
| `next`                   | 16.3.0  | 16.3.2  |
| `react`, `react-dom`     | 19.2.6  | 19.2.8  |
| `sharp`                  | 0.34.2  | 0.35.3  |
| `dotenv`                 | 16.4.7  | 17.4.2  |
| `cross-env`              | ^7.0.3  | ^10.1.0 |
| `@playwright/test`       | 1.58.2  | 1.62.1  |
| `@testing-library/react` | 16.3.0  | 16.3.2  |
| `@types/node`            | 22.19.9 | 24.11.1 |
| `@types/react`           | 19.2.14 | 19.2.18 |
| `@types/react-dom`       | 19.2.3  | 19.2.5  |
| `@vitejs/plugin-react`   | 4.5.2   | 5.2.0   |
| `eslint-config-next`     | 16.3.0  | 16.3.2  |
| `jsdom`                  | 28.0.0  | 30.0.1  |
| `tsx`                    | 4.22.4  | 4.23.12 |
| `typescript`             | 5.7.3   | 5.9.3   |
| `vite-tsconfig-paths`    | 6.0.5   | 6.1.1   |
| `vitest`                 | 4.0.18  | 4.1.11  |

**Deliberately held back** (upgrading would break compatibility):

- `typescript` — pinned to the latest 5.x (5.9.3). TypeScript 7 is out but the instructions
  require `< 6`, and `typescript-eslint@8` declares `typescript: >=4.8.4 <6.1.0`.
- `graphql` — held at 16.x; `payload` and `@payloadcms/next` both declare `graphql: ^16.8.1`.
- `eslint` — held at 9.x. `eslint-config-next@16` still targets ESLint 9, and the Next-owned
  plugin set (`eslint-plugin-react`, `eslint-plugin-jsx-a11y`) is not yet validated on 10.
- `@vitejs/plugin-react` — 6.1.0 was installed first, but it declares `vite: ^8.0.0` and
  reaches for the `vite/internal` subpath. Vitest 4 ships Vite 7.3.6, so the test runner failed
  with `ERR_PACKAGE_PATH_NOT_EXPORTED`. Pinned to 5.2.0, the newest release whose peer range
  includes Vite 7.
- `@types/node` — 24.x matches the Node 24 runtime in use rather than jumping to 26.x.

**Also changed**

- `package.json`: `engines` now reads `node >= 20.9.0` (Next 16 and Payload 3 both require it —
  the old `^18.20.2` claim was already untrue) and the stale `pnpm` engine constraint was
  dropped, since this project standardises on Bun. Dependency keys sorted; placeholder
  description replaced.
- `package.json`: `test` script now runs `bun run test:int && bun run test:e2e` instead of
  invoking pnpm.
- `playwright.config.ts`: `webServer.command` changed from `pnpm dev` to `bun run dev`, so the
  E2E suite can actually boot a dev server on a Bun-only machine.
- `CLAUDE.md`: `next dev` appends a Next.js agent-rules block to this file automatically;
  committed as-is so the working tree stays clean.

### Files modified / created

- `package.json` (modified)
- `bun.lock` (modified)
- `playwright.config.ts` (modified)
- `CLAUDE.md` (modified — generated by `next dev`)

### Test verification

| Check              | Command            | Result                                    |
| ------------------ | ------------------ | ----------------------------------------- |
| Build              | `bun run build`    | Compiled successfully, 7 routes generated |
| Lint               | `bun run lint`     | 0 errors, 0 warnings                      |
| Unit / integration | `bun run test:int` | 1 file, 1 test passed                     |
| E2E                | `bun run test:e2e` | 4 tests passed                            |

E2E was run beyond the task's stated requirements to confirm the `pnpm dev` → `bun run dev`
webServer switch works end to end.

---

## Task 3: Add Footer Global

**Status:** Completed

### Summary of changes

- Created the `footer` global in `src/globals/Footer.ts` with:
  - `copyright` — text field for the copyright line.
  - `socialLinks` — array field, each row holding a required `platform` select
    (`GitHub`, `LinkedIn`, `Facebook`, `Twitter`, `X`, stored as lowercase values so the
    frontend can map them straight to icons) and a required `url` text field.
  - A `validate` function on `url` that rejects blanks, relative URLs and non-`http(s)`
    protocols with actionable messages.
  - `access.read: () => true` so the frontend and REST API can read the footer without auth.
- Registered the global under `globals: [Footer]` in `src/payload.config.ts`.
- Ran `bun run generate:types`; `src/payload-types.ts` now exports the `Footer` and
  `FooterSelect` interfaces and lists `footer` in `Config['globals']`.
- Added `tests/helpers/payloadFields.ts`, small typed helpers (`getField`, `getSubField`,
  `optionValues`) for asserting on Payload field configs — reused by later schema tasks.

### Files modified / created

- `src/globals/Footer.ts` (created)
- `src/payload.config.ts` (modified)
- `src/payload-types.ts` (regenerated)
- `tests/helpers/payloadFields.ts` (created)
- `tests/int/footer.global.int.spec.ts` (created)

### Test verification

| Check              | Command                   | Result                  |
| ------------------ | ------------------------- | ----------------------- |
| Unit / integration | `bun run test:int`        | 2 files, 9 tests passed |
| Lint               | `bun run lint`            | 0 errors, 0 warnings    |
| Format             | `bunx prettier --write .` | Clean                   |

The new spec covers the slug, public read access, registration in the built config, the
copyright field type, the array shape, the exact platform option list, both `required` flags,
and every branch of the URL validator. No E2E test applies yet — the footer is not rendered
until Task 4.

---

## Task 4: Update Site Layout to Display Footer

**Status:** Completed

### Summary of changes

**Tailwind CSS brought online.** The Tailwind v4 packages were already installed but nothing
was wired up — there was no PostCSS config and `styles.css` was the plain-CSS template
stylesheet. Added `postcss.config.mjs` registering `@tailwindcss/postcss` and replaced
`src/app/(frontend)/styles.css` with a Tailwind entrypoint (`@import 'tailwindcss'`) that also
sets the font tokens, enables `scroll-behavior: smooth` with `scroll-padding-top` for the fixed
nav added in Task 8, and honours `prefers-reduced-motion`. Verified the generated bundle
actually contains the utilities (`.mt-16{margin-top:calc(var(--spacing) * 16)}`).

**Footer.**

- `src/components/SocialIcon.tsx` — inline `currentColor` brand glyphs for all five platforms
  plus a `platformLabels` map. Icons are `aria-hidden`; the accessible name lives on the link.
- `src/components/Footer.tsx` — purely presentational, takes `copyright` / `socialLinks` props
  (typed from the generated `Footer` interface) so it is trivially unit-testable. Responsive
  (stacked on mobile, split row from `sm:` up), dark-mode aware, with visible focus rings.
  Falls back to `© <current year> All rights reserved.` when the global is unseeded or the
  copyright is blank/whitespace, and drops link rows with an empty URL.
- `src/lib/payload.ts` — shared `getPayloadClient()` Local API helper.
- `src/lib/globals.ts` — `getFooter()`, which returns `null` if the global cannot be read so an
  unseeded database renders defaults instead of erroring.
- `src/app/(frontend)/layout.tsx` — fetches the footer via the Local API and renders `<Footer />`
  below a `flex-1` `<main>`, so the footer sits at the bottom on short pages.

**Rendering mode.** With the template's `headers()` call gone, Next prerendered `/` as static
content, which would have baked CMS content into the build. Added
`export const dynamic = 'force-dynamic'` to the frontend layout — route segment config in a
layout applies to the whole subtree, so every frontend route now reads live content.

**Home page** was restyled with Tailwind as a minimal placeholder (the template markup depended
on the deleted CSS). Tasks 6, 8, 13 and 17 replace it with real content.

**Test harness.** Added `@testing-library/jest-dom` and `@testing-library/user-event`, widened
the Vitest `include` glob to `*.int.spec.{ts,tsx}` so RTL component specs are picked up, and
registered an explicit `afterEach(cleanup)` in `vitest.setup.ts` — with `globals: false`, RTL
cannot auto-register cleanup and renders were leaking between tests.

**Bug fixed from Task 3.** `bun run build` type-checks the test folder and caught that
`NamedField` in `tests/helpers/payloadFields.ts` included `UIField`, which has no `required`
property. Narrowed the type with `Exclude<…, UIField>` and made the `hasName` guard check
`field.type !== 'ui'` so the predicate is actually sound.

### Files modified / created

- `postcss.config.mjs` (created)
- `src/app/(frontend)/styles.css` (rewritten for Tailwind)
- `src/app/(frontend)/layout.tsx` (modified)
- `src/app/(frontend)/page.tsx` (restyled placeholder)
- `src/components/Footer.tsx`, `src/components/SocialIcon.tsx` (created)
- `src/lib/payload.ts`, `src/lib/globals.ts` (created)
- `vitest.config.mts`, `vitest.setup.ts`, `package.json`, `bun.lock` (modified)
- `tests/helpers/payloadFields.ts` (fixed typing)
- `tests/helpers/seedContent.ts` (created)
- `tests/int/footer.component.int.spec.tsx` (created)
- `tests/e2e/footer.e2e.spec.ts` (created)
- `tests/e2e/frontend.e2e.spec.ts` (updated for the new title/heading)

### Test verification

| Check              | Command            | Result                                       |
| ------------------ | ------------------ | -------------------------------------------- |
| Unit / integration | `bun run test:int` | 3 files, 14 tests passed                     |
| E2E                | `bun run test:e2e` | 5 tests passed                               |
| Build              | `bun run build`    | Success, `/` correctly listed as dynamic (ƒ) |
| Lint               | `bun run lint`     | 0 errors, 0 warnings                         |

Unit tests cover the copyright, all three seeded social links (href/target/rel and accessible
names), the unseeded fallback, the whitespace-only fallback, and URL-less rows. The new E2E
spec seeds the footer global via the Local API, asserts the footer and each social link are
visible on the home page, then restores the global's previous value in `afterAll` so the
developer's own content is never clobbered.

---

## Task 5: Add Bio Global

**Status:** Completed

### Summary of changes

- Created the `bio` global in `src/globals/Bio.ts`:
  - `title` — required text, the author's name (labelled "Name" in admin).
  - `subtitle` — optional text, e.g. "Software Engineer".
  - `shortPhrase` — optional single-line tagline.
  - `aboutMe` — `richText`, which inherits the Lexical editor configured on the root config.
  - `access.read: () => true`, matching the Footer global, so the frontend can read it.
- Registered it in `src/payload.config.ts` as `globals: [Bio, Footer]`.
- Ran `bun run generate:types`; `src/payload-types.ts` now exports `Bio` / `BioSelect` with the
  Lexical `aboutMe` node tree typed.

### Files modified / created

- `src/globals/Bio.ts` (created)
- `src/payload.config.ts` (modified)
- `src/payload-types.ts` (regenerated)
- `tests/int/bio.global.int.spec.ts` (created)

### Test verification

| Check              | Command             | Result                   |
| ------------------ | ------------------- | ------------------------ |
| Unit / integration | `bun run test:int`  | 4 files, 22 tests passed |
| Types              | `bunx tsc --noEmit` | Clean                    |
| Lint               | `bun run lint`      | 0 errors, 0 warnings     |

The spec asserts the slug, public read access, registration in the built config, that `title`
is required, that `subtitle`/`shortPhrase` are optional text fields, that `aboutMe` is
`richText`, and that Payload injected the root Lexical editor into it. Rendering (and its E2E
coverage) follows in Task 6.

---

## Task 6: Display Bio on Home Page

**Status:** Completed

### Summary of changes

- Added `@tailwindcss/typography` and registered it in `src/app/(frontend)/styles.css` with
  `@plugin '@tailwindcss/typography'` (the Tailwind v4 way), so rich text and — later —
  Markdown get sensible prose styling in both colour schemes.
- `src/lib/globals.ts`: added `getBio()`. It treats a global with no `title` as "not seeded"
  and returns `null`, because Payload creates an empty global row as soon as it is registered.
- `src/components/BioSection.tsx`: presentational hero (name as `<h1>`, subtitle, short phrase)
  plus an "About me" block that renders the Lexical state through `RichText` from
  `@payloadcms/richtext-lexical/react` with `prose`/`dark:prose-invert` classes. Optional
  fields are omitted entirely when empty. The section carries `id="about"` with
  `scroll-mt-24`, ready for the Task 8 navigation menu.
- `src/app/(frontend)/page.tsx`: fetches the `bio` global via the Local API and renders
  `<BioSection />`, falling back to an admin-panel call-to-action when the global is unseeded.
  Added `generateMetadata()` so the page title becomes `"<Name> — <Subtitle>"` and the
  description the short phrase.
- `tests/helpers/lexical.ts`: `lexicalParagraphs()` builds a minimal valid Lexical editor state
  for seeding and asserting rich text without instantiating the editor.

**E2E infrastructure fix.** The suite started failing with
`LibsqlError: SQLITE_BUSY: database is locked`. Playwright defaults to one worker per two CPUs,
and every spec file spins up its own Payload client that runs a dev schema push against the
same SQLite file the dev server already holds open. Set `workers: 1` in `playwright.config.ts` —
the specs also mutate shared globals, so they must not interleave regardless. Also reduced
`tests/e2e/frontend.e2e.spec.ts` to a content-independent smoke test (page 200s, has an `h1`,
has a footer) now that `home.e2e.spec.ts` covers the real home page content.

### Files modified / created

- `src/components/BioSection.tsx` (created)
- `src/app/(frontend)/page.tsx` (rewritten)
- `src/app/(frontend)/styles.css`, `src/lib/globals.ts` (modified)
- `package.json`, `bun.lock` (added `@tailwindcss/typography`)
- `playwright.config.ts` (modified — `workers: 1`)
- `tests/helpers/lexical.ts` (created)
- `tests/helpers/seedContent.ts` (added the bio fixture/seed/restore)
- `tests/int/bio.component.int.spec.tsx` (created)
- `tests/e2e/home.e2e.spec.ts` (created)
- `tests/e2e/frontend.e2e.spec.ts` (simplified to a smoke test)

### Test verification

| Check              | Command            | Result                   |
| ------------------ | ------------------ | ------------------------ |
| Unit / integration | `bun run test:int` | 5 files, 27 tests passed |
| E2E                | `bun run test:e2e` | 7 tests passed           |
| Build              | `bun run build`    | Success                  |
| Lint               | `bun run lint`     | 0 errors, 0 warnings     |

Unit tests cover the `h1` name, subtitle, short phrase, both rendered rich text paragraphs, the
omission of empty optional blocks, and the `#about` anchor. E2E seeds the bio global, asserts
the hero and About me content render on `/`, checks the generated page title, and restores the
previous global value afterwards.

---

## Task 7: Add Work Experience Collection

**Status:** Completed

### Summary of changes

- Created `src/collections/WorkExperience.ts` (slug `work-experience`) with:
  - `jobTitle`, `company` — required text.
  - `companyUrl` — optional text, validated as an absolute `http(s)` URL when present.
  - `location` — optional text.
  - `startYear` (required) and `endYear` (optional) — `number` fields laid out side by side in a
    `row`, both validated as whole years within 1950…currentYear + 10. An empty `endYear` is
    explicitly allowed and documented as meaning "Present".
  - `jobDescription` — required `richText` using the root Lexical editor.
  - `access.read: () => true`, `admin.useAsTitle: 'jobTitle'`, useful `defaultColumns`, and
    `defaultSort: '-startYear'` so the admin list and API default to newest-first.
- Registered it in `src/payload.config.ts` under `collections`.
- Ran `bun run generate:types`; `WorkExperience` and `WorkExperienceSelect` are now in
  `src/payload-types.ts`.
- Extended `tests/helpers/payloadFields.ts` with `flattenFields()`, which expands `row` and
  `collapsible` containers. Those group fields visually without creating a data namespace, so
  `startYear`/`endYear` would otherwise have been invisible to `getField`.

### Files modified / created

- `src/collections/WorkExperience.ts` (created)
- `src/payload.config.ts` (modified)
- `src/payload-types.ts` (regenerated)
- `tests/helpers/payloadFields.ts` (added `flattenFields`)
- `tests/int/workExperience.collection.int.spec.ts` (created)

### Test verification

| Check              | Command             | Result                   |
| ------------------ | ------------------- | ------------------------ |
| Unit / integration | `bun run test:int`  | 6 files, 41 tests passed |
| Types              | `bunx tsc --noEmit` | Clean                    |
| Lint               | `bun run lint`      | 0 errors, 0 warnings     |

The spec covers the slug, public read access, config registration, `useAsTitle`/`defaultSort`,
every field's type and `required` flag, and both validators — valid years, fractional years,
2/5-digit typos, empty `endYear` meaning "Present", and the URL rules. Rendering and its E2E
coverage land in Task 8.

---

## Task 8: Display Work Experience on Home Page with Animated Nav Menu

**Status:** Completed

### Summary of changes

- `src/lib/collections.ts`: `getWorkExperience()` queries the collection sorted
  `['-startYear', '-endYear']`, so current roles (no end year) sit above finished roles that
  started the same year. Returns `[]` on failure rather than breaking the page.
- `src/lib/navigation.ts`: the menu is data-driven (`navItems`) so Tasks 13 and 17 can extend it.
  `navHref()` returns a bare `#id` on the home page (letting the browser smooth-scroll) and
  `/#id` from any other route, so the menu keeps working on `/projects` and `/blog`.
- `src/components/Nav.tsx` (client component): fixed, full-width, blurred translucent bar.
  - Click handler calls `scrollIntoView({ behavior: 'smooth' })` and syncs the hash with
    `history.replaceState`, degrading to `behavior: 'auto'` when the visitor has
    `prefers-reduced-motion: reduce`.
  - An `IntersectionObserver` (with a `-20% 0px -70% 0px` root margin so the "current" section is
    the one near the top of the viewport) tracks which section is on screen and marks that link
    with `aria-current="true"`, animated via a scaling underline. The observer is guarded for
    environments without `IntersectionObserver` and disconnected on unmount.
- `src/components/ExperienceList.tsx`: presentational vertical timeline with a `<ol>`/`<li>`
  structure, dot markers, the company optionally linked, location, the year range and the
  Lexical description. Exported `formatYearRange()` handles "2019 — Present", closed ranges and
  single-year roles. Renders `null` when there is nothing to show. Section id `experience`.
- `src/app/(frontend)/layout.tsx`: renders `<Nav />` and adds `pt-16` to `<main>` so content
  clears the fixed bar.
- `src/app/(frontend)/page.tsx`: fetches the bio and the experience list concurrently with
  `Promise.all` and renders the timeline under the bio.

**E2E infrastructure fix (SQLITE_BUSY).** Even with `workers: 1`, seeding kept failing with
`LibsqlError: SQLITE_BUSY: database is locked` — the Playwright process and the Next dev server
hold the same SQLite file open, and `busyTimeout` defaults to `0`, so the loser of any write
race fails instantly instead of waiting. Configured the adapter with `wal: true` (readers and
writers no longer block each other) and `busyTimeout: 10_000`. This is the adapter's documented
mechanism for exactly this situation, and it benefits `bun run dev` alongside `bun run test:int`
too. Added the `-wal` / `-shm` sidecar files to `.gitignore`.

### Files modified / created

- `src/components/Nav.tsx`, `src/components/ExperienceList.tsx` (created)
- `src/lib/collections.ts`, `src/lib/navigation.ts` (created)
- `src/app/(frontend)/layout.tsx`, `src/app/(frontend)/page.tsx` (modified)
- `src/payload.config.ts` (WAL + busy timeout)
- `.gitignore` (SQLite sidecar files)
- `tests/helpers/fixtures.ts` (created — `makeExperience`, `richText`)
- `tests/helpers/seedContent.ts` (work experience seed/cleanup)
- `tests/int/experienceList.int.spec.tsx`, `tests/int/nav.int.spec.tsx` (created)
- `tests/e2e/experience.e2e.spec.ts` (created)

### Test verification

| Check              | Command            | Result                                          |
| ------------------ | ------------------ | ----------------------------------------------- |
| Unit / integration | `bun run test:int` | 8 files, 59 tests passed                        |
| E2E                | `bun run test:e2e` | 9 tests passed (run twice to confirm stability) |
| Build              | `bun run build`    | Success                                         |
| Lint               | `bun run lint`     | 0 errors, 0 warnings                            |

Unit tests cover `formatYearRange` (all three shapes), the timeline fields, linked vs. plain
company, omitted location, preserved order, the `#experience` anchor and the empty state; and
for the nav: link hrefs on and off the home page, smooth scrolling, the reduced-motion
fallback, active-section highlighting through a fake `IntersectionObserver`, observer teardown,
and that observation is skipped off the home page. The E2E spec seeds two roles, asserts the
timeline renders newest-first with the right company link and year ranges, then clicks each
menu item and asserts the target section is in the viewport, `window.scrollY` moved, the active
link is marked, and the fixed menu is still visible after scrolling.

---

## Task 9: Add Skill Collection

**Status:** Completed

### Summary of changes

- Created `src/collections/Skills.ts` (slug `skills`) with a single `title` field that is
  `required`, `unique` and `index`ed — uniqueness stops the same technology being created twice
  from the Projects relationship field's inline-create, and the index keeps autocomplete
  lookups cheap.
- `admin.useAsTitle: 'title'` as required, plus `defaultColumns` and `defaultSort: 'title'` so
  the admin list reads alphabetically.
- `access.read: () => true`, consistent with the other public content.
- Registered in `src/payload.config.ts` and ran `bun run generate:types` (adds the `Skill`
  interface — Payload singularises the slug for the type name).

### Files modified / created

- `src/collections/Skills.ts` (created)
- `src/payload.config.ts` (modified)
- `src/payload-types.ts` (regenerated)
- `tests/int/skills.collection.int.spec.ts` (created)

### Test verification

| Check              | Command             | Result                   |
| ------------------ | ------------------- | ------------------------ |
| Unit / integration | `bun run test:int`  | 9 files, 64 tests passed |
| Types              | `bunx tsc --noEmit` | Clean                    |
| Lint               | `bun run lint`      | 0 errors, 0 warnings     |

The spec asserts the slug, public read access, config registration, `useAsTitle`, the default
sort, and that `title` is text/required/unique/indexed.

---

## Task 10: Add Projects Collection

**Status:** Completed

### Summary of changes

- Created `src/collections/Projects.ts` (slug `projects`) with `title`, `slug` (required,
  unique, indexed), `summary`, `description` (required Lexical rich text), optional
  `externalLink` / `githubLink`, a required `skills` relationship (`hasMany`, inline create and
  edit enabled so new skills can be added straight from the project form), an optional `images`
  relationship to `media` (`hasMany`, sortable — the first image becomes the card thumbnail),
  and a `highlight` checkbox defaulting to `false`, placed in the admin sidebar.
- A `beforeValidate` hook on `slug` derives the slug from the title when it is left blank and
  normalises anything typed by hand, so editors cannot accidentally create an invalid URL.
- Registered in `src/payload.config.ts` and regenerated types (`Project`, `ProjectSelect`).

**Refactor.** This was the third field needing URL validation, so the duplicated validators were
extracted into `src/lib/validation.ts` (`requiredUrl`, `optionalUrl`, `yearValidator`,
`validateSlug`) and `src/lib/slug.ts` (`slugify`, which also folds accents via NFKD).
`src/globals/Footer.ts` and `src/collections/WorkExperience.ts` now use the shared helpers;
their existing tests continued to pass unchanged.

**Local database repair (no code change).** Registering `projects` made Drizzle's SQLite dev
push rebuild `payload_locked_documents_rels` to add the `projects_id` foreign key. Its generated
copy statement selects `projects_id` _from the old table_, which does not have it yet, so the
push aborted with `SQLITE_ERROR: no such column: projects_id` and left an orphaned
`__new_payload_locked_documents_rels` behind. That table only tracks admin document locks and
was empty, so after backing the file up I dropped the orphan and the empty table and let the
next push recreate it. Verified afterwards that `payload_locked_documents_rels` exists with all
nine columns including `projects_id`. A fresh clone with no database file is unaffected, since
everything is then created in one pass.

### Files modified / created

- `src/collections/Projects.ts` (created)
- `src/lib/validation.ts`, `src/lib/slug.ts` (created)
- `src/globals/Footer.ts`, `src/collections/WorkExperience.ts` (refactored onto shared helpers)
- `src/payload.config.ts` (modified)
- `src/payload-types.ts` (regenerated)
- `tests/int/projects.collection.int.spec.ts` (created)

### Test verification

| Check              | Command             | Result                    |
| ------------------ | ------------------- | ------------------------- |
| Unit / integration | `bun run test:int`  | 10 files, 83 tests passed |
| Types              | `bunx tsc --noEmit` | Clean                     |
| Lint               | `bun run lint`      | 0 errors, 0 warnings      |

The spec covers `slugify` (punctuation, accents, trimming), config registration, public read
access, every field's type and `required` flag, slug uniqueness/indexing, the slug hook (derive
from title, normalise a hand-typed value, no-op when there is nothing to derive from), slug
validation (rejecting uppercase, spaces, doubled and leading hyphens), both optional URL fields,
the skills relationship including `allowCreate`, the optional images relationship, and the
`highlight` default.

---

## Task 11: Add Single Project Page (`/projects/:slug`)

**Status:** Completed

### Summary of changes

- `src/lib/collections.ts`: `getProjectBySlug()` queries by slug with `depth: 1` so the `skills`
  and `images` relationships come back populated, and returns `null` when nothing matches.
- `src/lib/media.ts`: `populatedMedia()` / `firstImage()` filter relationship entries down to the
  ones that were actually populated, so a `depth: 0` query can never crash a component.
- `src/components/Icons.tsx`: shared stroke icons (external link, chevrons).
- `src/components/SkillBadges.tsx`: renders the populated skills relationship as a labelled
  badge list.
- `src/components/ProjectGallery.tsx` (client component): image carousel built on `next/image`
  with previous/next buttons and indicator dots. Index arithmetic wraps in both directions, the
  active dot is marked `aria-current`, the whole thing is labelled
  `aria-roledescription="carousel"`, and an `aria-live="polite"` "Image N of M" region announces
  movement. Controls are hidden entirely for a single image, and nothing renders for none.
- `src/components/ProjectDetail.tsx`: title, summary, "Visit project" button with the outbound
  icon, "View source" button with the GitHub glyph, skill badges, the gallery, the Lexical
  description in a `prose` block, and a "Back to projects" link.
- `src/app/(frontend)/projects/[slug]/page.tsx`: awaits the `params` promise (Next 16 App Router),
  calls `notFound()` for unknown slugs, and implements `generateMetadata()` returning the project
  title and summary.

### Files modified / created

- `src/app/(frontend)/projects/[slug]/page.tsx` (created)
- `src/components/ProjectDetail.tsx`, `ProjectGallery.tsx`, `SkillBadges.tsx`, `Icons.tsx` (created)
- `src/lib/media.ts` (created), `src/lib/collections.ts` (modified)
- `tests/helpers/fixtures.ts` (added `makeProject`, `makeSkill`, `makeMedia`)
- `tests/helpers/seedContent.ts` (added media/skill/project seeding and cleanup)
- `tests/int/projectDetail.int.spec.tsx`, `tests/e2e/project-detail.e2e.spec.ts` (created)

### Test verification

| Check              | Command            | Result                                         |
| ------------------ | ------------------ | ---------------------------------------------- |
| Unit / integration | `bun run test:int` | 11 files, 93 tests passed                      |
| E2E                | `bun run test:e2e` | 12 tests passed                                |
| Build              | `bun run build`    | Success — `/projects/[slug]` listed as dynamic |
| Lint               | `bun run lint`     | 0 errors, 0 warnings                           |

Unit tests cover the heading/summary/description, both link buttons and their omission, the
skill badges, the back link, and the carousel: no images, one image (no controls), forward and
backward stepping including wrap-around in both directions, jumping via a dot with the
`aria-current` marker, and the live-region position announcement. The E2E spec seeds a project
with three genuinely uploaded PNG media rows plus its skills, asserts the rendered page,
metadata, links and badges, drives the carousel in a real browser, asserts an unknown slug
returns HTTP 404, and deletes every seeded project/skill/media row afterwards.

---

## Task 12: Add Project List Page (`/projects`)

**Status:** Completed

### Summary of changes

- `src/lib/collections.ts`: `getProjects({ page, limit })` returns Payload's `PaginatedDocs`
  sorted newest-first with relationships populated; `PROJECTS_PER_PAGE` defaults to 9.
- `src/lib/pagination.ts`: reusable helpers, written so Task 16's year filter can share them.
  - `parsePositiveInt()` hardens the query params — missing, non-numeric, zero, negative,
    fractional and repeated (`?page=1&page=2`) values all fall back instead of reaching the DB.
  - `buildQueryUrl()` builds page links, dropping empty params and omitting `page=1` so the
    first page has one canonical URL.
  - `pageWindow()` produces the numbered pages with `null` marking an ellipsis.
- `src/components/Pagination.tsx`: Previous / numbered pages / Next, rendered as real `<Link>`s
  so pagination works without JavaScript and every page is shareable. The current page is
  `aria-current="page"`; the disabled end links are marked `aria-disabled` and removed from the
  tab order. Accepts a `params` prop to carry extra query params across pages.
- `src/components/ProjectCard.tsx`: thumbnail (first populated image) or a lettered gradient
  placeholder exposed as `role="img"` with a descriptive label, title linking to the detail
  page, summary, skill badges and compact Live / Code links.
- `src/components/ProjectGrid.tsx`: 1 / 2 / 3 column responsive grid with an empty state.
- `src/app/(frontend)/projects/page.tsx`: awaits the `searchParams` promise, reads `page` and
  `limit`, renders the grid, a result count and the pagination control.

**Two defects found and fixed while testing:**

1. `pageWindow()` emitted an ellipsis in place of a single skipped page (`[1, 2, …, 4]`), which
   is longer than just showing "3". It now renders the page number when the gap is exactly one
   and reserves the ellipsis for real gaps.
2. The E2E run surfaced a Next.js 16 warning: with `scroll-behavior: smooth` on `<html>` and no
   `data-scroll-behavior` attribute, Next 16 no longer suspends smooth scrolling during route
   transitions — so paginating would have _smooth-scrolled_ the whole page instead of jumping.
   Added `data-scroll-behavior="smooth"` to `<html>`, which restores instant route transitions
   while keeping the animated in-page anchor scrolling from Task 8.

### Files modified / created

- `src/app/(frontend)/projects/page.tsx` (created)
- `src/components/Pagination.tsx`, `ProjectCard.tsx`, `ProjectGrid.tsx` (created)
- `src/lib/pagination.ts` (created), `src/lib/collections.ts` (modified)
- `src/app/(frontend)/layout.tsx` (added `data-scroll-behavior`)
- `tests/helpers/seedContent.ts` (added `seedManyProjects`)
- `tests/int/pagination.int.spec.tsx`, `tests/int/projectGrid.int.spec.tsx` (created)
- `tests/e2e/projects-list.e2e.spec.ts` (created)

### Test verification

| Check              | Command            | Result                                  |
| ------------------ | ------------------ | --------------------------------------- |
| Unit / integration | `bun run test:int` | 13 files, 114 tests passed              |
| E2E                | `bun run test:e2e` | 14 tests passed                         |
| Build              | `bun run build`    | Success — `/projects` listed as dynamic |
| Lint               | `bun run lint`     | 0 errors, 0 warnings                    |

Unit tests cover every `parsePositiveInt` fallback, `buildQueryUrl` canonicalisation, all
`pageWindow` shapes (including both the single-gap and real-ellipsis cases), the `Pagination`
component (hidden for one page, prev/next targets, disabled ends, current-page marking, and
preserved extra params), and the grid (cards, detail links, thumbnail selection, placeholder,
optional links, empty state). The E2E spec seeds five projects, clicks through to a detail page,
then paginates at `limit=2` across all three pages verifying URLs, card counts, the active page
marker and both disabled end states.

---

## Task 13: Display Highlighted Projects on Home Page & Update Menu

**Status:** Completed

### Summary of changes

- `src/lib/collections.ts`: `getFeaturedProjects(limit = 5)` runs the highlighted-projects query
  and a `payload.count()` of all projects concurrently, returning `{ projects, totalProjects }`.
  The count is what decides whether a "View all projects" link is needed — the requirement is
  "more projects (highlighted or not) beyond what is displayed", so counting only highlighted
  ones would have hidden the link on a site with 5 highlighted and 20 total projects.
- `src/components/FeaturedProjects.tsx`: `#projects` section reusing `ProjectGrid`/`ProjectCard`
  (thumbnail, title link, summary, skills, external and GitHub links), with the "View all
  projects →" link shown only when `totalProjects > projects.length`.
  - When nothing is highlighted but projects exist, the section still renders with an
    explanatory empty state and the link to `/projects` — otherwise the new "Projects" menu item
    would scroll to a section that isn't in the document.
  - Renders nothing at all when there are no projects.
- `src/lib/navigation.ts`: added `{ id: 'projects', label: 'Projects' }`, so the fixed menu is
  now About / Experience / Projects. No change to `Nav` was needed — it is driven by that list.
- `src/app/(frontend)/page.tsx`: fetches the featured projects alongside the bio and experience
  in the existing `Promise.all` and renders the section.

### Files modified / created

- `src/components/FeaturedProjects.tsx` (created)
- `src/lib/collections.ts`, `src/lib/navigation.ts`, `src/app/(frontend)/page.tsx` (modified)
- `tests/int/featuredProjects.int.spec.tsx` (created)
- `tests/e2e/featured-projects.e2e.spec.ts` (created)

### Test verification

| Check              | Command            | Result                     |
| ------------------ | ------------------ | -------------------------- |
| Unit / integration | `bun run test:int` | 14 files, 121 tests passed |
| E2E                | `bun run test:e2e` | 17 tests passed            |
| Lint               | `bun run lint`     | 0 errors, 0 warnings       |

Unit tests cover the rendered cards and their detail links, the `#projects` anchor, both
branches of the "View all projects" link, the nothing-highlighted-but-projects-exist case, the
no-projects-at-all case, and the menu item order. The E2E spec seeds six highlighted projects,
asserts exactly five are featured, follows "View all projects" to `/projects`, clicks the
Projects menu item and asserts the section scrolls into view and is marked active, and follows
a featured card through to its detail page.

---

## Task 14: Add Blog Collection

**Status:** Completed

### Summary of changes

- Created `src/collections/Blog.ts` (slug `blog`) with:
  - `title` — required text.
  - `slug` — required, unique, indexed, with the same `beforeValidate` hook as Projects so it is
    derived from the title when blank and normalised when typed by hand.
  - `summary` — required `textarea` (a teaser is usually longer than one line).
  - `content` — required `code` field with `admin.language: 'markdown'`, giving Markdown
    syntax highlighting in the admin editor while storing a plain Markdown string.
  - `publishedAt` — required, indexed `date` in the sidebar, day-only picker, defaulting to now.
    Indexed because Task 16 filters and sorts by it.
  - `access.read: () => true`, `admin.useAsTitle: 'title'`, `defaultSort: '-publishedAt'`.
- Registered in `src/payload.config.ts` and ran `bun run generate:types` (`Blog`, `BlogSelect`).
- Verified the dev schema push applied cleanly this time — `blog_id` was added to
  `payload_locked_documents_rels` with a plain `ALTER TABLE`, no table rebuild and no orphaned
  `__new_*` table, so the Task 10 repair was not needed again.

### Files modified / created

- `src/collections/Blog.ts` (created)
- `src/payload.config.ts` (modified)
- `src/payload-types.ts` (regenerated)
- `tests/int/blog.collection.int.spec.ts` (created)

### Test verification

| Check              | Command             | Result                     |
| ------------------ | ------------------- | -------------------------- |
| Unit / integration | `bun run test:int`  | 15 files, 129 tests passed |
| Types              | `bunx tsc --noEmit` | Clean                      |
| Lint               | `bun run lint`      | 0 errors, 0 warnings       |

The spec covers the slug, public read access, config registration, `useAsTitle`/`defaultSort`,
each field's type and `required` flag, slug derivation and validation, the Markdown language
hint on `content`, and that `publishedAt` is indexed with a callable default producing a
parseable date.

---

## Task 15: Add Single Blog Page (`/blog/:slug`)

**Status:** Completed

### Summary of changes

- Added `react-markdown` and `remark-gfm` as dependencies.
- `src/lib/date.ts`: `formatPostDate()` renders "5 March 2026" and `postYear()` extracts the
  calendar year. Both format **in UTC** deliberately — posts are stored via a day-only picker
  (midnight UTC), and a timezone-dependent format would produce a different day on the server
  than in the browser and trip React's hydration check.
- `src/lib/collections.ts`: `getPostBySlug()`.
- `src/components/Markdown.tsx`: renders Markdown with GitHub-flavoured extensions (tables,
  strikethrough, task lists) inside a `prose` container. Raw HTML is _not_ enabled
  (`rehype-raw` is deliberately absent), so CMS content cannot inject markup. External links get
  `target="_blank"` + `rel="noopener noreferrer"` while internal links stay in place.
- `src/components/BlogPost.tsx`: back link, title, machine-readable `<time>` element, summary,
  divider and the rendered Markdown body.
- `src/app/(frontend)/blog/[slug]/page.tsx`: awaits `params`, `notFound()` on a miss, and
  `generateMetadata()` returning the title, summary and OpenGraph article metadata including
  `publishedTime`.

**Test-suite fix.** The integration suite intermittently failed on cold runs with a
`SQLITE_ERROR` raised inside `getPayload()` in `tests/int/api.int.spec.ts` — Vitest runs spec
files in parallel, and Payload's dev schema push is not safe to run concurrently against one
SQLite file. It never reproduced once the module cache was warm (5 consecutive clean runs), which
is exactly what makes it a nasty flake in CI. Set `fileParallelism: false` in
`vitest.config.mts`, mirroring the `workers: 1` decision already made for Playwright; a cold run
with `node_modules/.vite` deleted now passes.

### Files modified / created

- `src/app/(frontend)/blog/[slug]/page.tsx` (created)
- `src/components/BlogPost.tsx`, `src/components/Markdown.tsx` (created)
- `src/lib/date.ts` (created), `src/lib/collections.ts` (modified)
- `package.json`, `bun.lock` (react-markdown, remark-gfm)
- `vitest.config.mts` (`fileParallelism: false`)
- `tests/helpers/fixtures.ts` (added `makePost`)
- `tests/helpers/seedContent.ts` (blog post seeding/cleanup + year fixtures for Task 16)
- `tests/int/blogPost.int.spec.tsx`, `tests/e2e/blog-post.e2e.spec.ts` (created)

### Test verification

| Check              | Command            | Result                                        |
| ------------------ | ------------------ | --------------------------------------------- |
| Unit / integration | `bun run test:int` | 16 files, 140 tests passed (incl. a cold run) |
| E2E                | `bun run test:e2e` | 20 tests passed                               |
| Build              | `bun run build`    | Success — `/blog/[slug]` listed as dynamic    |
| Lint               | `bun run lint`     | 0 errors, 0 warnings                          |

Unit tests cover UTC date formatting and its empty/unparseable fallbacks, year extraction,
Markdown rendering of headings/emphasis/lists/GFM tables, external-vs-internal link handling,
the fact that raw `<script>` HTML is escaped rather than executed, and the post layout
including the `<time datetime>` attribute and the back link. The E2E spec seeds a post, asserts
the Markdown really became HTML elements (and that the raw `#` source is nowhere on the page),
checks the formatted date, title metadata and back link, and asserts an unknown slug 404s.

---

## Task 16: Add Blog List Page (`/blog`) with Year Filter & Pagination

**Status:** Completed

### Summary of changes

- `src/lib/collections.ts`:
  - `yearRange(year)` returns the UTC bounds of a calendar year as ISO strings.
  - `getPosts({ page, limit, year })` paginates newest-first, filtering with
    `publishedAt >= Jan 1 && publishedAt < Jan 1 next year` — a half-open range, so a post
    published on 31 December at 23:59 UTC lands in the right year and none can be double-counted.
  - `getPostYears()` collects the distinct publication years newest-first, using
    `select: { publishedAt: true }` so only that one column is fetched.
  - `getLatestPosts()` added here ready for Task 17.
- `src/lib/pagination.ts`: `parseYearParam()` accepts a year **only if it appears in the list of
  years that actually have posts**, so `?year=1999`, `?year=abc` and repeated params all fall
  back to "All" rather than rendering an empty page for a year that never existed.
- `src/components/YearFilter.tsx`: "All / 2026 / 2025 / …" pill links in a labelled `<nav>`, with
  the active one marked `aria-current`. Selecting a year drops any `page` param, since page 3 of
  "All" rarely exists within a single year.
- `src/components/BlogList.tsx`: post list with title link, machine-readable `<time>`, formatted
  date and summary, plus a customisable empty state.
- `src/app/(frontend)/blog/page.tsx`: reads `page`, `limit` and `year`, renders the filter, the
  list (with a year-specific empty message) and pagination that carries the `year` param through
  via the `params` prop added in Task 12.

### Files modified / created

- `src/app/(frontend)/blog/page.tsx` (created)
- `src/components/BlogList.tsx`, `src/components/YearFilter.tsx` (created)
- `src/lib/collections.ts`, `src/lib/pagination.ts` (modified)
- `tests/int/blogList.int.spec.tsx` (created)
- `tests/e2e/blog-list.e2e.spec.ts` (created)

### Test verification

| Check              | Command            | Result                     |
| ------------------ | ------------------ | -------------------------- |
| Unit / integration | `bun run test:int` | 17 files, 154 tests passed |
| E2E                | `bun run test:e2e` | 23 tests passed            |
| Lint               | `bun run lint`     | 0 errors, 0 warnings       |

Unit tests cover the UTC year bounds, every `parseYearParam` branch (absent, valid, junk,
fractional, a year with no posts, repeated params), the post list rendering and ordering, both
empty states, and the year filter (link set, hrefs, `aria-current` on All vs. a selected year,
and rendering nothing with no posts). The E2E spec seeds four posts across 2024–2026, asserts
newest-first ordering, filters to 2026 and checks the 2025 post disappears, returns to All, then
paginates at `limit=1` within the 2026 filter verifying the year survives the page change and
that Next is disabled on the last page of the filtered set.

---

## Task 17: Display Latest Blog Posts on Home Page

**Status:** Completed

### Summary of changes

- `src/components/LatestPosts.tsx`: `#blog` section reusing `BlogList` (title link, `<time>`,
  formatted date, summary) with a "View all blog posts →" link to `/blog`. Renders nothing when
  there are no posts, so the section never appears empty.
- `src/lib/navigation.ts`: appended `{ id: 'blog', label: 'Blog' }` — the fixed menu is now
  About / Experience / Projects / Blog, still driven entirely by that list.
- `src/app/(frontend)/page.tsx`: `getLatestPosts()` (added in Task 16, limit 5, sorted
  `-publishedAt`) joins the existing `Promise.all`, and the section renders below the projects.

**Test updated.** The Task 13 spec asserted the menu was _exactly_ `[about, experience,
projects]`, which this task legitimately extends. Loosened it to assert that Projects is present
and ordered after About and Experience — the exact list is asserted once, in the new
`latestPosts` spec, so adding a future menu item only touches one test.

### Files modified / created

- `src/components/LatestPosts.tsx` (created)
- `src/lib/navigation.ts`, `src/app/(frontend)/page.tsx` (modified)
- `tests/int/latestPosts.int.spec.tsx` (created)
- `tests/int/featuredProjects.int.spec.tsx` (nav assertion loosened)
- `tests/e2e/home-blog.e2e.spec.ts` (created)

### Test verification

| Check              | Command            | Result                     |
| ------------------ | ------------------ | -------------------------- |
| Unit / integration | `bun run test:int` | 18 files, 160 tests passed |
| E2E                | `bun run test:e2e` | 26 tests passed            |
| Build              | `bun run build`    | Success                    |
| Lint               | `bun run lint`     | 0 errors, 0 warnings       |

Unit tests cover the rendered posts, ordering, the archive link, the `#blog` anchor, the empty
case and the full menu order. The E2E spec seeds six posts and asserts only the five most recent
appear (the oldest is pushed off), follows "View all blog posts" to `/blog`, clicks the Blog
menu item and asserts the section scrolls into view and is marked active, and follows a post
link through to the post page.

---

## Task 18: Update Claude Skills & Documentation in `.claude`

**Status:** Completed

### Summary of changes

- **`CLAUDE.md` rewritten** as a short orientation file: the stack in one line, pointers to both
  skills, and the non-negotiables that are easy to get wrong (Bun over npm/pnpm, regenerating
  types after any schema change, Tailwind-only styling, tests + Prettier + ESLint on every
  change, and the fact that `bun run build` type-checks `tests/` too, so a green Vitest run alone
  does not prove the types are sound). The auto-generated `nextjs-agent-rules` block was
  preserved verbatim.
- **New skill `.claude/skills/code-art-website/SKILL.md`** — the project reference, covering:
  - Every command in a table (dev, build, `generate:types`, `generate:importmap`, both test
    suites, format, lint).
  - The full content model: `Bio` and `Footer` globals, and the `Users`, `Media`,
    `WorkExperience`, `Skills`, `Projects` and `Blog` collections with their fields and defaults.
  - Architecture: the `src/` tree, the `(frontend)` vs `(payload)` route groups, and the
    **"pages fetch, components render"** rule that makes the components unit-testable.
  - An inventory of every `src/lib` helper, so future work reuses `optionalUrl`,
    `parsePositiveInt`, `formatPostDate` and friends instead of re-implementing them.
  - The rendering decisions that are easy to break: `force-dynamic` on the frontend layout,
    `data-scroll-behavior="smooth"`, awaiting the `params`/`searchParams` promises, and Markdown
    rendering with raw HTML deliberately disabled.
  - Styling guidelines (Tailwind v4 CSS-first config, dark mode, focus rings, `scroll-mt-24`).
  - Testing guidance, including _why_ `fileParallelism: false`, `workers: 1`, the explicit RTL
    `cleanup` and the WAL/`busyTimeout` settings exist — so nobody "tidies" them away and
    reintroduces the flakes.
  - Gotchas: Local API access control, relationship `depth`, the Drizzle
    `payload_locked_documents_rels` rebuild failure and its fix, and the regenerated CLAUDE.md
    block.
- **`.claude/skills/payload/SKILL.md`**: added a note at the top pointing at the project skill
  first. The rest of that vendored reference was left intact.

### Verification

Documentation can drift from reality, so rather than only eyeballing it:

| Check                                                                                                                | Result                                                            |
| -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Markdown formatting (`bunx prettier --check "**/*.md"`)                                                              | All files match Prettier style                                    |
| Every `src/lib` helper named in the skill exists                                                                     | Verified by grepping all 26 documented exports — no misses        |
| Every config claim (`force-dynamic`, `fileParallelism: false`, `workers: 1`, `wal`, `busyTimeout`, `/media` ignored) | Verified against the actual files                                 |
| Skill is discoverable                                                                                                | `code-art-website` is registered and listed as an available skill |
| Unit / integration                                                                                                   | `bun run test:int` — 18 files, 160 tests passed                   |
| Lint                                                                                                                 | `bun run lint` — 0 errors, 0 warnings                             |

### Files modified / created

- `CLAUDE.md` (rewritten)
- `.claude/skills/code-art-website/SKILL.md` (created)
- `.claude/skills/payload/SKILL.md` (cross-reference added)

---

## Task 19: Update `README.md`

**Status:** Completed

### Summary of changes

Replaced the Payload blank-template README (which documented MongoDB, pnpm and a Cloud deploy
button that do not apply to this project) with documentation for what this repository actually
is:

- **Overview & tech stack** — a table covering Payload 3, Next.js 16 / React 19, Bun, SQLite via
  `@payloadcms/db-sqlite`, Tailwind v4 + typography, Lexical, `react-markdown`, Vitest + RTL,
  Playwright and the tooling.
- **Project structure** — an annotated tree of `src/` and `tests/`, plus tables listing every
  global and collection with its slug and purpose.
- **Setup & installation** — prerequisites (Bun 1.4+, Node 20.9+), `bun install`,
  `cp .env.example .env`, and how to generate `PAYLOAD_SECRET` with `openssl rand -hex 32`.
- **Running the project** — `bun run dev`, the site and `/admin` URLs, the first-run admin user,
  the note that the home page shows a placeholder until the Bio global has a name, and the
  production `build` / `start` pair.
- **Testing guide** — what each suite covers, how E2E seeding snapshots and restores content so a
  developer's own data survives, `bunx playwright install chromium`, and why both suites run
  serially.
- **Database & Payload commands** — `generate:types`, `generate:importmap`, `payload <command>`,
  the rule about never hand-editing `payload-types.ts`, dev schema push, and `devsafe`.
- **Code quality** — format/lint/build, and the Tailwind CSS-first configuration note.
- **Notes for contributors** — pointers to the `.claude` skills and the regenerated CLAUDE.md
  block.

Also updated **`.env.example`**, which still contained `DATABASE_URL=mongodb://127.0.0.1/...`.
The README instructs the reader to copy it, so leaving a MongoDB URL there would have made the
setup instructions actively wrong. It now shows the SQLite URL and how to generate the secret.

### Verification

| Check                                                     | Result                                                                                                                                          |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Markdown formatting (`bunx prettier --check "**/*.md"`)   | All files match Prettier style                                                                                                                  |
| Every script named in the README exists in `package.json` | All 11 verified (`dev`, `build`, `start`, `devsafe`, `test`, `test:int`, `test:e2e`, `generate:types`, `generate:importmap`, `payload`, `lint`) |
| Lint                                                      | `bun run lint` — 0 errors, 0 warnings                                                                                                           |
| Unit / integration                                        | `bun run test:int` — 18 files, 160 tests passed                                                                                                 |
| E2E                                                       | `bun run test:e2e` — 26 tests passed                                                                                                            |
| Build                                                     | `bun run build` — success                                                                                                                       |

### Files modified

- `README.md` (rewritten)
- `.env.example` (MongoDB URL replaced with the SQLite one)

### Known issue left in place (out of scope)

`docker-compose.yml` and `Dockerfile` are still blank-template artefacts: the compose file spins
up a **MongoDB** service and installs dependencies with **pnpm via corepack**, and the Dockerfile
only handles npm/yarn/pnpm lockfiles — none of which match this Bun + SQLite project. Neither
file is referenced by the new README, so following the documentation will not lead anyone into
them, but they would fail if used. Updating or removing them was outside the scope of Task 19,
so it is flagged here rather than changed silently.

---

## Fix: rich text editor missing from the admin panel

**Reported:** the rich text editor did not render when creating a Work Experience entry or
editing the Bio global.

### Root cause

`src/app/(payload)/admin/importMap.js` was never regenerated after the rich text fields were
added. It still contained the single entry the blank template shipped with:

```js
'@payloadcms/next/rsc#CollectionCards': CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1,
```

The admin panel resolves field components by looking their path up in that map. Payload's
sanitized config points every `richText` field at
`@payloadcms/richtext-lexical/rsc#RscEntryLexicalField`, and each toolbar feature at its own
`@payloadcms/richtext-lexical/client#*Client` component. With none of those keys present the
field resolved to nothing and rendered as an empty gap — **no error was shown in the admin UI**,
which is why the tasks passed their own verification.

The bug was mine, and it traces back to a gap in the instructions I wrote for myself: the
per-task lifecycle and `CLAUDE.md` both made `bun run generate:types` a non-negotiable but
mentioned `generate:importmap` only "for custom admin components". A `richText` field does not
look like a custom component, so the step was skipped. That framing is corrected below.

### The fix

`bun run generate:importmap` — the map went from 1 entry to 24.

### Scope: which fields were affected

| Field                           | Type       | Affected                                              |
| ------------------------------- | ---------- | ----------------------------------------------------- |
| `Bio.aboutMe`                   | `richText` | Yes — broken, now fixed                               |
| `WorkExperience.jobDescription` | `richText` | Yes — broken, now fixed                               |
| `Projects.description`          | `richText` | Yes — broken, now fixed (not reported, same cause)    |
| `Blog.content`                  | `code`     | No — bundled in `@payloadcms/ui`, never import-mapped |

`Projects.description` was broken by the same cause but had not been noticed. `Blog.content`
renders through Monaco, which ships inside `@payloadcms/ui` and is not resolved via the import
map, so it worked throughout; it is covered by a test now regardless.

`src/payload-types.ts` was checked by regenerating it — it was already up to date, so the import
map was the only stale generated file.

### Tests added

Both new suites were verified to **fail against the old import map and pass against the
regenerated one**, so they are real regression guards rather than tests written to pass.

- **`tests/int/importMap.int.spec.ts`** — walks the sanitized config (recursing through `row`,
  `collapsible`, `array`, `group`, `tabs` and `blocks`), collects the component path of every
  `richText` field, and asserts each one appears in the committed import map. It also asserts the
  Lexical field entry and the default toolbar's client components are present, and guards against
  a vacuous pass by requiring at least one rich text field to be found.
- **`tests/e2e/admin-editors.e2e.spec.ts`** — opens all three rich text fields in the real admin
  panel and asserts the editor is visible, accepts typing, and shows its inline toolbar on
  selection (the toolbar is a separate set of client components, so a partially stale map would
  give a typeable box with no controls). Also asserts the Blog markdown code editor mounts.
- **`tests/e2e/admin-views.e2e.spec.ts`** — the sweep for everything that had not been checked.
  The existing `admin.e2e.spec.ts` only ever exercised the `users` collection, which has no rich
  text field, which is why the whole class of bug slipped past it. This walks the list and create
  view of all six collections and both globals, asserts the expected fields are present, and
  fails on any uncaught exception or console error. All 14 views pass.

### Documentation corrected

`CLAUDE.md`, `.claude/skills/code-art-website/SKILL.md` and `README.md` now require **both**
generators after any collection/global/field change and explain that the import map is not only
for custom components — a stale map makes rich text fields render as nothing with no error shown.

### Unrelated pre-existing failure, also fixed

`bun run build` was failing before any of these changes, at clean `HEAD` (confirmed with a
`git stash` build):

```
tsconfig.json(3,5): error TS5101: Option 'baseUrl' is deprecated and will stop functioning in
TypeScript 7.0.
```

`package.json` floats TypeScript at `^6` and 6.0.3 promoted this deprecation to an error. Rather
than silence it with `ignoreDeprecations`, `baseUrl` was removed: both `paths` entries are
already written with a `./` prefix, so they resolve relative to the tsconfig directory and the
change is behaviour-preserving. `bunx tsc --noEmit` and the full build both pass.

### Test verification

| Check              | Result                                                     |
| ------------------ | ---------------------------------------------------------- |
| Guard fails on bug | Both new suites fail against the old import map — verified |
| Unit / integration | `bunx vitest run` — 19 files, 163 tests passed             |
| E2E                | `bun run test:e2e` — 44 tests passed                       |
| Lint               | `bun run lint` — 0 errors, 0 warnings                      |
| Formatting         | `bunx prettier --check .` — all files match                |
| Build              | `bun run build` — success                                  |

### Files modified / created

- `src/app/(payload)/admin/importMap.js` (regenerated — 1 entry to 24)
- `tsconfig.json` (removed deprecated `baseUrl`)
- `tests/int/importMap.int.spec.ts` (created)
- `tests/e2e/admin-editors.e2e.spec.ts` (created)
- `tests/e2e/admin-views.e2e.spec.ts` (created)
- `CLAUDE.md`, `.claude/skills/code-art-website/SKILL.md`, `README.md` (generator guidance)

**Status: Completed**
