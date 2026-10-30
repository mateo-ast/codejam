<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# OPENCODE AGENT RULES - CODEJAM FULLSTACK JSON MODE

## OBJECTIVE

Build functional Next.js full-stack features (API Routes + UI) instantly. Use local `.json` files for real data persistence via Node `fs`. Prioritize speed and working end-to-end functionality over code architecture, tests, or documentation.

## STRICT CONSTRAINTS

- DO NOT create test files (`*.test.ts`, `*.spec.tsx`) or test runners.
- DO NOT write documentation, inline JSDoc comments, or edit `README.md`.
- DO NOT install or configure Databases, ORMs (Prisma, Drizzle, etc.), or state management libraries (Zustand, Redux).
- DO NOT leave placeholders (`// TODO`). Every API route and UI component must be 100% functional.

## BACKEND & DATA PERSISTENCE (JSON FILE SYSTEM)

- **Data File Location:** Store all application data in a local JSON file at `data/db.json` in the project root.
- **File I/O:** Read/write JSON data using Node.js `fs/promises` and `path.join(process.cwd(), 'data/db.json')`.
- **API Routes:** Build standard Next.js App Router endpoints (`app/api/[resource]/route.ts`) or Server Actions (`'use server'`) handling GET, POST, PUT, and DELETE operations.
- **Auto-Initialization:** If `data/db.json` does not exist, initialize it automatically with default mock data arrays on read.

## FRONTEND & UI RULES

- **UI:** Inline Tailwind CSS with Lucide React icons.
- **Data Fetching:** Connect components directly to internal `/api/...` endpoints using standard `fetch()` calls or Server Components.
- **Interactivity:** Ensure form submits, buttons, and CRUD operations trigger API requests and refresh the UI state immediately.
