# Project Instructions for Claude Code

## Overview
This repository contains a personal website for a software engineer built with:
- **Payload CMS 3.0** (headless CMS with admin panel)
- **Next.js 15+ / React 19** (App Router frontend and Payload API backend)
- **Bun** (runtime & package manager)
- **SQLite** (`@payloadcms/db-sqlite` database)
- **Tailwind CSS** (for styling)
- **Vitest & React Testing Library** (for unit / integration tests)
- **Playwright** (for end-to-end tests)
- **Prettier & ESLint** (for formatting and linting)

---

## Global Execution Rules for Each Task

For **every task**, follow this strict step-by-step lifecycle before moving to the next task:

1. **Clean Workspace Verification**:
   - Ensure the git working tree is clean (`git status`) with no uncommitted or untracked changes before starting.

2. **Implement Code Changes**:
   - Make minimal, clean, and robust code changes.
   - Use **Tailwind CSS** for all UI styling (ensure responsive, modern, accessible design).
   - Whenever Payload collections, globals, or fields are added/modified:
     - Run `bun run generate:types` (or `payload generate:types`) to update `src/payload-types.ts`.
     - Run `bun run generate:importmap` (if custom components are added to admin).
     - Ensure `src/payload.config.ts` registers all new collections and globals.

3. **Create Unit / Integration Tests**:
   - Add unit/integration tests in `tests/int/` using Vitest and React Testing Library for new components, hooks, utilities, or collection/global configs.
   - Run unit tests: `bun run test:int` (or `pnpm run test:int`) and ensure they pass.

4. **Create End-to-End (E2E) Tests**:
   - Add E2E tests in `tests/e2e/` using Playwright covering frontend pages, navigation, and admin/data interactions where applicable.
   - Run E2E tests: `bun run test:e2e` (or `pnpm run test:e2e`) and ensure they pass.

5. **Format with Prettier**:
   - Run `bunx prettier --write .` to ensure all code is properly formatted.

6. **Lint with ESLint**:
   - Run `bun run lint` (or `pnpm run lint`) and fix any warnings/errors.

7. **Update `report.md`**:
   - Append or update `report.md` with:
     - Task number & title
     - Summary of changes implemented
     - Files modified / created
     - Test verification summary (unit & E2E tests created and passed)
     - Status: `Completed`

8. **Commit Changes**:
   - Commit all changes for the completed task with a clear, descriptive commit message (e.g. `feat: add footer global and layout integration (Task 3)`).
   - Ensure `git status` is clean before proceeding to the next task.

---

## Tasks Breakdown

---

### Task 1: Fix Broken Lint Error
- **Goal**: Fix the existing lint error/issue when running `eslint` / `bun run lint`.
- **Requirements**:
  - Run `bun run lint` to identify the issue.
  - Resolve any configuration or file errors causing eslint to fail.
  - Verify that `bun run lint` passes with 0 errors.
- **Testing**:
  - Run `bun run lint`.
- **Report & Commit**:
  - Update `report.md` and commit with message `fix: resolve broken lint configuration and errors (Task 1)`.

---

### Task 2: Update Packages to Latest Compatible Versions
- **Goal**: Update dependencies and devDependencies to their latest compatible versions without breaking compatibility.
- **Requirements**:
  - Check for outdated dependencies using `bun outdated` or package manager tools.
  - Keep compatibility constraints in mind:
    - Avoid breaking major version mismatches (e.g., maintain TypeScript `< 6` / compatible with current Payload/Next.js).
    - Ensure React 19 / Next.js / Payload 3.x packages remain aligned and compatible.
  - Update `package.json` and reinstall lockfile (`bun install`).
  - Verify build (`bun run build`), linting (`bun run lint`), and tests (`bun run test:int`).
- **Testing**:
  - Run `bun run build`, `bun run lint`, and `bun run test:int`.
- **Report & Commit**:
  - Update `report.md` and commit with message `chore: update packages to latest compatible versions (Task 2)`.

---

### Task 3: Add Footer Global
- **Goal**: Create a Payload Global for site-wide Footer settings.
- **Requirements**:
  - Create global configuration `src/globals/Footer.ts` (or `src/collections/` as appropriate for globals).
  - Register `Footer` in `src/payload.config.ts` under `globals: [...]`.
  - Fields required:
    - `copyright`: text field (e.g. "© 2026 Your Name. All rights reserved.")
    - `socialLinks`: array field with items containing:
      - `platform`: select field with options (`GitHub`, `LinkedIn`, `Facebook`, `Twitter`, `X`)
      - `url`: text / URL field (required)
  - Run `bun run generate:types`.
