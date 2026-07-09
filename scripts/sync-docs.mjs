#!/usr/bin/env node
/**
 * Docs sync script — keeps README.md, PROJECT.md, CONVENTIONS.md, CLAUDE.md,
 * and .cursorrules in sync with the actual codebase.
 *
 * Usage:
 *   node scripts/sync-docs.mjs           # scan + report, no writes (dry-run)
 *   node scripts/sync-docs.mjs --write   # apply auto-fixes
 *
 * Auto-fixes (--write):
 *   - "Last Updated" date → today
 *   - Store count ("X stores") → actual count from src/store/
 *   - File structure tree → regenerated from filesystem scan
 *
 * Always reports:
 *   - Files on disk missing from docs
 *   - Stale references (deleted hooks/stores/components) — excludes "Known Issues" context
 *   - Store/hook/component counts vs what docs claim
 *
 * Files touched (--write):
 *   - README.md, PROJECT.md, CONVENTIONS.md, CLAUDE.md, .cursorrules
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DRY_RUN = !process.argv.includes("--write");
const TODAY = new Date().toISOString().slice(0, 10);

// ─── Filesystem Scanner ────────────────────────────────────────────────────

function scanDir(dir, skipBak = true) {
  const results = [];
  function walk(d) {
    if (!existsSync(d)) return;
    const entries = readdirSync(d, { withFileTypes: true });
    const dirs = [];
    for (const e of entries) {
      if (e.name.startsWith(".") || e.name === "node_modules") continue;
      const full = join(d, e.name);
      if (e.isDirectory()) { dirs.push(full); }
      else if (e.isFile()) {
        if (skipBak && /\.(bak|backup)$/.test(e.name)) continue;
        const rel = relative(ROOT, full).replace(/\\/g, "/");
        results.push(rel);
      }
    }
    dirs.sort().forEach(walk);
  }
  walk(dir);
  return results.sort();
}

function listFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(f =>
    !f.startsWith(".") && !/\.(bak|backup)$/.test(f)
  ).sort();
}

function listDirs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.startsWith("."))
    .map(e => e.name)
    .sort();
}

function countFiles(dir) {
  return listFiles(dir).length;
}

// ─── Descriptions Map ──────────────────────────────────────────────────────

const DESCRIPTIONS = {
  "main.tsx":               "Entry point, QueryClient setup",
  "App.tsx":                 "Root layout, view routing, theme/accent",
  "App.css":                 "Tailwind v4 + CSS custom properties",
  "vite-env.d.ts":           "Vite type declarations",
  // i18n
  "index.ts":                "Translations interface + useT hook",
  "en.ts":                   "English dictionary",
  "id.ts":                   "Indonesian dictionary",
  "types.ts":                "i18n utility types",
  // pages
  "ConnectionFormPage.tsx":  "Add/edit connection (page, not modal)",
  "DeleteConnectionPage.tsx":"Delete connection confirmation (page)",
  "SettingsPage.tsx":        "Settings: theme, accent, toolbar, language, security, data",
  // explorer
  "FileList.tsx":            "Core file list (virtualized, ~600 lines after refactor)",
  "FileRow.tsx":             "Single file row",
  "FolderRow.tsx":           "Single folder row",
  "ColumnHeader.tsx":        "Resizable column headers (Name, Size, Modified, Class)",
  "EmptyState.tsx":          "Empty state with shortcut hints + hero image",
  "ExplorerContextMenu.tsx": "Unified context menu (file, folder, multi, empty area)",
  "WelcomeScreen.tsx":       "Onboarding screen with Add/Import connection",
  "UnlockScreen.tsx":        "Master password unlock screen (40:60 layout)",
  // explorer/hooks
  "useDragMove.ts":          "Mouse-based drag & drop (HTML5 DnD broken in WebView2)",
  "useFileClipboard.ts":     "Copy/paste logic between folders",
  "useFileSelection.ts":     "Multi-select (Ctrl+click, Shift+click)",
  // layout
  "TitleBar.tsx":            "Custom frameless title bar (minimize/maximize/close/drag)",
  "Sidebar.tsx":             "Connection list + bucket list (Notion-inspired)",
  "Toolbar.tsx":             "Breadcrumb nav + action buttons + filter",
  "TransferPanel.tsx":       "Floating transfer progress panel (bottom-right)",
  // modals
  "NewFolderModal.tsx":      "Create new folder",
  "RenameModal.tsx":         "Rename file/folder",
  "DeleteConfirmModal.tsx":  "Delete confirmation (single & bulk)",
  "UploadModal.tsx":         "Upload with file/folder picker + review stage",
  "InfoModal.tsx":           "File/folder metadata with copy per field",
  "UrlModal.tsx":            "Presigned URL with copy + auto-copy",
  "ZipErrorModal.tsx":       "ZIP limit error (250 files / 500 MB)",
  "EmojiPicker.tsx":         "200 emoji picker for connection icon",
  "MasterPasswordModal.tsx": "Enable/disable/change master password",
  "PassphraseModal.tsx":     "Passphrase input for encrypt/decrypt export",
  "ImportConnectionsModal.tsx":"Import encrypted backup with preview",
  "UpdateModal.tsx":         "Auto-update \"Install & Relaunch\" modal",
  // hooks
  "useS3.ts":                "Central S3 operations (queries + mutations)",
  "useUpdateChecker.ts":     "Auto-update detection (startup + 30min interval)",
  "useDownload.ts":          "Download progress tracking",
  "useKeyboardShortcuts.ts": "Global keyboard shortcuts",
  // store
  "connectionStore.ts":      "S3 connections (persisted)",
  "navigationStore.ts":      "View state & history (partially persisted)",
  "transferStore.ts":        "Upload/download/move queue (NOT persisted)",
  "settingsStore.ts":        "User preferences, language, column widths (persisted)",
  "clipboardStore.ts":       "Copy/paste items (NOT persisted)",
  "securityStore.ts":        "Master password state (persisted)",
  "updateStore.ts":          "Auto-update state (NOT persisted)",
  // lib
  "s3Client.ts":             "S3 client factory + CORS-bypass HTTP handler",
  "s3FolderOps.ts":          "B2-safe recursive folder operations",
  "utils.ts":                "Helpers: formatFileSize, formatDate, getFileIcon, etc.",
  "crypto.ts":               "AES-256-GCM encryption for export/import",
  "secureVault.ts":          "PBKDF2 + AES-256-GCM local vault (master password)",
  "accentColors.ts":         "Accent color definitions (5 colors, light/dark variants)",
  "emojis.ts":               "200 curated emojis in 10 categories",
  "menuStyles.ts":           "Shared context menu styling constants (zinc palette)",
};

function desc(name) { return DESCRIPTIONS[name] || ""; }

// ─── Structure Tree Renderers ──────────────────────────────────────────────

/** Pad a file line for PROJECT.md (←-style comments, ~30 char column). */
function fl([name, pad]) {
  const d = desc(name);
  const padding = " ".repeat(Math.max(2, pad - name.length));
  return `${name}${padding}← ${d}`;
}

