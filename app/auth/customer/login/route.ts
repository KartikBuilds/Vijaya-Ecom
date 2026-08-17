import { NextResponse } from "next/server";
import { authenticateCustomer, createCustomerSession, normalizeCustomerEmail } from "@/lib/auth/customer";
import { isSameOriginMutation } from "@/lib/auth/request";
import { assertLoginAllowed, clearLoginFailures, recordLoginFailure } from "@/lib/auth/throttle";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return new NextResponse("Forbidden", { status: 403 });
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const redirectTo = new URL("/login?error=invalid", request.url);
  if (!await assertLoginAllowed("customer", email, request)) return NextResponse.redirect(redirectTo, 303);
  const customer = await authenticateCustomer(email, String(form.get("password") ?? ""));
  if (!customer) {
    await recordLoginFailure("customer", email, request);
    return NextResponse.redirect(redirectTo, 303);
  }
  await clearLoginFailures("customer", normalizeCustomerEmail(email), request);
  await createCustomerSession(customer.id, request);
  return NextResponse.redirect(new URL("/", request.url), 303);
}
