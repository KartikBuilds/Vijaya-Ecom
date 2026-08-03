import "server-only";
import { compare, hash } from "bcryptjs";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function authenticateAdmin(emailValue: string, password: string) {
  const email = emailValue.trim().toLowerCase();
  if (!emailPattern.test(email) || email.length > 254 || password.length < 1 || password.length > 128) return null;
  const user = await db.user.findUnique({ where: { email } });
  const passwordHash = user?.passwordHash ?? await hash("invalid-admin-credential", 12);
  const validPassword = await compare(password, passwordHash);
  if (!user || !validPassword || !user.active || user.role !== Role.ADMIN) return null;
  return user;
}