/** Generate PROJECT.md structure tree block. */
function renderProjectTree() {
  const IND = 26; // indent for file column
  const lines = [];
  lines.push("src/                             ← frontend React");

  // i18n
  const i18nF = listFiles("src/i18n");
  lines.push("  i18n/");
  for (const f of i18nF) lines.push(`    ${fl([f, IND])}`);

  // assets
  const assetsF = listFiles("src/assets");
  lines.push("  assets/                        ← provider icons, brand images");

  // components
  lines.push("  components/");
  // pages
  lines.push("    pages/");
  for (const f of listFiles("src/components/pages")) lines.push(`      ${fl([f, IND])}`);
  // explorer
  lines.push("    explorer/");
  for (const f of listFiles("src/components/explorer")) {
    if (f === "hooks") continue;
    lines.push(`      ${fl([f, IND])}`);
  }
  // explorer/hooks
  const ehF = listFiles("src/components/explorer/hooks");
  if (ehF.length) {
    lines.push("      hooks/");
    for (const f of ehF) lines.push(`        ${fl([f, IND])}`);
  }
  // layout
  lines.push("    layout/");
  for (const f of listFiles("src/components/layout")) lines.push(`      ${fl([f, IND])}`);
  // modals
  lines.push("    modals/");
  for (const f of listFiles("src/components/modals")) lines.push(`      ${fl([f, IND])}`);

  // hooks
  lines.push("  hooks/");
  for (const f of listFiles("src/hooks")) lines.push(`    ${fl([f, IND])}`);

  // store
  const storeF = listFiles("src/store");
  lines.push(`  store/                         ← Zustand (${storeF.length} stores)`);
  for (const f of storeF) lines.push(`    ${fl([f, IND])}`);

  // lib
  lines.push("  lib/");
  for (const f of listFiles("src/lib")) lines.push(`    ${fl([f, IND])}`);

  // types
  lines.push("  types/");
  for (const f of listFiles("src/types")) lines.push(`    ${fl([f, IND])}`);

  // src-tauri
  lines.push("src-tauri/                       ← Rust backend (minimal shell)");
  lines.push("  src/");
  lines.push("    main.rs                      ← binary entry point");
  lines.push("    lib.rs                       ← Tauri builder + plugins (http, opener, updater)");
  lines.push("  Cargo.toml                     ← deps: tauri + plugins");
  lines.push("  tauri.conf.json                ← app config (frameless, 1200x800, CSP null)");
  lines.push("  capabilities/default.json      ← permissions: window controls, http, opener");

  return lines.join("\n");
}

