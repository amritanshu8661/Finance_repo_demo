import { providerStatus } from "@/services/research";
export const dynamic = "force-dynamic";
export function GET() {
  return Response.json(providerStatus(), { headers: { "Cache-Control": "no-store" } });
}
