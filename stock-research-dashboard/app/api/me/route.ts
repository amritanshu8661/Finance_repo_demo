import { adminConfigured, getLibraryUser, libraryError, libraryJson, storageReady } from "@/services/library-access";
export const dynamic = "force-dynamic";
export async function GET() {
  try { return libraryJson({ user: await getLibraryUser(), storageReady: storageReady(), adminConfigured: adminConfigured() }); }
  catch (error) { return libraryError(error); }
}
