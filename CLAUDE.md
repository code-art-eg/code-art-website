# Claude Code

Personal website for a software engineer: **Payload CMS 3** + **Next.js 16 (App Router)** +
**React 19**, running on **Bun** with a **SQLite** database and **Tailwind CSS v4**.

## Skills

- `.claude/skills/code-art-website/SKILL.md` — **start here.** This project's content model,
  architecture, conventions and commands.
- `.claude/skills/payload/SKILL.md` — general Payload CMS reference, with deeper docs in
  `.claude/skills/payload/reference/`.

## Non-negotiables

- **Bun, not npm/pnpm/yarn.** `bun install`, `bun run <script>`, `bunx <binary>`.
- **Run `bun run generate:types` after any change to a collection, global or field.**
  `src/payload-types.ts` is generated — never hand-edit it.
- **Tailwind utility classes only** for frontend styling. There is no component CSS file.
- **Every change ships with tests**: Vitest specs in `tests/int/`, Playwright specs in
  `tests/e2e/`. Then `bunx prettier --write .` and `bun run lint` must both be clean.
- `bun run build` type-checks `tests/` as well as `src/`, so a green Vitest run alone does not
  prove the types are sound.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
