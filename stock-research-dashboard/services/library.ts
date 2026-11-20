import { LibraryError, MAX_LIBRARY_FILE_BYTES, type AuditEvent, type LibraryDetail, type LibraryItem, type LibraryUser, type LibraryVisibility, type ParsedLibraryData } from "@/lib/library/contracts";
import { canEditItem, canReadItem, isRootAdmin } from "./library-access";
import { requireStorage } from "@/lib/integrations/cloudflare/storage";
import { field, parseDataFile, validateAttachment, validLibraryId, validCompanySymbol, validateSourceUrl } from "@/lib/validation/library";

export { validLibraryId, validCompanySymbol, validateSourceUrl } from "@/lib/validation/library";

type StoredItem = LibraryItem & { objectKey: string | null; parsedKey: string | null };
const itemColumns = `i.id,i.symbol,i.company_name AS companyName,i.title,i.kind,i.filename,i.mime_type AS mimeType,i.size,i.row_count AS rowCount,i.currency,i.visibility,i.owner_id AS ownerId,i.owner_name AS ownerName,i.parent_id AS parentId,i.created_at AS createdAt,i.archived_at AS archivedAt,i.url,i.object_key AS objectKey,i.parsed_key AS parsedKey,NOT EXISTS(SELECT 1 FROM library_items child WHERE child.parent_id=i.id AND child.archived_at IS NULL) AS latest`;

function publicItem(item: StoredItem): LibraryItem {
  const { objectKey: _object, parsedKey: _parsed, ...visible } = item;
  return { ...visible, latest: Boolean(visible.latest) };
}
function metadata(input: Record<string, unknown>, user: LibraryUser) {
  const symbol = validCompanySymbol(input.symbol);
  const companyName = field(input.companyName || symbol, "Company name", 160);
  const currency = field(input.currency || "USD", "Currency", 3).toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new LibraryError("Currency must use a three-letter code such as USD, INR, or EUR.");
  const visibility = input.visibility ?? "private";
  if (visibility !== "private" && visibility !== "shared") throw new LibraryError("Choose private or shared visibility.");
  if (visibility === "shared" && user.role !== "admin") throw new LibraryError("Only administrators can publish files to the shared library.", 403);
  const parentId = input.parentId ? validLibraryId(field(input.parentId, "Previous file", 80)) : null;
  return { symbol, companyName, currency, visibility: visibility as LibraryVisibility, parentId };
}

export async function storedItem(id: string): Promise<StoredItem> {
  const { db } = requireStorage();
  const item = await db.prepare(`SELECT ${itemColumns} FROM library_items i WHERE i.id=?`).bind(validLibraryId(id)).first<StoredItem>();
  if (!item) throw new LibraryError("That file was not found.", 404);
  return item;
}
function assertReadable(user: LibraryUser, item: StoredItem): void {
  if (!canReadItem(user, item) || (item.archivedAt && user.role !== "admin" && item.ownerId !== user.id)) throw new LibraryError("That file was not found.", 404);
}

function auditStatement(user: LibraryUser, action: string, targetId: string | null, detail: string) {
  const { db } = requireStorage();
  return db.prepare("INSERT INTO library_audit (id,actor_id,actor_email,action,target_id,detail,created_at) VALUES (?,?,?,?,?,?,?)")
    .bind(crypto.randomUUID(), user.id, user.email, action, targetId, detail.slice(0, 1200), new Date().toISOString());
}

export async function listLibrary(user: LibraryUser, symbol?: string, archived = false): Promise<LibraryItem[]> {
  const { db } = requireStorage();
  const conditions = [archived ? "i.archived_at IS NOT NULL" : "i.archived_at IS NULL"];
  const values: string[] = [];
  if (user.role !== "admin") {
    conditions.push(archived ? "i.owner_id=?" : "(i.owner_id=? OR i.visibility='shared')");
    values.push(user.id);
  }
  if (symbol) { conditions.push("i.symbol=?"); values.push(validCompanySymbol(symbol)); }
  const result = await db.prepare(`SELECT ${itemColumns} FROM library_items i WHERE ${conditions.join(" AND ")} ORDER BY i.created_at DESC LIMIT 300`).bind(...values).all<StoredItem>();
  return result.results.map(publicItem);
}