- **Testing**:
  - Add unit tests verifying the Footer global config fields.
- **Report & Commit**:
  - Update `report.md` and commit with message `feat: add footer global schema (Task 3)`.

---

### Task 4: Update Site Layout to Display Footer
- **Goal**: Render the Footer component in the frontend layout across pages.
- **Requirements**:
  - Create a reusable `Footer` component in `src/components/Footer.tsx`.
  - Fetch footer global data using Payload Local API (`getPayload({ config })`) in `src/app/(frontend)/layout.tsx` or dedicated server component.
  - Style with Tailwind CSS: clean typography, icons/labels for social links (GitHub, LinkedIn, Facebook, Twitter), copyright text, responsive layout.
  - Handle fallback / default state when footer data is not yet seeded.
- **Testing**:
  - Unit tests for `Footer` component rendering social links and copyright.
  - E2E test in `tests/e2e/` asserting footer is visible on pages with expected social links.
- **Report & Commit**:
  - Update `report.md` and commit with message `feat: render dynamic footer in root layout (Task 4)`.

---

### Task 5: Add Bio Global
- **Goal**: Create a Payload Global for the author's biography.
- **Requirements**:
  - Create `src/globals/Bio.ts` (slug: `bio`).
  - Register in `src/payload.config.ts` under `globals`.
  - Fields:
    - `title`: string (required) — author's name.
    - `subtitle`: string (e.g. "Software Engineer").
    - `shortPhrase`: string (single line, tagline/hero phrase).
    - `aboutMe`: rich text (multi-line rich text using Lexical editor).
  - Run `bun run generate:types`.
- **Testing**:
  - Unit test verifying Bio global schema definition.
- **Report & Commit**:
  - Update `report.md` and commit with message `feat: add bio global schema (Task 5)`.

---

### Task 6: Display Bio on Home Page
- **Goal**: Render the Bio on the home page (`/`).
- **Requirements**:
  - Update `src/app/(frontend)/page.tsx` (or a dedicated `BioSection` component).
  - Fetch the `bio` global via Payload Local API.
  - Display Title (Name), Subtitle (Role/Title), Short phrase, and About me (render Lexical rich text properly using `@payloadcms/richtext-lexical/react` or a rich text serializer).
  - Style cleanly with Tailwind CSS (Hero section + About Me section).
- **Testing**:
  - Unit test for Bio component rendering all fields.
  - E2E test verifying home page renders the bio section content correctly.
- **Report & Commit**:
  - Update `report.md` and commit with message `feat: display bio section on home page (Task 6)`.

---

### Task 7: Add Work Experience Collection
- **Goal**: Create a Payload Collection for work experience entries.
- **Requirements**:
  - Create `src/collections/WorkExperience.ts` (slug: `work-experience`).
  - Register in `src/payload.config.ts`.
  - Fields:
    - `jobTitle`: text (required)
    - `company`: text (required)
    - `companyUrl`: text/URL (optional link to company website)
    - `location`: text (optional)
    - `startYear`: number or text (required)
    - `endYear`: number or text (optional, empty means "Present")
    - `jobDescription`: rich text multi-line (required, Lexical editor)
  - Run `bun run generate:types`.
- **Testing**:
  - Unit test for WorkExperience collection configuration.
- **Report & Commit**:
  - Update `report.md` and commit with message `feat: add work experience collection (Task 7)`.

---

### Task 8: Display Work Experience on Home Page with Animated Nav Menu
- **Goal**: Display work experiences on the home page and add a fixed navigation menu with smooth scroll animation.
- **Requirements**:
  - Fetch work experience items sorted chronologically (e.g., startYear descending).
  - Create an Experience timeline / list component styled with Tailwind CSS.
  - Create a fixed top/side navigation bar with links: "About" (`#about`) and "Experience" (`#experience`).
  - Implement smooth scroll animation on anchor click (e.g., `scroll-behavior: smooth`, active link state).
- **Testing**:
  - Unit tests for experience list component.
  - E2E test verifying work experience section renders and clicking menu items scrolls to the target sections.
- **Report & Commit**:
  - Update `report.md` and commit with message `feat: display work experience and animated fixed menu on home page (Task 8)`.

---

### Task 9: Add Skill Collection
- **Goal**: Create a Payload Collection for technical skills.
- **Requirements**:
  - Create `src/collections/Skills.ts` (slug: `skills`).
  - Register in `src/payload.config.ts`.
  - Fields:
    - `title`: text (required, unique) — e.g., "C#", ".NET", "TypeScript", "React", etc.
  - Admin configuration: `useAsTitle: 'title'`.
  - Run `bun run generate:types`.
- **Testing**:
  - Unit test for Skills collection config.