/** Generate README.md structure tree block. */
function renderReadmeTree() {
  const IND = 36;
  const lines = [];
  lines.push("s3-explorer/");
  lines.push("├── src/                              # Frontend React application");

  // i18n
  lines.push("│   ├── i18n/                         # Multi-language (EN + ID)");
  for (const f of listFiles("src/i18n")) lines.push(`│   │   ├── ${fl([f, IND])}`);

  // assets
  lines.push("│   ├── assets/                       # Provider icons, brand images");

  // components
  lines.push("│   ├── components/");
  // pages
  lines.push("│   │   ├── pages/                    # ConnectionFormPage, DeleteConnectionPage, SettingsPage");
  for (const f of listFiles("src/components/pages")) lines.push(`│   │   │   ├── ${fl([f, IND])}`);
  // explorer
  lines.push("│   │   ├── explorer/");
  for (const f of listFiles("src/components/explorer")) {
    if (f === "hooks") continue;
    lines.push(`│   │   │   ├── ${fl([f, IND])}`);
  }
  // explorer/hooks
  const ehF = listFiles("src/components/explorer/hooks");
  const ehNames = ehF.map(f => f.replace(".ts", "")).join(", ");
  lines.push(`│   │   │   └── hooks/                # ${ehNames}`);

  // layout
  const layF = listFiles("src/components/layout");
  const layNames = layF.map(f => f.replace(".tsx", "")).join(", ");
  lines.push(`│   │   ├── layout/                   # ${layNames}`);

  // modals
  const modF = listFiles("src/components/modals");
  const modNames = modF.map(f => f.replace(".tsx", ""));
  const shortMod = modNames.length > 5
    ? modNames.slice(0, 4).join(", ") + `, +${modNames.length - 4} more`
    : modNames.join(", ");
  lines.push(`│   │   └── modals/                   # ${shortMod}`);

  // hooks
  lines.push("│   ├── hooks/");
  for (const f of listFiles("src/hooks")) lines.push(`│   │   ├── ${fl([f, IND])}`);

  // store
  const storeF = listFiles("src/store");
  lines.push(`│   ├── store/                        # Zustand state stores (${storeF.length} stores)`);
  for (const f of storeF) lines.push(`│   │   ├── ${fl([f, 28])}`);

  // lib
  lines.push("│   ├── lib/");
  for (const f of listFiles("src/lib")) lines.push(`│   │   ├── ${fl([f, IND])}`);

  // types
  lines.push("│   └── types/");
  for (const f of listFiles("src/types")) lines.push(`│       └── ${fl([f, IND])}`);

  // src-tauri
  lines.push("│");
  lines.push("├── src-tauri/                        # Rust backend (minimal shell)");
  lines.push("│   ├── src/");
  lines.push("│   │   ├── main.rs                   # Binary entry point");
  lines.push("│   │   └── lib.rs                    # Tauri builder + plugins (http, opener, updater)");
  lines.push("│   ├── icons/                        # App icons");
  lines.push("│   ├── Cargo.toml                    # Rust dependencies");
  lines.push("│   ├── tauri.conf.json               # App config (frameless, 1200x800)");
  lines.push("│   └── capabilities/default.json     # Permissions");
  lines.push("│");
  lines.push("├── scripts/");
  lines.push("│   └── release.mjs                   # Version sync script");
  lines.push("│");
  lines.push("├── CHANGELOG.md                      # Version history");
  lines.push("└── README.md                         # This file");

  return lines.join("\n");
}

