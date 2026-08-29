import { NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/auth/credentials";
import { createAdminSession } from "@/lib/auth/session";
import { isSameOriginMutation } from "@/lib/auth/request";
import { assertLoginAllowed, clearLoginFailures, recordLoginFailure } from "@/lib/auth/throttle";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return new NextResponse("Forbidden", { status: 403 });
  try {
    const formData = await request.formData();
    const identifier = String(formData.get("identifier") ?? formData.get("email") ?? "");
    if (!await assertLoginAllowed("admin", identifier, request)) return NextResponse.redirect(new URL("/admin/login?error=invalid", request.headers.get("origin") || request.url), 303);
    const user = await authenticateAdmin(identifier, String(formData.get("password") ?? ""));
    if (!user) {
      await recordLoginFailure("admin", identifier, request);
      return NextResponse.redirect(new URL("/admin/login?error=invalid", request.headers.get("origin") || request.url), 303);
    }
    await clearLoginFailures("admin", identifier, request);
    await createAdminSession(user.id, request);
    return NextResponse.redirect(new URL("/admin", request.headers.get("origin") || request.url), 303);
  } catch {
    console.error("Admin login failed due to a server error.");
    return NextResponse.redirect(new URL("/admin/login?error=invalid", request.headers.get("origin") || request.url), 303);
  }
}
