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
