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

export async function createAdminSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  await db.adminSession.create({ data: { userId, tokenHash: hashToken(token), expiresAt } });
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE_SECONDS, expires: expiresAt });
}

export async function getAdminSession(): Promise<{ user: User; expiresAt: Date } | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const tokenHash = hashToken(token);
  const session = await db.adminSession.findUnique({ where: { tokenHash }, include: { user: true } });
  if (!session) return null;
  const invalid = session.expiresAt <= new Date() || !session.user.active || session.user.role !== Role.ADMIN;
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

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (token) await db.adminSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  cookieStore.set(ADMIN_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0, expires: new Date(0) });
}
