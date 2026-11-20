import { libraryError, requireLibraryUser } from "@/services/library-access";
import { downloadLibraryFile } from "@/services/library";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try { return await downloadLibraryFile(await requireLibraryUser(), (await context.params).id); }
  catch (error) { return libraryError(error); }
}
