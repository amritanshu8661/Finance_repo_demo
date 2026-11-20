import { assertSameOrigin, boundedJson, libraryError, libraryJson, requireLibraryUser } from "@/services/library-access";
import { changeUserRole, listUsers } from "@/services/library";
export const dynamic = "force-dynamic";
export async function GET() {
  try { return libraryJson({ users: await listUsers(await requireLibraryUser(true)) }); }
  catch (error) { return libraryError(error); }
}
export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireLibraryUser(true);
    const input = await boundedJson(request, 2048);
    return libraryJson({ user: await changeUserRole(user, input.userId, input.role) });
  } catch (error) { return libraryError(error); }
}
