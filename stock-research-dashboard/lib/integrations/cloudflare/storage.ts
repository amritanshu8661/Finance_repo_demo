/** Server-side access to the Cloudflare D1 and R2 bindings. */
import { env } from "cloudflare:workers";
import { LibraryError } from "@/lib/library/contracts";

export function setting(name: string): string {
  const bindings = env as unknown as Record<string, unknown>;
  const value = bindings[name] ?? (typeof process !== "undefined" ? process.env[name] : "");
  return typeof value === "string" ? value.trim() : "";
}
export function getDatabase(): D1Database | undefined { return env.DB; }
export function storageReady(): boolean { return Boolean(env.DB && env.BUCKET); }
export function requireStorage(): { db: D1Database; bucket: R2Bucket } {
  if (!env.DB || !env.BUCKET) throw new LibraryError("The file library is not connected yet. Ask the administrator to enable database and file storage.", 503);
  return { db: env.DB, bucket: env.BUCKET };
}

