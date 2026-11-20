/** Server-only runtime configuration. Never import from a client component. */
export function serverSetting(name: string): string {
  // With nodejs_compat, Cloudflare exposes runtime secrets through process.env.
  // Use .dev.vars for local Wrangler/Vinext development; configure hosted secrets
  // in the Sites environment settings. These values never enter the client bundle.
  return typeof process !== "undefined" ? (process.env[name] ?? "").trim() : "";
}

