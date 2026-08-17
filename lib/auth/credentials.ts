import "server-only";
import { compare, hash } from "bcryptjs";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernamePattern = /^[A-Za-z0-9_.-]{3,40}$/;

export async function authenticateAdmin(identifierValue: string, password: string) {
  const identifier = identifierValue.trim();
  const email = identifier.toLowerCase();
  if (identifier.length < 3 || identifier.length > 254 || password.length < 1 || password.length > 128) return null;
  const user = emailPattern.test(email)
    ? await db.user.findUnique({ where: { email } })
    : usernamePattern.test(identifier)
      ? await db.user.findUnique({ where: { username: identifier } })
      : null;
  const passwordHash = user?.passwordHash ?? await hash("invalid-admin-credential", 12);
  const validPassword = await compare(password, passwordHash);
  if (!user || !validPassword || !user.active || !Object.values(Role).includes(user.role)) return null;
  return user;
}
