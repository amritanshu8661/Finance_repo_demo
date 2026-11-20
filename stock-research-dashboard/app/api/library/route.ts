import { assertSameOrigin, boundedJson, libraryError, libraryJson, readBoundedBody, requireLibraryUser, LibraryError } from "@/services/library-access";
import { MAX_LIBRARY_REQUEST_BYTES } from "@/lib/library/contracts";
import { createLibrarySource, createLibraryUpload, listLibrary } from "@/services/library";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireLibraryUser();
    const query = new URL(request.url).searchParams;
    return libraryJson({ items: await listLibrary(user, query.get("symbol") || undefined, query.get("archived") === "1") });
  } catch (error) { return libraryError(error); }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireLibraryUser();
    const contentType = request.headers.get("Content-Type") || "";
    if (contentType.includes("application/json")) {
      const input = await boundedJson(request);
      return libraryJson({ item: await createLibrarySource(user, input) }, 201);
    }
    if (!contentType.startsWith("multipart/form-data")) throw new LibraryError("Upload a file using the upload form, or save a source link as JSON.", 415);
    const body = await readBoundedBody(request, MAX_LIBRARY_REQUEST_BYTES);
    let form: FormData;
    try { form = await new Response(body.buffer as ArrayBuffer, { headers: { "Content-Type": contentType } }).formData(); }
    catch { throw new LibraryError("The upload form could not be read. Select your file and try again."); }
    const fields = ["file", "symbol", "companyName", "currency", "visibility", "parentId"];
    for (const key of form.keys()) if (!fields.includes(key) || form.getAll(key).length > 1) throw new LibraryError("The upload form contains an unexpected or repeated field.");
    const upload = form.get("file");
    if (!upload || typeof upload === "string") throw new LibraryError("Select a file before uploading.");
    const metadata = Object.fromEntries(fields.filter(key => key !== "file").map(key => [key, form.get(key)]));
    return libraryJson({ item: await createLibraryUpload(user, metadata, upload) }, 201);
  } catch (error) { return libraryError(error); }
}
