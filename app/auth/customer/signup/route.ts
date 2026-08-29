import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { createCustomerAccount, createCustomerSession } from "@/lib/auth/customer";
import { customerSignupSchema } from "@/lib/auth/customer-validation";
import { isSameOriginMutation } from "@/lib/auth/request";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    console.error("Origin check failed!", request.url, request.headers.get("origin"), request.headers.get("sec-fetch-site"));
    return new NextResponse("Forbidden", { status: 403 });
  }
  const form = await request.formData();
  const entries = Object.fromEntries(form);
  console.log("Signup Form entries:", entries);
  const parsed = customerSignupSchema.safeParse(entries);
  if (!parsed.success) {
    console.error("Signup validation failed:", parsed.error);
    return NextResponse.redirect(new URL("/signup?error=validation", request.url), 303);
  }
  try {
    const customer = await createCustomerAccount({ name: parsed.data.name, email: parsed.data.email, phone: parsed.data.mobile, password: parsed.data.password });
    if (!customer) return NextResponse.redirect(new URL("/signup?error=validation", request.url), 303);
    await createCustomerSession(customer.id, request);
    return NextResponse.redirect(new URL("/", request.url), 303);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.redirect(new URL("/signup?error=exists", request.url), 303);
    console.error("Customer signup failed:", error);
    return NextResponse.redirect(new URL("/signup?error=validation", request.url), 303);
  }
}
