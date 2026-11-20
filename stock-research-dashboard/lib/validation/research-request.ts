import { getChatGPTUser } from "@/lib/integrations/sites/auth";
import { providerStatus, ResearchError } from "@/services/research";

export async function authorizeResearch(request: Request, mutation = false) {
  if (mutation) {
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(request.url).origin) {
      throw new ResearchError("Open Stockwise and send this request from the same website.", 403);
    }
  }
  if (providerStatus().marketConnected) {
    const user = await getChatGPTUser();
    if (!user) throw new ResearchError("Sign in to access connected market data and AI services.", 401);
  }
}

export async function readSummaryBody(request: Request): Promise<Record<string, unknown>> {
  if (!(request.headers.get("content-type") ?? "").includes("application/json")) {
    throw new ResearchError("Send the summary request as JSON.", 415);
  }
  const limit = 25_000;
  const declared = request.headers.get("content-length");
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > limit)) {
    throw new ResearchError("The summary request is too large.", 413);
  }
  const reader = request.body?.getReader();
  if (!reader) throw new ResearchError("Send a company and its news articles.", 400);
  const decoder = new TextDecoder();
  let size = 0, text = "";
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > limit) { await reader.cancel(); throw new ResearchError("The summary request is too large.", 413); }
      text += decoder.decode(next.value, { stream: true });
    }
    text += decoder.decode();
  } finally { reader.releaseLock(); }
  let body: unknown;
  try { body = JSON.parse(text); }
  catch { throw new ResearchError("The summary request could not be read.", 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new ResearchError("Send a company and its news articles.", 400);
  return body as Record<string, unknown>;
}
