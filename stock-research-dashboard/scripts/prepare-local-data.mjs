/** Applies pending schema migrations to the local preview only. */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const project = process.cwd();
let built;
try { built = JSON.parse(readFileSync(path.join(project, "dist/server/wrangler.json"), "utf8")); }
catch { console.error("Run npm run build first, then npm run setup:data."); process.exit(1); }
const binding = built.d1_databases?.find(database => database.binding === "DB");
if (!binding) { console.error("The build does not include DB. Enable the database binding and rebuild first."); process.exit(1); }
const runtime = path.join(project, ".sites-runtime");
mkdirSync(runtime, { recursive: true });
const config = path.join(runtime, "local-migrations.json");
writeFileSync(config, JSON.stringify({
  name: built.name,
  compatibility_date: built.compatibility_date,
  compatibility_flags: ["nodejs_compat"],
  d1_databases: [{ ...binding, migrations_dir: path.join(project, "drizzle") }],
}, null, 2) + "\n");
const result = spawnSync(process.execPath, [
  "--import", "./scripts/sites-env.mjs", "./node_modules/wrangler/bin/wrangler.js",
  "d1", "migrations", "apply", "DB", "--local", "--config", config,
  "--persist-to", path.join(project, ".wrangler/state"),
], { cwd: project, stdio: ["ignore", "inherit", "inherit"] });
if (result.error) { console.error("Could not run the local migration tool."); process.exit(1); }
process.exit(result.status ?? 1);
