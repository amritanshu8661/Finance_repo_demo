# How the sections connect

Stockwise has a frontend (what you see), a backend (the server checks and calculations), and persistent storage. React and TypeScript use Next.js-style routes through Vinext, deployed as a Cloudflare Worker. D1 holds relational data, Drizzle manages the schema and migration history, and R2 holds uploaded objects. The project does not use Supabase.

## Request flow

```text
Frontend component
    → app/api/ route: HTTP input, access checks, and response
    → services/: application rules, orchestration, and caching
    → lib/integrations/<service>/: external API or storage access
```

Validation lives in `lib/validation/`; browser-safe contracts and calculations live in their feature folders under `lib/`. Frontend components call our API routes for server operations. They do not import service modules or provider clients.

| Feature | Route | Service | External connection |
| --- | --- | --- | --- |
| Search, company data, provider status | `app/api/search/`, `research/`, `status/` | `services/research.ts` | `lib/integrations/alpha-vantage/client.ts` |
| News summaries | `app/api/summarize/` | `services/research.ts` | `lib/integrations/gemini/client.ts` and Alpha Vantage news |
| Uploads, metadata, versions, downloads | `app/api/library/` | `services/library.ts`, `services/library-access.ts` | `lib/integrations/cloudflare/storage.ts` |
| Account and administrator actions | `app/api/me/`, `app/api/admin/` | Library and access services | Sites identity and Cloudflare storage |

The library workflow is:

```text
Dashboard ── company ticker ──> Data Library
                                  │
           Upload CSV / JSON ──────┤
           Attach report ──────────┤
           Save source website ────┤
                                  ▼
                     Server checks signed-in identity
                                  ▼
                     Server checks role and file access
                                  ▼
                     Validate file size, format and rows
                                  ▼
               R2 file storage + D1 metadata and audit records
                                  ▼
                    Parsed rows and formula-based analysis
                                  ▼
                 Data preview, chart, metrics and version links
                                  │
                                  └──> Finance Academy explanations

Administration ──> User roles + shared company files + activity history
```

## Frontend files

- `components/dashboard.tsx`: company research, charts, news, watchlist and personal summaries.
- `components/workspace-shell.tsx`: navigation and signed-in account information.
- `components/finance-learning.tsx`: the 12-stage learning map and interactive formulas.
- `components/data-workspace.tsx`: upload form, company files, sources, previews and calculated results.
- `components/admin-workspace.tsx`: administrative users and activity.
- `app/learning/page.tsx`, `app/data/page.tsx`, `app/admin/page.tsx`: pages that open these sections.

## Backend and data files

- `services/research.ts`: demo/live selection, provider status, research caching, safe API errors, and summary orchestration.
- `services/library.ts`: file metadata, object storage operations, versions, audit activity, and administrator actions.
- `services/library-access.ts`: signed-in account registration, roles, and file permissions.
- `lib/validation/research-request.ts`: signed-in research access, mutation origins, and bounded summary request bodies.
- `lib/validation/research.ts`: ticker and provider-value validation/coercion.
- `lib/validation/library.ts`: structured file parsing, attachment validation, and identifier/source URL checks.
- `lib/validation/library-request.ts`: library request origins, body size limits, and JSON input.
- `lib/finance/curriculum.ts`: learning terms, definitions, formulas, and source references.
- `lib/finance/calculations.ts`: calculator definitions and checked calculations.
- `lib/research/data.ts`: shared research types and clearly labelled demo fixtures.
- `lib/research/errors.ts`: research errors shared by validation, services, and integrations.
- `lib/library/contracts.ts`: file data shapes, limits, and library errors shared by frontend and backend.
- `lib/library/analysis.ts` and `csv.ts`: uploaded-data calculations and CSV helpers.
- `lib/config/server.ts`: server environment setting access; never import it into a client component.
- `lib/integrations/alpha-vantage/client.ts`: market/news API requests and response mapping.
- `lib/integrations/gemini/client.ts`: AI API requests and summary response handling.
- `lib/integrations/cloudflare/storage.ts`: access to the configured D1 and R2 bindings.
- `lib/integrations/sites/auth.ts`: trusted ChatGPT sign-in identity and authentication paths.
- `lib/integrations/sites/connector-*` and `connectors.ts`: Sites connector contract, request context, preview declarations, error presentation, and invocation support.
- `app/api/library/`: endpoints for files, downloads and changes.
- `app/api/admin/`: administrator-only user and activity endpoints.
- `app/api/me/`: the current signed-in identity and role.
- `db/index.ts` and `db/schema.ts`: Drizzle database setup and schema definitions.
- `drizzle/`: versioned SQL migrations and their generated snapshots/journal.
- `cloudflare-env.d.ts`: existing D1/R2 binding declarations.

## File move map

