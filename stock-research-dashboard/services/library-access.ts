import { getChatGPTUser } from "@/lib/integrations/sites/auth";
import { LibraryError, type LibraryItem, type LibraryUser } from "@/lib/library/contracts";
import { getDatabase, setting } from "@/lib/integrations/cloudflare/storage";

export { LibraryError } from "@/lib/library/contracts";
export { setting, storageReady, requireStorage } from "@/lib/integrations/cloudflare/storage";
export { assertSameOrigin, readBoundedBody, boundedJson } from "@/lib/validation/library-request";

function allowed(name: string): string[] { return setting(name).split(",").map(value => value.trim()).filter(Boolean); }
export function isRootAdmin(user: Pick<LibraryUser, "id" | "email">): boolean {
  return allowed("STOCKWISE_ADMIN_USER_IDS").includes(user.id) || allowed("STOCKWISE_ADMIN_EMAILS").some(email => email.toLowerCase() === user.email.toLowerCase());
}
export function adminConfigured(): boolean { return Boolean(allowed("STOCKWISE_ADMIN_USER_IDS").length || allowed("STOCKWISE_ADMIN_EMAILS").length); }
export async function getLibraryUser(): Promise<LibraryUser | null> {
  const identity = await getChatGPTUser();
  if (!identity) return null;
  const candidate: LibraryUser = { id: identity.userId, email: identity.email.toLowerCase(), displayName: identity.displayName.slice(0, 160), role: "user" };
  candidate.rootAdmin = isRootAdmin(candidate);
  const db = getDatabase();
  if (!db) return { ...candidate, role: candidate.rootAdmin ? "admin" : "user" };
  const now = new Date().toISOString();
  try {
    await db.prepare("INSERT INTO library_users (id,email,display_name,role,created_at,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email, display_name=excluded.display_name, role=CASE WHEN excluded.role='admin' THEN 'admin' ELSE library_users.role END, updated_at=excluded.updated_at")
      .bind(candidate.id, candidate.email, candidate.displayName, candidate.rootAdmin ? "admin" : "user", now, now).run();
    const stored = await db.prepare("SELECT id,email,display_name AS displayName,role,created_at AS createdAt FROM library_users WHERE id=?").bind(candidate.id).first<LibraryUser>();
    if (!stored) throw new Error("Missing user");
    return { ...stored, role: candidate.rootAdmin ? "admin" : stored.role === "admin" ? "admin" : "user", rootAdmin: candidate.rootAdmin };
  } catch { throw new LibraryError("The account database is not ready. Ask the administrator to apply the database migrations.", 503); }
}

export async function requireLibraryUser(admin = false): Promise<LibraryUser> {
  const user = await getLibraryUser();
  if (!user) throw new LibraryError("Sign in to use your company file library.", 401);
  if (admin && user.role !== "admin") throw new LibraryError("Only an administrator can perform this action.", 403);
  return user;
}

export function canReadItem(user: LibraryUser, item: Pick<LibraryItem, "ownerId" | "visibility">): boolean {
  return user.role === "admin" || item.ownerId === user.id || item.visibility === "shared";
}
export function canEditItem(user: LibraryUser, item: Pick<LibraryItem, "ownerId" | "visibility">): boolean {
  return user.role === "admin" || (item.ownerId === user.id && item.visibility === "private");
}

export function libraryError(error: unknown): Response {
  return Response.json({ error: error instanceof LibraryError ? error.message : "The library could not complete this request. Please try again." }, { status: error instanceof LibraryError ? error.status : 500, headers: { "Cache-Control": "private, no-store" } });
}
export function libraryJson(value: unknown, status = 200): Response { return Response.json(value, { status, headers: { "Cache-Control": "private, no-store" } }); }
