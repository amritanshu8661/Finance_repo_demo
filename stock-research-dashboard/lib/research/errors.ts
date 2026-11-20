export class ResearchError extends Error {
  constructor(message: string, public status = 502) { super(message); }
}

export function apiError(error: unknown): Response {
  return Response.json({ error: error instanceof ResearchError ? error.message : "Something went wrong while loading this research. Please try again." }, { status: error instanceof ResearchError ? error.status : 500, headers: { "Cache-Control": "no-store" } });
}
