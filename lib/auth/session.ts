import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Role, type User } from "@prisma/client";
import { db } from "@/lib/db";

export const ADMIN_COOKIE = "vijaya_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters.");
  return secret;
}

function hashToken(token: string) {
  return createHmac("sha256", sessionSecret()).update(token).digest("hex");
}

export async function createAdminSession(userId: string, request?: Request) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  await db.adminSession.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      userAgent: request?.headers.get("user-agent")?.slice(0, 500) ?? null,
      ipAddress: request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 100) ?? null,
    },
  });
  await db.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/admin", maxAge: SESSION_MAX_AGE_SECONDS, expires: expiresAt });
}

export async function getAdminSession(): Promise<{ user: User; expiresAt: Date } | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const tokenHash = hashToken(token);
  const session = await db.adminSession.findUnique({ where: { tokenHash }, include: { user: true } });
  if (!session) return null;
  const invalid = session.expiresAt <= new Date() || !session.user.active || !Object.values(Role).includes(session.user.role);
  if (invalid) {
    await db.adminSession.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  await db.adminSession.update({ where: { id: session.id }, data: { lastUsedAt: new Date() } });
  return { user: session.user, expiresAt: session.expiresAt };
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

export async function getCurrentAdminSessionRecord() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return db.adminSession.findUnique({ where: { tokenHash: hashToken(token) } });
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (token) await db.adminSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  cookieStore.set(ADMIN_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/admin", maxAge: 0, expires: new Date(0) });
}

export async function destroyOtherAdminSessions(userId: string) {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const currentHash = token ? hashToken(token) : "";
  await db.adminSession.deleteMany({ where: { userId, tokenHash: { not: currentHash } } });
}

export async function destroyAllAdminSessions(userId: string) {
  await db.adminSession.deleteMany({ where: { userId } });
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/admin", maxAge: 0, expires: new Date(0) });
}