async function checkedParent(user: LibraryUser, meta: ReturnType<typeof metadata>, kind: LibraryItem["kind"]): Promise<StoredItem | null> {
  if (!meta.parentId) return null;
  const parent = await storedItem(meta.parentId);
  assertReadable(user, parent);
  if (!canEditItem(user, parent)) throw new LibraryError("You can link a new version only to a file you can manage.", 403);
  if (parent.archivedAt) throw new LibraryError("Restore the previous file before linking a new version.", 409);
  if (!parent.latest) throw new LibraryError("A newer version is already linked. Choose the latest file as the previous version.", 409);
  if (parent.symbol !== meta.symbol || parent.kind !== kind || parent.currency !== meta.currency || parent.visibility !== meta.visibility) throw new LibraryError("A new version must use the same ticker, data type, currency, and sharing setting as its previous file.", 409);
  return parent;
}

async function checkUploadAllowance(ownerId: string, incomingBytes = 0) {
  const { db } = requireStorage();
  const result = await db.prepare("SELECT COUNT(*) AS count,COALESCE(SUM(size),0) AS bytes FROM library_items WHERE owner_id=?").bind(ownerId).first<{ count: number; bytes: number }>();
  if (result && (result.count >= 1000 || result.bytes + incomingBytes > 250 * 1024 * 1024)) throw new LibraryError("This upload would exceed the account limit of 1,000 items or 250 MB of original files, including archived files. Ask the administrator for help.", 413);
}

export async function createLibraryUpload(user: LibraryUser, input: Record<string, unknown>, upload: File): Promise<LibraryItem> {
  const { db, bucket } = requireStorage();
  const meta = metadata(input, user);
  if (!upload.size || upload.size > MAX_LIBRARY_FILE_BYTES) throw new LibraryError("Choose a nonempty file no larger than 5 MB.", 413);
  const filename = upload.name.replace(/^.*[\\/]/, "").replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 160);
  if (!filename || !/\.(csv|json|pdf|xlsx|docx)$/i.test(filename)) throw new LibraryError("Use CSV/JSON for analysis or PDF/XLSX/DOCX for document attachments.");
  const bytes = new Uint8Array(await upload.arrayBuffer());
  let parsed: ParsedLibraryData | null = null;
  let mimeType: string;
  if (/\.(csv|json)$/i.test(filename)) {
    parsed = parseDataFile(filename, bytes, meta.symbol);
    mimeType = /\.csv$/i.test(filename) ? "text/csv; charset=utf-8" : "application/json; charset=utf-8";
  } else mimeType = validateAttachment(filename, bytes);
  const kind = parsed?.kind || "attachment";
  const parent = await checkedParent(user, meta, kind);
  const id = crypto.randomUUID(), createdAt = new Date().toISOString();
  const objectKey = `library/${id}/original`, parsedKey = parsed ? `library/${id}/parsed.json` : null;
  const ownerId = parent?.ownerId || user.id, ownerName = parent?.ownerName || user.displayName;
  await checkUploadAllowance(ownerId, bytes.byteLength);
  const item: LibraryItem = { id, ...meta, title: filename, kind, filename, mimeType, size: bytes.byteLength, rowCount: parsed?.rows.length || 0, ownerId, ownerName, createdAt, archivedAt: null, url: null, latest: true };
  try {
    await bucket.put(objectKey, bytes, { httpMetadata: { contentType: mimeType } });
    if (parsedKey && parsed) await bucket.put(parsedKey, JSON.stringify(parsed), { httpMetadata: { contentType: "application/json" } });
    await db.batch([
      db.prepare("INSERT INTO library_items (id,symbol,company_name,title,kind,filename,mime_type,size,row_count,currency,visibility,owner_id,owner_name,parent_id,created_at,archived_at,url,object_key,parsed_key) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NULL,NULL,?,?)")
        .bind(id, meta.symbol, meta.companyName, filename, kind, filename, mimeType, bytes.byteLength, parsed?.rows.length || 0, meta.currency, meta.visibility, ownerId, ownerName, meta.parentId, createdAt, objectKey, parsedKey),
      auditStatement(user, parent ? "file.version_created" : "file.uploaded", id, `${meta.symbol}: ${filename}; ${meta.visibility}; ${parsed?.rows.length || 0} parsed rows${parent ? `; previous ${parent.id}` : ""}`),
    ]);
    return item;
  } catch (error) {
    // Only the just-created objects are removed if their metadata transaction
    // fails; pre-existing uploads and version history are never deleted.
    await bucket.delete([objectKey, ...(parsedKey ? [parsedKey] : [])]).catch(() => {});
    if (error instanceof LibraryError) throw error;
    if (error instanceof Error && /library storage quota exceeded/.test(error.message)) throw new LibraryError("This upload would exceed the account file-library storage limit.", 413);
    throw new LibraryError("The upload could not be saved. A newer version may have been added at the same time; refresh the library and try again.", 409);
  }
}

