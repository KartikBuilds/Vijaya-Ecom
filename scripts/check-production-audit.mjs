import { cpSync, mkdtempSync, rmSync } from "node:fs";
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

function highOrCritical(vulnerability) {
  return vulnerability.severity === "high" || vulnerability.severity === "critical";
}

function collectPackages(node, packages) {
  for (const [name, dependency] of Object.entries(node?.dependencies ?? {})) {
    packages.add(name);
    collectPackages(dependency, packages);
  }
}

function parseJson(output, message) {
  try {
    return JSON.parse(output);
  } catch {
    throw new Error(message);
  }
}

try {
  cpSync(join(root, "package.json"), join(temp, "package.json"));
  cpSync(join(root, "package-lock.json"), join(temp, "package-lock.json"));

  run("npm", ["ci", "--omit=dev", "--include=optional", "--ignore-scripts"], { cwd: temp });

  const packageTree = run("npm", ["ls", "--omit=dev", "--all", "--json"], { cwd: temp });
  if (packageTree.status !== 0) {
    process.stderr.write(packageTree.stdout);
    process.stderr.write(packageTree.stderr);
    throw new Error("npm ls could not establish an unambiguous production dependency tree.");
  }
  const runtimePackages = new Set();
  collectPackages(parseJson(packageTree.stdout, "npm ls did not return parseable JSON."), runtimePackages);

  for (const name of ["prisma", "@prisma/config", "deepmerge-ts", "nanoid"]) {
    console.log(`[RUNTIME] ${name}: ${runtimePackages.has(name) ? "present" : "absent"}`);
  }

  const audit = run(
    "npm",
    ["audit", "--omit=dev", "--audit-level=high", "--json"],
    { cwd: temp, allowFailure: true },
  );
  const parsed = parseJson(
    audit.stdout || audit.stderr,
    "npm audit did not return parseable JSON.",
  );
  if (parsed.error) {
    throw new Error(`npm audit failed: ${parsed.error.summary ?? parsed.error.code ?? "unknown error"}`);
  }

  const failures = [];
  const nonRuntime = [];

  for (const [name, vulnerability] of Object.entries(parsed.vulnerabilities ?? {})) {
    if (!highOrCritical(vulnerability)) continue;
    if (runtimePackages.has(name)) {
      failures.push(`${name}@${vulnerability.range ?? "unknown"} (${vulnerability.severity})`);
    } else {
      nonRuntime.push(name);
    }
  }

  if (nonRuntime.length) {
    console.log("NON-RUNTIME TOOLCHAIN ADVISORY:");
    for (const name of nonRuntime) console.log(`- ${name} (not present in production runtime)`);
  }

  if (failures.length) {
    console.error("Production runtime vulnerability audit failed:");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
  } else {
    console.log("Production dependency audit passed: no high or critical runtime advisories.");
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}
