# Personal Website

A personal website, portfolio and blog for a software engineer, built as a single Next.js
application with Payload CMS providing the admin panel and content API.

The public site renders live content from the CMS: a bio, a work-experience timeline, portfolio
projects with image galleries, and a Markdown blog.

## Tech stack

| Layer                     | Technology                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------ |
| CMS                       | [Payload CMS 3](https://payloadcms.com) (admin panel, REST + GraphQL API, Local API) |
| Framework                 | [Next.js 16](https://nextjs.org) (App Router) with React 19                          |
| Runtime & package manager | [Bun](https://bun.sh)                                                                |
| Database                  | SQLite via `@payloadcms/db-sqlite` (libSQL + Drizzle)                                |
| Styling                   | [Tailwind CSS v4](https://tailwindcss.com) + `@tailwindcss/typography`               |
| Rich text                 | Lexical (`@payloadcms/richtext-lexical`)                                             |
| Markdown                  | `react-markdown` + `remark-gfm`                                                      |
| Unit / integration tests  | [Vitest](https://vitest.dev) + React Testing Library                                 |
| End-to-end tests          | [Playwright](https://playwright.dev)                                                 |
| Tooling                   | TypeScript, ESLint, Prettier                                                         |

## Project structure

```
src/
├── app/
│   ├── (frontend)/              Public website
│   │   ├── layout.tsx           Fixed nav + footer, global styles
│   │   ├── page.tsx             Home: bio → experience → curated projects → latest posts
│   │   ├── styles.css           Tailwind entrypoint (CSS-first config)
│   │   ├── projects/
│   │   │   ├── page.tsx         Project grid with pagination
│   │   │   └── [slug]/page.tsx  Project detail with image carousel
│   │   └── blog/
│   │       ├── page.tsx         Post list with year filter and pagination
│   │       └── [slug]/page.tsx  Post with rendered Markdown
│   ├── (payload)/               Payload-generated admin panel and API routes
│   └── my-route/                Example custom route handler
├── collections/                 Users, Media, WorkExperience, Skills, Projects, Blog
├── globals/                     Bio, Footer
├── components/                  Presentational React components
├── lib/                         Local API queries and pure helpers
├── payload.config.ts            Payload configuration
└── payload-types.ts             Generated types — do not edit by hand
tests/
├── int/                         Vitest specs (*.int.spec.ts / .tsx)
├── e2e/                         Playwright specs (*.e2e.spec.ts)
└── helpers/                     Shared fixtures, seeding and test utilities
```

### Content model

**Globals**

| Global                | Slug                    | Purpose                                                      |
| --------------------- | ----------------------- | ------------------------------------------------------------ |
| Bio                   | `bio`                   | Name, subtitle, tagline and a rich text "About me"           |
| Footer                | `footer`                | Copyright line and social profile links                      |
| Home Page Projects    | `home-page-projects`    | Which projects the home page shows, in the order they appear |
| Project Page Projects | `project-page-projects` | Which projects `/projects` lists, in the order they appear   |

Both project globals are curations: only what they list is shown, in the order it is listed, and
an empty list means that page shows no projects at all.

**Collections**

| Collection      | Slug              | Purpose                                                               |
| --------------- | ----------------- | --------------------------------------------------------------------- |
| Users           | `users`           | Admin panel authentication                                            |
| Media           | `media`           | Uploaded images, stored in `/media`                                   |
| Work Experience | `work-experience` | Roles in the home page timeline (empty end year renders as "Present") |
| Skills          | `skills`          | Technology tags, created inline from the Projects form                |
| Projects        | `projects`        | Portfolio projects with skills and images                             |
| Blog            | `blog`            | Markdown posts with a publication date                                |

## Setup

### Prerequisites

- [Bun](https://bun.sh) 1.4 or newer
- Node.js 20.9 or newer (Next.js and Payload require it)

### Installation

```bash
git clone <repository-url>
cd code-art-website

bun install

cp .env.example .env
```

Then edit `.env`:

```ini
DATABASE_URL=file:./code-art-website.db
PAYLOAD_SECRET=<a long random string>
```

Generate a secret with `openssl rand -hex 32`. The SQLite file is created automatically on
first run — there is no separate database server to install.

## Running the project

```bash
bun run dev
```

- Website: <http://localhost:3000>
- Admin panel: <http://localhost:3000/admin>

The first visit to `/admin` prompts you to create an admin user. After that, fill in the **Bio**
global — until it has a name, the home page shows a placeholder instead of the real content.

For a production build:

```bash
bun run build
bun run start
```

## Testing

```bash
bun run test:int    # Vitest — unit and integration
bun run test:e2e    # Playwright — end to end
bun run test        # both suites
```

**Unit / integration tests** (`tests/int/`) run in jsdom and cover two things: Payload schema
configuration (field types, `required` flags, validators, slug hooks) and React components
rendered with React Testing Library. Components are presentational and take plain props, so no
database is needed to test them.

**End-to-end tests** (`tests/e2e/`) start a dev server automatically and drive Chromium. They
seed content through the Payload Local API before each suite and clean it up afterwards —
globals are snapshotted and restored, and seeded rows use `test-` prefixed slugs that are
deleted in `afterAll`, so your own content is left intact.

Playwright browsers are installed with:

```bash
bunx playwright install chromium
```

Both suites run serially on purpose (`fileParallelism: false` in `vitest.config.mts`,
`workers: 1` in `playwright.config.ts`): they share a single SQLite file with the dev server, and
parallel runs raced Payload's dev schema push. The SQLite adapter is configured with WAL mode and
a busy timeout for the same reason.

## Database & Payload commands

```bash
bun run generate:types      # Regenerate src/payload-types.ts from the config
bun run generate:importmap  # Regenerate src/app/(payload)/admin/importMap.js
bun run payload <command>   # Any other Payload CLI command
```

**Run both generators after every change to a collection, global or field**, and commit their
output. `src/payload-types.ts` and `src/app/(payload)/admin/importMap.js` are generated and must
never be edited by hand.

The import map is not only for custom components. The admin panel resolves `richText` fields —
the Lexical editor and each of its toolbar features — through it, so a stale map makes those
fields render as nothing at all, with no error anywhere in the admin UI.

The schema is applied automatically in development (Payload pushes it to SQLite on startup), so
no migration step is needed for local work. `bun run devsafe` clears the `.next` cache first if
the dev server gets into a bad state.

## Code quality

```bash
bunx prettier --write .   # Format
bun run lint              # ESLint
bun run build             # Also type-checks src/ and tests/
```

Frontend styling is Tailwind utility classes only. Tailwind v4 is configured CSS-first in
`src/app/(frontend)/styles.css` — there is no `tailwind.config.js`. Every surface supports light
and dark colour schemes.

## Notes for contributors

Project-specific architecture notes, conventions and gotchas live in
[`.claude/skills/code-art-website/SKILL.md`](.claude/skills/code-art-website/SKILL.md), with a
general Payload reference in [`.claude/skills/payload/`](.claude/skills/payload/).

`CLAUDE.md` contains a block that `next dev` regenerates automatically; commit it as-is.