export async function createLibrarySource(user: LibraryUser, input: Record<string, unknown>): Promise<LibraryItem> {
  const { db } = requireStorage();
  if (input.kind !== "source") throw new LibraryError("Choose a file upload or a website source link.");
  const meta = metadata(input, user), title = field(input.title, "Source title", 160), url = validateSourceUrl(input.url);
  const parent = await checkedParent(user, meta, "source");
  const id = crypto.randomUUID(), createdAt = new Date().toISOString(), ownerId = parent?.ownerId || user.id, ownerName = parent?.ownerName || user.displayName;
  await checkUploadAllowance(ownerId);
  try {
    await db.batch([
      db.prepare("INSERT INTO library_items (id,symbol,company_name,title,kind,filename,mime_type,size,row_count,currency,visibility,owner_id,owner_name,parent_id,created_at,archived_at,url,object_key,parsed_key) VALUES (?,?,?,?,'source',NULL,NULL,0,0,?,?,?,?,?,?,NULL,?,NULL,NULL)")
        .bind(id, meta.symbol, meta.companyName, title, meta.currency, meta.visibility, ownerId, ownerName, meta.parentId, createdAt, url),
      auditStatement(user, "source.created", id, `${meta.symbol}: ${title}; ${meta.visibility}. A saved link only; no website content was fetched.`),
    ]);
  } catch (error) {
    if (error instanceof Error && /library storage quota exceeded/.test(error.message)) throw new LibraryError("This account has reached its file-library storage limit.", 413);
    throw new LibraryError("The source link could not be saved. Refresh the library and try again.", 409);
  }
  return { id, ...meta, title, kind: "source", filename: null, mimeType: null, size: 0, rowCount: 0, ownerId, ownerName, createdAt, archivedAt: null, url, latest: true };
}

export async function libraryDetail(user: LibraryUser, id: string): Promise<LibraryDetail> {
  const { bucket } = requireStorage();
  const item = await storedItem(id);
  assertReadable(user, item);
  if (!item.parsedKey) return { item: publicItem(item), rows: [], analysis: { metrics: [], warnings: [item.kind === "source" ? "This is a saved source link. Its website content has not been fetched or imported." : "This document is stored as an attachment only. Export its financial data to CSV or JSON for calculations."] } };
  const parsedObject = await bucket.get(item.parsedKey);
  if (!parsedObject) throw new LibraryError("The stored data is unavailable. Ask the administrator to check file storage.", 503);
  let parsed: ParsedLibraryData;
  try { parsed = await parsedObject.json<ParsedLibraryData>(); }
  catch { throw new LibraryError("The stored data cannot be read. Ask the administrator to check this upload.", 503); }
  return { item: publicItem(item), rows: parsed.rows, analysis: parsed.analysis };
}