/** Generate CONVENTIONS.md structure tree block. */
function renderConventionsTree() {
  const IND = 28;
  const lines = [];
  lines.push("src/                     # Frontend React application");
  lines.push("  main.tsx                     # Entry point, QueryClient setup");
  lines.push("  App.tsx                      # Root layout, view routing, theme/accent application");
  lines.push("  App.css                      # Tailwind v4 import + CSS custom properties (light/dark)");
  lines.push("  vite-env.d.ts");

  // i18n
  lines.push("  i18n/");
  for (const f of listFiles("src/i18n")) lines.push(`    ${fl([f, IND])}`);

  // assets
  lines.push("  assets/                      # Provider icons + brand images (SVG, PNG, WEBP)");

  // components
  lines.push("  components/");
  // pages
  lines.push("    pages/");
  for (const f of listFiles("src/components/pages")) lines.push(`      ${fl([f, IND])}`);
  // explorer
  lines.push("    explorer/");
  for (const f of listFiles("src/components/explorer")) {
    if (f === "hooks") continue;
    lines.push(`      ${fl([f, IND])}`);
  }
  // explorer/hooks
  lines.push("      hooks/");
  for (const f of listFiles("src/components/explorer/hooks")) lines.push(`        ${fl([f, 24])}`);
  // layout
  lines.push("    layout/");
  for (const f of listFiles("src/components/layout")) lines.push(`      ${fl([f, IND])}`);
  // modals
  lines.push("    modals/");
  for (const f of listFiles("src/components/modals")) lines.push(`      ${fl([f, IND])}`);

  // hooks
  lines.push("  hooks/");
  for (const f of listFiles("src/hooks")) lines.push(`    ${fl([f, IND])}`);

  // store
  const storeF = listFiles("src/store");
  lines.push("  store/");
  for (const f of storeF) lines.push(`    ${fl([f, IND])}`);

  // lib
  lines.push("  lib/");
  for (const f of listFiles("src/lib")) lines.push(`    ${fl([f, IND])}`);

  // types
  lines.push("  types/");
  for (const f of listFiles("src/types")) lines.push(`    ${fl([f, IND])}`);

  // src-tauri
  lines.push("src-tauri/                     # Rust backend (minimal shell)");
  lines.push("  src/");
  lines.push("    main.rs                    # Binary entry point");
  lines.push("    lib.rs                     # Tauri builder + plugins (http, opener, updater)");
  lines.push("  Cargo.toml                   # Dependencies");
  lines.push("  tauri.conf.json              # App config (frameless, 1200x800, CSP null)");
  lines.push("  capabilities/default.json    # Permissions");

  return lines.join("\n");
}

