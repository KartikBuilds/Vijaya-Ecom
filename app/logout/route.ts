import { NextResponse } from "next/server";
import { destroyCustomerSession } from "@/lib/auth/customer";
import { isSameOriginMutation } from "@/lib/auth/request";

export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/", request.headers.get("origin") || request.url), 303);
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return new NextResponse("Forbidden", { status: 403 });
  await destroyCustomerSession();
  return NextResponse.redirect(new URL("/", request.headers.get("origin") || request.url), 303);
}
