import { mkdtempSync, cpSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const temp = mkdtempSync(join(tmpdir(), "vijaya-prod-audit-"));

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: options.cwd ?? root, encoding: "utf8", shell: false });
  if (options.allowFailure) return result;
  if (result.status !== 0) {
    process.stderr.write(result.stdout);
    process.stderr.write(result.stderr);
    throw new Error(`${command} ${args.join(" ")} failed`);
  }
  return result;
}

function rootPackage() {
  return JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
}

function installed(packageName) {
  return existsSync(join(temp, "node_modules", packageName));
}

function highOrCritical(vulnerability) {
  return vulnerability.severity === "high" || vulnerability.severity === "critical";
}

function hasAdvisory(vulnerability, ghsa) {
  return JSON.stringify(vulnerability.via ?? []).includes(ghsa);
}

cpSync(join(root, "package.json"), join(temp, "package.json"));
cpSync(join(root, "package-lock.json"), join(temp, "package-lock.json"));

run("npm", ["ci", "--omit=dev", "--include=optional", "--ignore-scripts", "--legacy-peer-deps"], { cwd: temp });

const productionPresence = {
  prisma: installed("prisma"),
  "@prisma/config": installed("@prisma/config"),
  "deepmerge-ts": installed("deepmerge-ts"),
};

const audit = run("npm", ["audit", "--omit=dev", "--audit-level=high", "--json"], { allowFailure: true });
let parsed;
try {
  parsed = JSON.parse(audit.stdout || "{}");
} catch {
  process.stderr.write(audit.stdout);
  process.stderr.write(audit.stderr);
  throw new Error("npm audit did not return parseable JSON.");
}

const pkg = rootPackage();
const failures = [];

for (const [name, vulnerability] of Object.entries(parsed.vulnerabilities ?? {})) {
  if (!highOrCritical(vulnerability)) continue;
  const allowedDeepmerge =
    name === "deepmerge-ts" &&
    hasAdvisory(vulnerability, "GHSA-ggr8-5vv4-36mx") &&
    pkg.devDependencies?.prisma &&
    !pkg.dependencies?.prisma &&
    !productionPresence.prisma &&
    !productionPresence["@prisma/config"] &&
    !productionPresence["deepmerge-ts"];

  if (allowedDeepmerge) {
    console.log("DEV TOOLCHAIN ADVISORY: deepmerge-ts via Prisma CLI is not installed in the production runtime tree.");
    continue;
  }
  failures.push(`${name}@${vulnerability.range ?? "unknown"} (${vulnerability.severity})`);
}

if (failures.length) {
  console.error("Production runtime vulnerability audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Production dependency audit passed.");
