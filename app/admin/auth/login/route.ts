import { NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/auth/credentials";
import { createAdminSession } from "@/lib/auth/session";
import { isSameOriginMutation } from "@/lib/auth/request";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return new NextResponse("Forbidden", { status: 403 });
  try {
    const formData = await request.formData();
    const user = await authenticateAdmin(String(formData.get("email") ?? ""), String(formData.get("password") ?? ""));
    if (!user) return NextResponse.redirect(new URL("/admin/login?error=invalid", request.url), 303);
    await createAdminSession(user.id);
    return NextResponse.redirect(new URL("/admin", request.url), 303);
  } catch {
    console.error("Admin login failed due to a server error.");
    return NextResponse.redirect(new URL("/admin/login?error=invalid", request.url), 303);
  }
}
