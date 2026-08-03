import { NextResponse } from "next/server";
import { destroyAdminSession } from "@/lib/auth/session";
import { isSameOriginMutation } from "@/lib/auth/request";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return new NextResponse("Forbidden", { status: 403 });
  try {
    await destroyAdminSession();
  } catch {
    console.error("Admin logout encountered a server error.");
  }
  return NextResponse.redirect(new URL("/admin/login", request.url), 303);
}
