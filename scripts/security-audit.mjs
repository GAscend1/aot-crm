#!/usr/bin/env node
/**
 * Static security audit for AOT CRM.
 *
 * Scans the source tree for common, machine-detectable issues:
 *   1. Hardcoded secrets / credentials committed to source.
 *   2. dangerouslySetInnerHTML / innerHTML usage (XSS surface).
 *   3. Client components referencing process.env (secret leakage).
 *   4. `<a target="_blank">` links missing rel="noopener noreferrer".
 *   5. Auth secrets referenced by name in non-server code.
 *
 * Exits non-zero if any blocking finding exists (treat as a release gate).
 * Findings are grouped by severity; "warn" items are advisory only.
 *
 * Run with: `npm run audit:security`
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["app", "components", "hooks", "lib", "modules", "services", "config"];
const IGNORE_DIRS = ["node_modules", ".next", "generated", "tests", "scripts"];
const SECRET_PATTERNS = [
  /(?:sk|pk|api[_-]?key|secret|token|password|passwd)\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}["']/i,
  /AKIA[0-9A-Z]{16}/, // AWS access key
  /-----BEGIN (?:RSA|EC|OPENSSH|PGP) PRIVATE KEY-----/,
];
const ENV_SECRET_NAMES = ["AUTH_SECRET", "AUTH_MICROSOFT_ENTRA_ID_SECRET", "SUPABASE_SERVICE_ROLE_KEY", "DATABASE_URL", "CRON_SECRET"];
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".jsx", ".mts", ".cts"]);

const findings = { error: [], warn: [] };

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (IGNORE_DIRS.some((d) => entry === d)) continue;
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (EXTENSIONS.has(extname(full))) out.push(full);
  }
  return out;
}

function isClientComponent(source) {
  return source.includes('"use client"') || source.includes("'use client'");
}

function relative(path) {
  return path.replaceAll("\\", "/").replace(ROOT.replaceAll("\\", "/") + "/", "");
}

for (const dir of SCAN_DIRS) {
  const fullDir = join(ROOT, dir);
  if (!statSync(fullDir).isDirectory()) continue;
  for (const file of walk(fullDir)) {
    const source = readFileSync(file, "utf-8");
    const rel = relative(file);
    const lines = source.split("\n");

    // 1. Hardcoded secrets
    lines.forEach((line, i) => {
      if (SECRET_PATTERNS.some((re) => re.test(line))) {
        findings.error.push(`${rel}:${i + 1}  possible hardcoded secret`);
      }
    });

    // 2. XSS surfaces
    if (source.includes("dangerouslySetInnerHTML") || /\.innerHTML\s*=/.test(source)) {
      findings.error.push(`${rel}  uses dangerouslySetInnerHTML / innerHTML — review for XSS`);
    }

    // 3. Secrets referenced from client code
    if (isClientComponent(source)) {
      for (const name of ENV_SECRET_NAMES) {
        if (source.includes(`process.env.${name}`)) {
          findings.error.push(`${rel}  client component references process.env.${name}`);
        }
      }
    }

    // 4. target=_blank without rel — scan the full opening <a ...> tag so
    //    multi-line JSX attributes (target and rel on separate lines) are
    //    matched correctly instead of producing false positives.
    const reAnchor = /<a\b[^>]*>/gs;
    let tagMatch;
    while ((tagMatch = reAnchor.exec(source)) !== null) {
      const tag = tagMatch[0];
      if (/target=["']_blank["']/.test(tag) && !/rel=["'][^"']*(noopener|noreferrer)/.test(tag)) {
        const lineNo = source.slice(0, tagMatch.index).split("\n").length;
        findings.warn.push(`${rel}:${lineNo}  target="_blank" without rel="noopener noreferrer"`);
      }
    }
  }
}

console.log(`\nSecurity audit — ${SCAN_DIRS.join(", ")}`);
console.log("=".repeat(60));
if (findings.error.length === 0) {
  console.log("  ✓ No blocking findings.");
} else {
  console.log(`\n  BLOCKING (${findings.error.length}):`);
  for (const f of findings.error) console.log(`    ✗ ${f}`);
}
if (findings.warn.length > 0) {
  console.log(`\n  Advisory (${findings.warn.length}):`);
  for (const f of findings.warn) console.log(`    ⚠ ${f}`);
}

if (findings.error.length > 0) {
  console.log("\nSecurity audit FAILED — fix the blocking findings before release.\n");
  process.exit(1);
}
console.log("Security audit passed.\n");
