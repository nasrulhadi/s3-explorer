#!/usr/bin/env node
/**
 * Release version sync script.
 *
 * Updates the version string in all static files that can't read the git tag
 * at build time (unlike __APP_VERSION__ which is injected by Vite).
 *
 * Usage:
 *   node scripts/release.mjs 1.1.7
 *   node scripts/release.mjs v1.1.7
 *
 * Does NOT commit or tag — review changes, then commit + tag manually.
 *
 * Files updated:
 *   - package.json            (version field)
 *   - README.md              (version badge)
 *   - CONVENTIONS.md         (2 occurrences: header + footer)
 *   - CLAUDE.md              (Current Version line)
 *   - .cursorrules           (Current Version line)
 */

import { readFileSync, writeFileSync } from "node:fs";

const raw = process.argv[2];
if (!raw) {
  console.error("Usage: node scripts/release.mjs <version>  (e.g. 1.1.7 or v1.1.7)");
  process.exit(1);
}

// Normalize: tag form "v1.1.7", plain form "1.1.7"
const version = raw.replace(/^v/, "");
const vVersion = `v${version}`;
const semver = /^\d+\.\d+\.\d+$/;
if (!semver.test(version)) {
  console.error(`Invalid version: "${raw}". Expected format: 1.2.3`);
  process.exit(1);
}

/** Replace version in a file using a regex, return true if changed. */
function replace(file, pattern, replacement) {
  let content = readFileSync(file, "utf8");
  const before = content;
  content = content.replace(pattern, replacement);
  if (content === before) {
    console.warn(`  ⚠  ${file}: no match (already up to date?)`);
    return false;
  }
  writeFileSync(file, content, "utf8");
  console.log(`  ✓  ${file}`);
  return true;
}

console.log(`\nSyncing version ${vVersion} (${version})\n`);

// 1. package.json — version field (no v prefix)
replace("package.json", /"version":\s*"[^"]*"/, `"version": "${version}"`);

// 2. tauri.conf.json — version field (no v prefix)
replace("src-tauri/tauri.conf.json", /"version":\s*"[^"]*"/, `"version": "${version}"`);

// 3. README.md — version badge
replace(
  "README.md",
  /badge\/version-[^\]-]+-blue\.svg/,
  `badge/version-${version}-blue.svg`,
);

// 4. CONVENTIONS.md — header + footer (both "Current Version: vX.Y.Z")
replace(
  "CONVENTIONS.md",
  /Current Version\**:\s*v\d+\.\d+\.\d+/g,
  `Current Version: ${vVersion}`,
);

// 5. CLAUDE.md — Current Version line
replace(
  "CLAUDE.md",
  /Current Version\**:\s*v\d+\.\d+\.\d+/,
  `Current Version: ${vVersion}`,
);

// 6. .cursorrules — Current Version line
replace(
  ".cursorrules",
  /Current Version:\s*v\d+\.\d+\.\d+/,
  `Current Version: ${vVersion}`,
);

console.log(`\nDone. Review changes, then:\n  git add -A && git commit -m "docs: bump version to ${vVersion}" && git tag -a ${vVersion} -m "${vVersion}"\n`);