// ─── File Patchers ─────────────────────────────────────────────────────────

function patchFile(file, label, fn) {
  const path = join(ROOT, file);
  if (!existsSync(path)) {
    console.log(`  ⚠  ${label}: file not found`);
    return false;
  }
  let content = readFileSync(path, "utf8");
  const before = content;
  content = fn(content);
  if (content === before) {
    console.log(`  ⚠  ${label}: no changes`);
    return false;
  }
  if (DRY_RUN) {
    console.log(`  🔍 ${label}: would update (dry-run)`);
    return false;
  }
  writeFileSync(path, content, "utf8");
  console.log(`  ✓  ${label}: updated`);
  return true;
}

/** Replace content between start/end markers. */
function replaceSection(content, startMarker, endMarker, newContent) {
  const start = content.indexOf(startMarker);
  if (start === -1) return content;
  const end = content.indexOf(endMarker, start + startMarker.length);
  if (end === -1) return content;
  return content.slice(0, start + startMarker.length) + "\n" + newContent + "\n" + content.slice(end);
}

// ─── Main ──────────────────────────────────────────────────────────────────

const actualStores = countFiles("src/store");
const actualHooks = countFiles("src/hooks");
const actualModals = countFiles("src/components/modals");
const actualLib = countFiles("src/lib");

console.log(`\n📊 Codebase Scan — ${TODAY}`);
console.log(`   Stores:  ${actualStores}  (${listFiles("src/store").join(", ")})`);
console.log(`   Hooks:   ${actualHooks}  (${listFiles("src/hooks").join(", ")})`);
console.log(`   Modals:  ${actualModals}  (${listFiles("src/components/modals").join(", ")})`);
console.log(`   Lib:     ${actualLib}`);
console.log(`   Pages:   ${countFiles("src/components/pages")}`);
console.log(`   Explorer: ${countFiles("src/components/explorer") - 1} files + hooks/`);
console.log(`   i18n:    ${countFiles("src/i18n")}  (${listFiles("src/i18n").join(", ")})`);

// ─── Stale Reference Check ─────────────────────────────────────────────────

console.log(`\n🔍 Checking for stale references...`);

const DOCS = ["README.md", "PROJECT.md", "CONVENTIONS.md", "CLAUDE.md", ".cursorrules"];

// Patterns to flag as stale — but only in non-"Known Issues" context
const STALE_CHECKS = [
  { pattern: "useConnectivity", msg: "useConnectivity hook (removed in v1.5.0)", allowInRemoved: true },
  { pattern: "AddConnectionModal", msg: "AddConnectionModal (legacy, deleted)" },
  { pattern: "greet command", msg: "greet command in Rust (dead code, removed)" },
  { pattern: "\\b5 stores\\b", msg: `store count: docs say 5, actual is ${actualStores}` },
  { pattern: "\\b6 stores\\b", msg: `store count: docs say 6, actual is ${actualStores}` },
  { pattern: "~2300 lines", msg: "FileList was ~2300 lines, now ~600 after refactor" },
  { pattern: "useConnectivity\\.ts", msg: "useConnectivity.ts (removed, replace with useUpdateChecker)" },
];

let staleFound = 0;

function isInKnownIssues(content, matchIdx) {
  // Look backwards for "Known Issues" or "Technical Debt" header
  const before = content.slice(Math.max(0, matchIdx - 500), matchIdx);
  return /Known Issues|Technical Debt/i.test(before) && !/^## (?!Known|Technical)/m.test(before.split("\n").slice(-5).join("\n"));
}

for (const doc of DOCS) {
  const path = join(ROOT, doc);
  if (!existsSync(path)) continue;
  const content = readFileSync(path, "utf8");
  for (const { pattern, msg, allowInRemoved } of STALE_CHECKS) {
    const regex = new RegExp(pattern, "gi");
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (allowInRemoved && isInKnownIssues(content, match.index)) continue;
      console.log(`  ⚠  ${doc}: "${match[0]}" — ${msg}`);
      staleFound++;
      break; // one per file per pattern is enough
    }
  }
}
if (staleFound === 0) console.log(`  ✓  No stale references found`);

