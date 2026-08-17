import { NextResponse } from "next/server";
import { destroyCustomerSession } from "@/lib/auth/customer";

export async function GET(request: Request) {
  await destroyCustomerSession();
  return NextResponse.redirect(new URL("/", request.url), 303);
}

export async function POST(request: Request) {
  await destroyCustomerSession();
  return NextResponse.redirect(new URL("/", request.url), 303);
}