export async function downloadLibraryFile(user: LibraryUser, id: string): Promise<Response> {
  const { bucket } = requireStorage();
  const item = await storedItem(id);
  assertReadable(user, item);
  if (!item.objectKey) throw new LibraryError("This item is a website link, not a downloadable file.", 400);
  const object = await bucket.get(item.objectKey);
  if (!object) throw new LibraryError("The stored file is unavailable. Ask the administrator to check file storage.", 503);
  const filename = (item.filename || "company-file").replace(/["\\\r\n]/g, "_");
  const asciiName = filename.replace(/[^\x20-\x7e]/g, "_");
  return new Response(object.body, { headers: { "Content-Type": item.mimeType || "application/octet-stream", "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(filename)}`, "Content-Length": String(object.size), "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "sandbox" } });
}

export async function changeLibraryItem(user: LibraryUser, id: string, action: unknown): Promise<LibraryItem> {
  const { db } = requireStorage();
  const item = await storedItem(id);
  assertReadable(user, item);
  if (!canEditItem(user, item)) throw new LibraryError("You can change only your own private files. An administrator manages shared files.", 403);
  if (!["archive", "restore", "share", "unshare"].includes(String(action))) throw new LibraryError("Choose archive, restore, share, or unshare.");
  if (action === "share" || action === "unshare") {
    if (user.role !== "admin") throw new LibraryError("Only administrators can change file sharing.", 403);
    if (item.archivedAt) throw new LibraryError("Restore the file before changing its sharing setting.", 409);
    const children = await db.prepare("SELECT id FROM library_items WHERE parent_id=? LIMIT 1").bind(item.id).first();
    if (item.parentId || children) throw new LibraryError("Version chains keep one sharing setting. Upload a separate file without a previous-version link to change sharing.", 409);
    const visibility = action === "share" ? "shared" : "private";
    await db.batch([db.prepare("UPDATE library_items SET visibility=? WHERE id=?").bind(visibility, item.id), auditStatement(user, `file.${action}`, item.id, `${item.symbol}: ${item.title}`)]);
  } else if (action === "archive") {
    if (item.archivedAt) throw new LibraryError("This file is already archived.", 409);
    if (!item.latest) throw new LibraryError("Archive the latest version first so previous-file links remain intact.", 409);
    try { await db.batch([db.prepare("UPDATE library_items SET archived_at=? WHERE id=?").bind(new Date().toISOString(), item.id), auditStatement(user, "file.archived", item.id, `${item.symbol}: ${item.title}`)]); }
    catch { throw new LibraryError("A newer version was linked while this file was being archived. Refresh the library and archive the latest version first.", 409); }
  } else {
    if (!item.archivedAt) throw new LibraryError("This file is already active.", 409);
    if (item.parentId) {
      const parent = await storedItem(item.parentId);
      if (parent.archivedAt) throw new LibraryError("Restore the previous file first.", 409);
      const sibling = await db.prepare("SELECT id FROM library_items WHERE parent_id=? AND archived_at IS NULL AND id<>? LIMIT 1").bind(item.parentId, item.id).first();
      if (sibling) throw new LibraryError("A replacement version is already active. Archive it before restoring this version.", 409);
    }
    try { await db.batch([db.prepare("UPDATE library_items SET archived_at=NULL WHERE id=?").bind(item.id), auditStatement(user, "file.restored", item.id, `${item.symbol}: ${item.title}`)]); }
    catch { throw new LibraryError("This version cannot be restored while another replacement is active.", 409); }
  }
  return publicItem(await storedItem(id));
}

export async function listUsers(user: LibraryUser): Promise<LibraryUser[]> {
  if (user.role !== "admin") throw new LibraryError("Only administrators can view user accounts.", 403);
  const { db } = requireStorage();
  const result = await db.prepare("SELECT id,email,display_name AS displayName,role,created_at AS createdAt FROM library_users ORDER BY created_at DESC LIMIT 300").all<LibraryUser>();
  return result.results.map(account => ({ ...account, role: isRootAdmin(account) ? "admin" : account.role, rootAdmin: isRootAdmin(account) }));
}

export async function changeUserRole(user: LibraryUser, targetId: unknown, role: unknown): Promise<LibraryUser> {
  if (user.role !== "admin") throw new LibraryError("Only administrators can change account roles.", 403);
  if (role !== "admin" && role !== "user") throw new LibraryError("Choose the admin or user role.");
  const { db } = requireStorage();
  const id = field(targetId, "User identifier", 256);
  const target = await db.prepare("SELECT id,email,display_name AS displayName,role,created_at AS createdAt FROM library_users WHERE id=?").bind(id).first<LibraryUser>();
  if (!target) throw new LibraryError("That user has not signed in to this workspace yet.", 404);
  if (isRootAdmin(target) && role !== "admin") throw new LibraryError("The configured workspace owner must remain an administrator.", 409);
  if (target.id === user.id && role !== "admin") throw new LibraryError("Ask another administrator to change your role. You cannot remove your own administrator access.", 409);
  if (role === "user" && target.role === "admin") {
    const others = await db.prepare("SELECT COUNT(*) AS count FROM library_users WHERE role='admin' AND id<>?").bind(id).first<{ count: number }>();
    // Root admins are kept as admins at sign-in and cannot be demoted above.
    if (!others?.count && !isRootAdmin(user)) throw new LibraryError("At least one administrator must remain.", 409);
  }
  try { await db.batch([db.prepare("UPDATE library_users SET role=?,updated_at=? WHERE id=?").bind(role, new Date().toISOString(), id), auditStatement(user, "user.role_changed", id, `${target.email}: ${target.role} → ${role}`)]); }
  catch { throw new LibraryError("The role could not be changed. At least one administrator must remain; refresh and try again.", 409); }
  return { ...target, role, rootAdmin: isRootAdmin(target) };
}

export async function listAudit(user: LibraryUser): Promise<AuditEvent[]> {
  if (user.role !== "admin") throw new LibraryError("Only administrators can view the audit log.", 403);
  const { db } = requireStorage();
  const result = await db.prepare("SELECT id,actor_id AS actorId,actor_email AS actorEmail,action,target_id AS targetId,detail,created_at AS createdAt FROM library_audit ORDER BY created_at DESC LIMIT 300").all<AuditEvent>();
  return result.results;
}
