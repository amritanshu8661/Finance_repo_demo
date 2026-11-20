import { apiError, getResearch } from "@/services/research";
import { authorizeResearch } from "@/lib/validation/research-request";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    await authorizeResearch(request);
    return Response.json(await getResearch(new URL(request.url).searchParams.get("symbol")), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
