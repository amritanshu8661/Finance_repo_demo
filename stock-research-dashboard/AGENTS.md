# Project organization

This is a React/TypeScript application with Next.js App Router conventions,
built by Vinext/Vite for Cloudflare Workers. Storage uses Drizzle, D1 and R2.
Use the existing framework and dependencies.

- `app/`: pages, layouts, global styles and HTTP API routes. Keep routes thin:
  validate requests, check access, call a service and return the response.
- `components/` and `hooks/`: frontend components, colocated component styles
  and reusable React hooks. Keep `components/ui/`, `hooks/use-mobile.ts` and
  `vendor/` intact as vendored source; keep shadcn's `lib/utils.ts` path.
- `services/`: server business logic, orchestration, caching and permissions.
  Frontend code calls `/api/` rather than importing services.
- `lib/integrations/<service>/`: each external connection in its own named
  folder. Alpha Vantage, Gemini, Cloudflare storage and Sites identity/connector
  support already have folders. Keep provider HTTP calls and response mapping
  here; call them from services.
- `lib/validation/`: input parsing, validation and request size/origin checks.
- `lib/config/`: server runtime configuration; never import secret-reading code
  into client components. List new app settings by name in `.env.example` with
  blank or harmless example values. Local secrets belong in ignored `.dev.vars`.
- `lib/finance/`, `lib/library/`, `lib/research/`: browser-safe feature data,
  contracts, errors and pure calculations shared by frontend and backend.
- `db/`: database client setup and Drizzle schema. Put all schema changes in
  versioned `drizzle/` migrations; preserve existing migration SQL and snapshots.
  Do not create/alter tables in request handlers. Add generated types only when
  current features require them; do not hand-edit generated files.
- `public/`: static assets and downloadable import templates. `docs/`: project
  guides. `tests/`: existing unit and local HTTP checks. `scripts/`, `worker/`
  and root config files: build, preview, deployment and runtime infrastructure.

Keep the flow frontend → API route → service → integration/storage. Never expose
API keys through client imports, public environment variables, responses or logs.
Preserve request authentication, permissions, validation and existing behavior.
Move files only for a clear purpose and update imports, tests and documentation.
Do not add empty folders, speculative integrations or duplicate implementations.
When a purpose or location is uncertain, leave the file in place and report it.

See `README.md` and `docs/ARCHITECTURE.md` for setup, the current folder map and
existing verification commands. Use `npm run typecheck`, `npm test` and
`npm run build` for relevant source changes. HTTP checks require a local server
with its database initialized; they must not target production.
