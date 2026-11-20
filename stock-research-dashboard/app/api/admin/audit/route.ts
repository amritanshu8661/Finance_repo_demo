import { libraryError, libraryJson, requireLibraryUser } from "@/services/library-access";
import { listAudit } from "@/services/library";
export const dynamic = "force-dynamic";
export async function GET() {
  try { return libraryJson({ events: await listAudit(await requireLibraryUser(true)) }); }
  catch (error) { return libraryError(error); }
}