| Previous location | Current location |
| --- | --- |
| `lib/market-api.ts` | `services/research.ts`, provider clients under `lib/integrations/alpha-vantage/` and `gemini/`, and research validation/errors/config modules |
| `lib/library-store.ts` | `services/library.ts`, with identifier/source URL validators in `lib/validation/library.ts` |
| `lib/library-auth.ts` | `services/library-access.ts`, with request checks in `lib/validation/library-request.ts` and binding access in `lib/integrations/cloudflare/storage.ts` |
| `lib/library-parser.ts` | `lib/validation/library.ts`, with analysis and CSV helpers in `lib/library/` |
| `lib/library-contract.ts` | `lib/library/contracts.ts` |
| `lib/research-request.ts` | `lib/validation/research-request.ts` |
| `lib/research.ts` | `lib/research/data.ts` |
| `lib/finance-curriculum.ts` | `lib/finance/curriculum.ts` |
| `lib/finance-calculations.ts` | `lib/finance/calculations.ts` |
| `app/chatgpt-auth.ts` | `lib/integrations/sites/auth.ts` |
| `lib/connector-*`, `lib/connectors.ts` | The same filenames under `lib/integrations/sites/` |

Pages, components, assets, database schema, migration files, examples, vendor files, and build scripts keep their established locations. `drizzle/` remains the migration directory because both Drizzle configuration and Sites packaging expect it. `lib/utils.ts` remains the shared shadcn styling utility. Existing connector support is preserved as Sites runtime infrastructure; it does not imply that an additional third-party app is configured.

## Adding or changing files

- Put route entry points in `app/`; use `components/` and `hooks/` for reusable UI behavior. Keep feature styles beside their components and global styling in `app/globals.css`.
- Put application business rules in `services/`; route handlers should delegate to them. Put boundary validation in `lib/validation/` and browser-safe shared feature code under `lib/research/`, `lib/library/`, or `lib/finance/`.
- Give each external service actually in use its own `lib/integrations/<service>/` folder. Keep secrets on the server and document new setting names without real values in `.env.example`.
- Update `db/schema.ts` and generate a migration with `npm run db:generate` for schema changes. Preserve existing migrations and generated snapshots; request handlers must not alter schemas. Do not invent unused tables or duplicate database types.
- Use `public/` for assets and import templates, `docs/` for project guides, and `tests/` for behavior checks. Keep test entry paths and documentation in sync with file moves.
- Preserve the existing Sites/Vinext configuration, preview/build scripts, and vendored UI source. If a file's purpose is unclear, leave it in place and explain what needs investigation.

The project [AGENTS.md](../AGENTS.md) records these placement rules for later changes. No new external service, schema, or generated type setup is required by this refactor.

## Accounts and permissions

The hosted website uses Sites' ChatGPT sign-in. The server reads the trusted sign-in identity; changing a browser field does not change your permissions. Bootstrap administrators are configured privately by the site owner. Other accounts start as ordinary users. Administrators can change an existing user's application role; the configured owner administrator is protected.

An administrator can manage the workspace's company files and shared data. An ordinary user can read shared company files, read their own private files, and manage their own private uploads. Every protected endpoint checks permissions, including file downloads and version lookups.

Application roles and site sharing are separate. The site keeps its existing private audience. To admit another person, the owner must first grant that person site access through Sites. They appear in Administration after signing in. Promoting a user in the app does not silently change the site's audience.

Personal browser notes and watchlists are namespaced by the signed-in account. They remain device-local. Records from the original browser-only version are left untouched and are not automatically imported into a different signed-in account.

## Files and versions

An uploaded file has an owner, company ticker, currency, visibility and optional previous-version link. Raw files are stored in R2; their metadata is stored in D1, and validated structured rows are kept in a separate protected storage object. Downloads pass through a permission-checked endpoint rather than public object URLs.

A previous-version link must pass server validation. Files from different companies, currencies or incompatible dataset types cannot be connected as versions. Uploading a new version preserves the earlier file. Archiving hides a file from the active library and keeps its history; it does not permanently erase the file.

Source website entries are saved HTTPS references. The server does not fetch arbitrary supplied websites or run uploaded files. Live market data and AI use the separately configured supported providers.

## Local versus hosted data

Local preview storage lives under the ignored `.wrangler/state` directory. The hosted site has separate D1 and R2 resources. Real upload data is not committed to Git or included in deployment source. Local API keys and preview administrator settings stay in ignored `.dev.vars`; production settings live in Sites runtime secrets.

Database schema migrations run during local setup and hosted publication. Request handlers never create or alter the database schema.

If earlier browser-only notes are detected, the dashboard offers an explicit **Import earlier notes** action. Import only data that belongs to you. It preserves existing account notes and leaves the original browser records untouched.
