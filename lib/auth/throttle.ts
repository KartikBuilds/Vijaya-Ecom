import "server-only";
import { createHmac } from "node:crypto";
import { db } from "@/lib/db";

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters.");
  return value;
}

function keyHash(identifier: string, request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return createHmac("sha256", secret()).update(`${identifier.trim().toLowerCase()}|${ip}`).digest("hex");
}

export async function assertLoginAllowed(scope: "admin" | "customer", identifier: string, request: Request) {
  const now = new Date();
  const record = await db.authThrottle.findUnique({ where: { scope_keyHash: { scope, keyHash: keyHash(identifier, request) } } });
  if (record?.blockedUntil && record.blockedUntil > now) return false;
  return true;
}

export async function recordLoginFailure(scope: "admin" | "customer", identifier: string, request: Request) {
  const now = new Date();
  const hash = keyHash(identifier, request);
  const existing = await db.authThrottle.findUnique({ where: { scope_keyHash: { scope, keyHash: hash } } });
  if (!existing || now.getTime() - existing.windowStart.getTime() > WINDOW_MS) {
    await db.authThrottle.upsert({
      where: { scope_keyHash: { scope, keyHash: hash } },
      update: { attempts: 1, windowStart: now, blockedUntil: null, lastAttemptAt: now },
      create: { scope, keyHash: hash, attempts: 1, windowStart: now, lastAttemptAt: now },
    });
    return;
  }
  const attempts = existing.attempts + 1;
  await db.authThrottle.update({
    where: { id: existing.id },
    data: { attempts, lastAttemptAt: now, blockedUntil: attempts >= MAX_ATTEMPTS ? new Date(now.getTime() + BLOCK_MS) : existing.blockedUntil },
  });
}

export async function clearLoginFailures(scope: "admin" | "customer", identifier: string, request: Request) {
  await db.authThrottle.deleteMany({ where: { scope, keyHash: keyHash(identifier, request) } });
}
