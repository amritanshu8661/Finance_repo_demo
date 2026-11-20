import { apiError, searchCompanies } from "@/services/research";
import { authorizeResearch } from "@/lib/validation/research-request";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    await authorizeResearch(request);
    const q = new URL(request.url).searchParams.get("q") ?? "";
    return Response.json({ results: await searchCompanies(q) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
