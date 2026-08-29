import "server-only";

export function isSameOriginMutation(request: Request) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "same-origin") return true;
  if (!origin) return fetchSite === "none";
  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    if (originUrl.origin === requestUrl.origin) return true;
    if (originUrl.hostname === "127.0.0.1" && requestUrl.hostname === "localhost" && originUrl.port === requestUrl.port) return true;
    return false;
  } catch { return false; }
}
