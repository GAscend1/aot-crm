#!/usr/bin/env node
/**
 * Lighthouse bundle budget gate — runs after `next build` (Turbopack emits no
 * webpack `performance` warnings, so we check emitted chunk sizes directly).
 *
 * Budgets (Phase 7 audit, deliberate — raise only with intent):
 *   - MAX_CHUNK_BYTES:   512 KB  — largest single JS chunk (gzipped ~130 KB)
 *
 * Any chunk over budget fails the build so a regression cannot slip through.
 * gzip size is approximated (chunk budgets in Next tooling are typically raw
 * sizes; the check reports both raw and gzip estimates).
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { gzipSync } from "node:zlib";

const STATIC_DIR = resolve(".next/static/chunks");
const MAX_CHUNK_BYTES = 512 * 1024;

async function walk(dir) {
  const entries = [];
  for (const name of await readdir(dir)) {
    const full = join(dir, name);
    const info = await stat(full);
    if (info.isDirectory()) entries.push(...(await walk(full)));
    else if (name.endsWith(".js")) entries.push(full);
  }
  return entries;
}

async function main() {
  let files;
  try {
    files = await walk(STATIC_DIR);
  } catch {
    console.log("[bundle-budget] .next/static/chunks not found — skipping (dev build).");
    process.exit(0);
  }

  const chunks = await Promise.all(
    files.map(async (file) => {
      const raw = (await stat(file)).size;
      const gz = gzipSync(await readFile(file)).length;
      return { file: file.replace(resolve("."), "").replaceAll("\\", "/"), raw, gz };
    }),
  );

  const oversized = chunks.filter((c) => c.raw > MAX_CHUNK_BYTES);
  chunks.sort((a, b) => b.raw - a.raw);

  console.log("\n[bundle-budget] Top 8 emitted JS chunks (raw / gzip):");
  for (const c of chunks.slice(0, 8)) {
    const flag = c.raw > MAX_CHUNK_BYTES ? "  <-- OVER BUDGET" : "";
    console.log(
      `  ${(c.raw / 1024).toFixed(0).padStart(5)} KB / ${(c.gz / 1024).toFixed(0).padStart(4)} KB gz  ${c.file}${flag}`,
    );
  }

  if (oversized.length > 0) {
    console.error(
      `\n[bundle-budget] FAIL: ${oversized.length} chunk(s) exceed ${(MAX_CHUNK_BYTES / 1024).toFixed(0)} KB budget.`,
    );
    console.error("  Fix: split heavy imports (route-level dynamic imports) or raise the budget deliberately.");
    process.exit(1);
  }

  console.log(`\n[bundle-budget] OK — all ${chunks.length} chunks within budget.`);
  process.exit(0);
}

void main();
