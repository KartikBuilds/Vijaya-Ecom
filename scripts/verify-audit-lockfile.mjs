import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const next = lock.packages?.["node_modules/next"]?.version;
const prisma = lock.packages?.["node_modules/prisma"]?.version;
const prismaClient = lock.packages?.["node_modules/@prisma/client"]?.version;
const nanoid = lock.packages?.["node_modules/nanoid"]?.version;

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (pkg.dependencies?.prisma) fail("Prisma CLI must not be a production dependency.");
if (!pkg.devDependencies?.prisma) fail("Prisma CLI must remain a devDependency.");
if (!next?.startsWith("15.5.")) fail(`Unexpected Next.js lockfile version: ${next}`);
if (prisma !== prismaClient) fail(`Prisma CLI/client version mismatch: prisma=${prisma}, @prisma/client=${prismaClient}`);
if (!nanoid || nanoid.localeCompare("3.3.18", undefined, { numeric: true }) < 0) fail(`nanoid must resolve to >=3.3.18, found ${nanoid ?? "missing"}`);

console.log(`Audit lockfile verified: nanoid ${nanoid}, Prisma ${prisma}, Next ${next}.`);
