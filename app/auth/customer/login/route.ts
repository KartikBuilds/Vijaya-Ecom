import { NextResponse } from "next/server";
import { authenticateCustomer, createCustomerSession, normalizeCustomerEmail } from "@/lib/auth/customer";
import { authenticateAdmin } from "@/lib/auth/credentials";
import { createAdminSession } from "@/lib/auth/session";
import { isSameOriginMutation } from "@/lib/auth/request";
import { assertLoginAllowed, clearLoginFailures, recordLoginFailure } from "@/lib/auth/throttle";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return new NextResponse("Forbidden", { status: 403 });
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const redirectTo = new URL("/login?error=invalid", request.headers.get("origin") || request.url);
  
  if (!await assertLoginAllowed("customer", email, request)) return NextResponse.redirect(redirectTo, 303);
  
  const admin = await authenticateAdmin(email, password);
  if (admin) {
    if (!await assertLoginAllowed("admin", email, request)) return NextResponse.redirect(redirectTo, 303);
    await clearLoginFailures("admin", email, request);
    await createAdminSession(admin.id, request);
    return NextResponse.redirect(new URL("/admin", request.headers.get("origin") || request.url), 303);
  }

  const customer = await authenticateCustomer(email, password);
  if (!customer) {
    await recordLoginFailure("customer", email, request);
    // If it was a failed admin login, also throttle admin so they don't brute force admins indefinitely via customer endpoint
    await recordLoginFailure("admin", email, request); 
    return NextResponse.redirect(redirectTo, 303);
  }
  
  await clearLoginFailures("customer", normalizeCustomerEmail(email), request);
  await createCustomerSession(customer.id, request, { remember: form.get("remember") === "on" });
  return NextResponse.redirect(new URL("/", request.headers.get("origin") || request.url), 303);
}
