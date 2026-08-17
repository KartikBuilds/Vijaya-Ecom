import "server-only";
import { createHmac, randomUUID } from "node:crypto";
import { db } from "@/lib/db";

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters.");
  return value;
}

function digest(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

function normalizedIdentifier(identifier: string) {
  return identifier.trim().toLowerCase();
}

function networkKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || "unknown";
}

function throttleKeys(scope: "admin" | "customer", identifier: string, request: Request) {
  return [
    { scope: `${scope}:identifier`, keyHash: digest(normalizedIdentifier(identifier)) },
    { scope: `${scope}:network`, keyHash: digest(networkKey(request)) },
  ];
}

export async function assertLoginAllowed(scope: "admin" | "customer", identifier: string, request: Request) {
  const now = new Date();
  const records = await db.authThrottle.findMany({ where: { OR: throttleKeys(scope, identifier, request) } });
  if (records.some((record) => record.blockedUntil && record.blockedUntil > now)) return false;
  return true;
}

export async function recordLoginFailure(scope: "admin" | "customer", identifier: string, request: Request) {
  const now = new Date();
  const blockUntil = new Date(now.getTime() + BLOCK_MS);
  await db.$transaction(throttleKeys(scope, identifier, request).map((key) => db.$executeRaw`
    INSERT INTO "AuthThrottle" ("id", "scope", "keyHash", "attempts", "windowStart", "lastAttemptAt", "blockedUntil")
    VALUES (${randomUUID()}, ${key.scope}, ${key.keyHash}, 1, ${now}, ${now}, NULL)
    ON CONFLICT ("scope", "keyHash") DO UPDATE SET
      "attempts" = CASE
        WHEN ${now} - "AuthThrottle"."windowStart" > (${WINDOW_MS} * interval '1 millisecond') THEN 1
        ELSE "AuthThrottle"."attempts" + 1
      END,
      "windowStart" = CASE
        WHEN ${now} - "AuthThrottle"."windowStart" > (${WINDOW_MS} * interval '1 millisecond') THEN ${now}
        ELSE "AuthThrottle"."windowStart"
      END,
      "blockedUntil" = CASE
        WHEN ${now} - "AuthThrottle"."windowStart" > (${WINDOW_MS} * interval '1 millisecond') THEN NULL
        WHEN "AuthThrottle"."attempts" + 1 >= ${MAX_ATTEMPTS} THEN ${blockUntil}
        ELSE "AuthThrottle"."blockedUntil"
      END,
      "lastAttemptAt" = ${now}
  `));
}

export async function clearLoginFailures(scope: "admin" | "customer", identifier: string, request: Request) {
  await db.authThrottle.deleteMany({ where: { OR: throttleKeys(scope, identifier, request).filter((key) => key.scope.endsWith(":identifier")) } });
}
