import { apiError, summarizeNews } from "@/services/research";
import { authorizeResearch, readSummaryBody } from "@/lib/validation/research-request";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    await authorizeResearch(request, true);
    const body = await readSummaryBody(request);
    return Response.json(await summarizeNews(body.symbol, body.news), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