// ─── Apply Auto-Fixes ──────────────────────────────────────────────────────

if (!DRY_RUN) console.log(`\n🔧 Applying auto-fixes...\n`);

// 1. Update "Last Updated" dates
for (const doc of DOCS) {
  patchFile(doc, `${doc}: Last Updated`, (c) =>
    c.replace(
      /(\*{0,2}Last Updated\*{0,2}:\s*)\d{4}-\d{2}-\d{2}/g,
      (_m, prefix) => {
        const isBold = prefix.startsWith("**");
        return isBold ? `**Last Updated**: ${TODAY}` : `Last Updated: ${TODAY}`;
      }
    )
  );
}

// 2. Update store count (any number → actual)
const storeCountFiles = [
  { file: "README.md", regex: /Zustand v5\]\([^)]+\) — State management \(\d+ stores\)/ },
  { file: "PROJECT.md", regex: /Zustand v5 \(\d+ stores/ },
  { file: "CONVENTIONS.md", regex: /Zustand v5 \(\d+ stores\)/ },
  { file: "CLAUDE.md", regex: /Zustand v5 \(\d+ stores\)/ },
  { file: ".cursorrules", regex: /Zustand v5 \(\d+ stores/ },
];

for (const { file, regex: pattern } of storeCountFiles) {
  const path = join(ROOT, file);
  if (!existsSync(path)) continue;
  const content = readFileSync(path, "utf8");
  const match = content.match(pattern);
  if (!match) continue;
  const currentCount = match[0].match(/\d+/)?.[0];
  if (currentCount && parseInt(currentCount) === actualStores) continue;
  const replacement = match[0].replace(/\d+ stores/, `${actualStores} stores`);
  patchFile(file, `${file}: store count ${currentCount}→${actualStores}`, (c) =>
    c.replace(pattern, replacement)
  );
}

// 3. Update structure trees
const projectTree = renderProjectTree();
const readmeTree = renderReadmeTree();
const conventionsTree = renderConventionsTree();

patchFile("PROJECT.md", "PROJECT.md: structure tree", (c) => {
  const idx = c.indexOf("## Struktur Project\n```\n");
  if (idx === -1) return c;
  const newPrefix = c.slice(0, idx) + "## Struktur Project\n```\n";
  const endIdx = c.indexOf("\n```\n\n## Types Utama", idx);
  if (endIdx === -1) return c;
  return newPrefix + projectTree + "\n" + c.slice(endIdx);
});

patchFile("README.md", "README.md: structure tree", (c) => {
  const idx = c.indexOf("```\ns3-explorer/\n├── src/");
  if (idx === -1) return c;
  const newPrefix = c.slice(0, idx) + "```\n";
  const endIdx = c.indexOf("\n```\n\n---\n\n## ⌨️ Keyboard Shortcuts", idx);
  if (endIdx === -1) return c;
  return newPrefix + readmeTree + "\n" + c.slice(endIdx);
});

patchFile("CONVENTIONS.md", "CONVENTIONS.md: structure tree", (c) => {
  const idx = c.indexOf("## File Structure\n\n```\nsrc/");
  if (idx === -1) return c;
  const newPrefix = c.slice(0, idx) + "## File Structure\n\n```\n";
  const endIdx = c.indexOf("\n```\n\n## Coding Conventions", idx);
  if (endIdx === -1) return c;
  return newPrefix + conventionsTree + "\n" + c.slice(endIdx);
});

if (DRY_RUN) {
  console.log(`\n💡 Dry run — no files changed. Use --write to apply fixes.`);
  console.log(`   node scripts/sync-docs.mjs --write\n`);
} else {
  console.log(`\n✅ Done. Review with: git diff\n`);
}
