import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { compare, hash } from "bcryptjs";
import { CustomerStatus } from "@prisma/client";
import { db } from "@/lib/db";

export const CUSTOMER_COOKIE = "vijaya_customer_session";
const REMEMBER_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;
const TOUCH_INTERVAL_MS = 5 * 60 * 1000;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters.");
  return secret;
}

function hashToken(token: string) {
  return createHmac("sha256", sessionSecret()).update(token).digest("hex");
}

export function normalizeCustomerEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function createCustomerAccount(input: { name: string; email: string; phone?: string | null; password: string }) {
  const email = normalizeCustomerEmail(input.email);
  if (!emailPattern.test(email) || input.password.length < 8 || input.password.length > 128) return null;
  return db.customer.create({
    data: {
      name: input.name.trim(),
      email,
      phone: input.phone?.trim() || null,
      passwordHash: await hash(input.password, 12),
      status: CustomerStatus.ACTIVE,
      activities: { create: { type: "ACCOUNT_CREATED", summary: "Customer account created." } },
    },
  });
}

export async function authenticateCustomer(emailValue: string, password: string) {
  const email = normalizeCustomerEmail(emailValue);
  if (!emailPattern.test(email) || password.length < 1 || password.length > 128) return null;
  const customer = await db.customer.findUnique({ where: { email } });
  const passwordHash = customer?.passwordHash ?? await hash("invalid-customer-credential", 12);
  const valid = await compare(password, passwordHash);
  if (!customer || !valid || customer.status !== CustomerStatus.ACTIVE || !customer.passwordHash) return null;
  return customer;
}

export async function createCustomerSession(customerId: string, request?: Request, options: { remember?: boolean } = {}) {
  const remember = options.remember ?? true;
  const maxAge = remember ? REMEMBER_MAX_AGE_SECONDS : SESSION_MAX_AGE_SECONDS;
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + maxAge * 1000);
  await db.customerSession.create({
    data: {
      customerId,
      tokenHash: hashToken(token),
      expiresAt,
      userAgent: request?.headers.get("user-agent")?.slice(0, 500) ?? null,
      ipAddress: request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 100) ?? null,
    },
  });
  await db.customer.update({ where: { id: customerId }, data: { lastLoginAt: new Date() } });
  const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
  (await cookies()).set(CUSTOMER_COOKIE, token, remember ? { ...cookieOptions, maxAge, expires: expiresAt } : cookieOptions);
}

export async function getCustomerSession(options: { touch?: boolean } = { touch: true }) {
  const token = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;
  const session = await db.customerSession.findUnique({ where: { tokenHash: hashToken(token) }, include: { customer: true } });
  if (!session || session.expiresAt <= new Date() || session.customer.status !== CustomerStatus.ACTIVE) {
    if (session) await db.customerSession.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  if (options.touch !== false && Date.now() - session.lastUsedAt.getTime() > TOUCH_INTERVAL_MS) {
    await db.customerSession.update({ where: { id: session.id }, data: { lastUsedAt: new Date() } });
  }
  return { customer: session.customer, expiresAt: session.expiresAt };
}

export async function getPublicCustomerIdentity() {
  const session = await getCustomerSession({ touch: false });
  if (!session) return null;
  return {
    id: session.customer.id,
    name: session.customer.name ?? session.customer.email ?? "Customer",
    email: session.customer.email ?? "",
  };
}

export async function destroyCustomerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_COOKIE)?.value;
  if (token) await db.customerSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  cookieStore.set(CUSTOMER_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0, expires: new Date(0) });
}
