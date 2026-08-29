import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { createCustomerAccount, createCustomerSession } from "@/lib/auth/customer";
import { customerSignupSchema } from "@/lib/auth/customer-validation";
import { isSameOriginMutation } from "@/lib/auth/request";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return new NextResponse("Forbidden", { status: 403 });
  const form = await request.formData();
  const parsed = customerSignupSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return NextResponse.redirect(new URL("/signup?error=validation", request.url), 303);
  try {
    const customer = await createCustomerAccount({ name: parsed.data.name, email: parsed.data.email, phone: parsed.data.mobile, password: parsed.data.password });
    if (!customer) return NextResponse.redirect(new URL("/signup?error=validation", request.url), 303);
    await createCustomerSession(customer.id, request);
    return NextResponse.redirect(new URL("/", request.url), 303);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.redirect(new URL("/signup?error=exists", request.url), 303);
    console.error("Customer signup failed.");
    return NextResponse.redirect(new URL("/signup?error=validation", request.url), 303);
  }
}
