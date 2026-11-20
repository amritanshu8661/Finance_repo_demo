import { LibraryError } from "@/lib/library/contracts";

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("Origin");
  if (!origin || origin === "null") throw new LibraryError("This change requires a request from this website. Reload the page and try again.", 403);
  try {
    if (new URL(origin).origin !== new URL(request.url).origin) throw new Error("Cross-origin request");
  } catch { throw new LibraryError("Requests from another website are not allowed.", 403); }
  if (request.headers.get("Sec-Fetch-Site") === "cross-site") throw new LibraryError("Requests from another website are not allowed.", 403);
}

export async function readBoundedBody(request: Request, limit: number): Promise<Uint8Array> {
  const declared = Number(request.headers.get("Content-Length"));
  if (Number.isFinite(declared) && declared > limit) throw new LibraryError("The upload is too large. The maximum file size is 5 MB.", 413);
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > limit) { await reader.cancel(); throw new LibraryError("The upload is too large. The maximum file size is 5 MB.", 413); }
      chunks.push(next.value);
    }
  } finally { reader.releaseLock(); }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return body;
}

export async function boundedJson(request: Request, limit = 20_000): Promise<Record<string, unknown>> {
  const bytes = await readBoundedBody(request, limit);
  let value: unknown;
  try { value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { throw new LibraryError("Send a valid JSON request."); }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new LibraryError("Send a JSON object.");
  return value as Record<string, unknown>;
}