- **Report & Commit**:
  - Update `report.md` and commit with message `feat: add skills collection (Task 9)`.

---

### Task 10: Add Projects Collection
- **Goal**: Create a Payload Collection for portfolio projects.
- **Requirements**:
  - Create `src/collections/Projects.ts` (slug: `projects`).
  - Register in `src/payload.config.ts`.
  - Fields:
    - `title`: text (required)
    - `slug`: text (required, unique, index)
    - `summary`: text (required)
    - `description`: rich text (multi-line, required, Lexical editor)
    - `externalLink`: text/URL (optional)
    - `githubLink`: text/URL (optional)
    - `skills`: relationship field with `relationTo: 'skills'`, `hasMany: true` (required, allow inline create / autocomplete)
    - `images`: relationship field with `relationTo: 'media'`, `hasMany: true` (optional)
    - `highlight`: checkbox / boolean (default false)
  - Run `bun run generate:types`.
- **Testing**:
  - Unit test for Projects collection structure and validation.
- **Report & Commit**:
  - Update `report.md` and commit with message `feat: add projects collection schema (Task 10)`.

---

### Task 11: Add Single Project Page (`/projects/:slug`)
- **Goal**: Create a dynamic Next.js page to display a single project.
- **Requirements**:
  - Create route `src/app/(frontend)/projects/[slug]/page.tsx`.
  - Fetch project by `slug` using Payload Local API. Return `notFound()` if missing.
  - Display:
    - Title, Summary, Rich Text Description
    - External Link (with outbound icon), GitHub link
    - Associated Skills badges
    - Image Carousel / Gallery for project images (with next/prev controls or indicators, styled with Tailwind)
  - Generate dynamic metadata (title, description).
- **Testing**:
  - Unit test for Project Detail component.
  - E2E test navigating to `/projects/[slug]` and checking content and carousel.
- **Report & Commit**:
  - Update `report.md` and commit with message `feat: add project detail page with image carousel (Task 11)`.

---

### Task 12: Add Project List Page (`/projects`)
- **Goal**: Create a project listing page with grid layout and pagination.
- **Requirements**:
  - Create route `src/app/(frontend)/projects/page.tsx`.
  - Query projects with pagination (`limit`, `page` query params).
  - Display in a responsive grid layout using Tailwind CSS.
  - Each card displays:
    - First image thumbnail (or placeholder if no image)
    - Title (linking to `/projects/:slug`)
    - Summary
    - Associated skills tags
    - External & GitHub links (if present)
  - Pagination controls (Previous / Next / Page numbers).
- **Testing**:
  - Unit test for project grid and pagination.
  - E2E test for `/projects` listing and pagination navigation.
- **Report & Commit**:
  - Update `report.md` and commit with message `feat: add projects list page with grid and pagination (Task 12)`.

---

### Task 13: Display Highlighted Projects on Home Page & Update Menu
- **Goal**: Display top 5 highlighted projects on the home page and add "Projects" to the main menu.
- **Requirements**:
  - On the home page (`src/app/(frontend)/page.tsx`), query top 5 projects where `highlight === true` (ordered by creation/date).
  - Each card shows:
    - First image thumbnail
    - Title with external link arrow (if externalLink exists)
    - Link to `/projects/:slug`
    - GitHub link (if any)
    - Summary & Skills
  - Check total project count: if there are more projects (highlighted or not) beyond what is displayed, show a "View all projects" button/link pointing to `/projects`.
  - Update fixed main menu to include `Projects` (`#projects` link).
- **Testing**:
  - Unit test for Featured Projects section.
  - E2E test verifying featured projects on home page and menu link navigation.
- **Report & Commit**:
  - Update `report.md` and commit with message `feat: display featured projects on home page and add to menu (Task 13)`.

---

### Task 14: Add Blog Collection
- **Goal**: Create a Payload Collection for blog posts.
- **Requirements**:
  - Create `src/collections/Blog.ts` (slug: `blog` or `posts`).
  - Register in `src/payload.config.ts`.
  - Fields:
    - `title`: text (required)
    - `slug`: text (required, unique, index)
    - `summary`: text (required)
    - `content`: textarea / code / markdown field (Markdown string required)
    - `publishedAt` / `createdAt`: date field for publication date
  - Run `bun run generate:types`.
- **Testing**:
  - Unit test for Blog collection definition.
- **Report & Commit**:
  - Update `report.md` and commit with message `feat: add blog collection schema (Task 14)`.

---

