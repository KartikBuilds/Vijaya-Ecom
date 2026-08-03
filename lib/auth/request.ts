import "server-only";

export function isSameOriginMutation(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") !== "cross-site";
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}
