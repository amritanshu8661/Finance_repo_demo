import { assertSameOrigin, boundedJson, libraryError, libraryJson, requireLibraryUser } from "@/services/library-access";
import { changeLibraryItem, libraryDetail } from "@/services/library";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try { return libraryJson(await libraryDetail(await requireLibraryUser(), (await context.params).id)); }
  catch (error) { return libraryError(error); }
}
export async function PATCH(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const user = await requireLibraryUser();
    const input = await boundedJson(request, 2048);
    return libraryJson({ item: await changeLibraryItem(user, (await context.params).id, input.action) });
  } catch (error) { return libraryError(error); }
}