### Task 15: Add Single Blog Page (`/blog/:slug`)
- **Goal**: Create a dynamic Next.js page to display a single blog post.
- **Requirements**:
  - Create route `src/app/(frontend)/blog/[slug]/page.tsx`.
  - Fetch post by slug via Payload Local API. Return `notFound()` if not found.
  - Render post title, publication date, summary, and Markdown content (rendered to HTML via a markdown parser such as `react-markdown` or similar, styled with `@tailwindcss/typography` or custom Tailwind classes).
  - Include a "Back to Blog" navigation link.
  - Generate dynamic metadata (title, description).
- **Testing**:
  - Unit test for blog post markdown rendering.
  - E2E test navigating to `/blog/[slug]`.
- **Report & Commit**:
  - Update `report.md` and commit with message `feat: add single blog post page with markdown rendering (Task 15)`.

---

### Task 16: Add Blog List Page (`/blog`) with Year Filter & Pagination
- **Goal**: Create a blog listing page with pagination and unique year filtering.
- **Requirements**:
  - Create route `src/app/(frontend)/blog/page.tsx`.
  - Fetch published posts with pagination support.
  - Extract list of unique publication years from all posts.
  - Display filter buttons / links for unique years (e.g. `All`, `2026`, `2025`, ...) using query param `?year=YYYY`.
  - Display posts in a clean list / grid (Title linking to `/blog/:slug`, Date, Summary).
  - Include pagination controls.
- **Testing**:
  - Unit test for blog listing and year filtering logic.
  - E2E test for `/blog` verifying year filter and pagination.
- **Report & Commit**:
  - Update `report.md` and commit with message `feat: add blog list page with year filtering and pagination (Task 16)`.

---

### Task 17: Display Latest Blog Posts on Home Page
- **Goal**: Show the 5 most recent blog posts on the home page and update main menu.
- **Requirements**:
  - On the home page, fetch the latest 5 blog posts ordered by `publishedAt` / date descending.
  - For each post, display: Title (link to `/blog/:slug`), Summary, and Date.
  - Show a "View all blog posts" link pointing to `/blog`.
  - Add "Blog" to the fixed main navigation menu (`#blog` or `/blog`).
- **Testing**:
  - Unit test for Home Blog section.
  - E2E test checking home page blog section and link to full blog.
- **Report & Commit**:
  - Update `report.md` and commit with message `feat: display latest blog posts on home page (Task 17)`.

---

### Task 18: Update Claude Skills & Documentation in `.claude`
- **Goal**: Update `.claude` documentation and skills to help Claude understand the project architecture and facilitate future maintenance.
- **Requirements**:
  - Update `CLAUDE.md` and any skills under `.claude/skills/` with:
    - Overview of collections and globals (Bio, Footer, WorkExperience, Skills, Projects, Blog, Users, Media).
    - Architecture summary (Payload 3.0 Local API patterns, App Router layout, frontend routes).
    - Testing instructions (`bun run test:int`, `bun run test:e2e`).
    - Styling guidelines (Tailwind CSS).
    - Common commands (generating types, dev server, build, lint, format).
- **Testing**:
  - Verify markdown formatting of `.claude` docs.
- **Report & Commit**:
  - Update `report.md` and commit with message `docs: update .claude skills and documentation (Task 18)`.

---

### Task 19: Update `README.md`
- **Goal**: Provide complete, professional documentation for the website repository.
- **Requirements**:
  - Update `README.md` with:
    - Project Overview & Tech Stack (Payload CMS 3, Bun, Next.js 15, React 19, SQLite, Tailwind CSS).
    - Project Structure (directory breakdown of `src/`, `globals`, `collections`, `tests/`, etc.).
    - Setup & Installation instructions using Bun (`bun install`, `.env` setup).
    - Running the Project locally (`bun run dev`, admin panel access at `/admin`).
    - Testing Guide (Unit tests with Vitest, E2E tests with Playwright).
    - Database & Payload commands (`generate:types`, `generate:importmap`).
- **Testing**:
  - Verify formatting and markdown rendering of `README.md`.
- **Report & Commit**:
  - Update `report.md` and commit with message `docs: update README with tech stack, structure, and running instructions (Task 19)`.

---

## Summary Checklist for Claude Code

When working through each task:
```
[ ] 1. Check `git status` (must be clean)
[ ] 2. Make code changes (Tailwind CSS, clean React/Next.js/Payload code)
[ ] 3. Run `bun run generate:types` if schemas changed
[ ] 4. Write and run unit tests (`bun run test:int`)
[ ] 5. Write and run E2E tests (`bun run test:e2e`)
[ ] 6. Format code (`bunx prettier --write .`)
[ ] 7. Lint code (`bun run lint`)
[ ] 8. Update `report.md` with summary of work
[ ] 9. Commit changes (`git commit -m "..."`)
```
