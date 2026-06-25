---
name: doc-sync-audit
description: Audit and rewrite outdated AI-instruction markdown files (CONVENTIONS.md, CLAUDE.md, AGENTS.md, etc.) to match the actual codebase, by cross-referencing every claim against ground truth.
source: auto-skill
extracted_at: '2026-06-25T08:24:37.166Z'
---

# Doc-Sync Audit

Use when the user says AI-instruction docs are "outdated", "stale", "usang", or asks to update/sync `CONVENTIONS.md`, `CLAUDE.md`, `AGENTS.md`, `QWEN.md`, or similar guidance files to reflect current project state.

## Core Principle

**Never trust the existing docs.** They describe the project *as planned*, not *as built*. Cross-reference every factual claim against ground truth before writing it back. A doc that confidently states a wrong API pattern is worse than no doc — it actively misleads future agents.

## Procedure

### 1. Read all AI-instruction files first
Read every guidance file the user mentions (CONVENTIONS.md, CLAUDE.md, PROJECT.md, etc.) in full. Note every factual claim: versions, file structure, code snippets, keyboard shortcuts, version numbers, feature lists.

### 2. Verify against ground truth — category by category

| Doc claim | Ground-truth source | How to check |
|-----------|--------------------|--------------|
| Framework/library version | `package.json` / `Cargo.toml` | `read_file` — compare `version`/`dependencies` fields |
| File structure tree | Actual filesystem | `glob` for `src/**/*.{ts,tsx}` etc. — docs often list folders that don't exist, or miss new ones |
| Code snippet / API pattern | Actual implementation file | `read_file` the file the snippet claims to describe — APIs evolve, patterns get replaced |
| "Current Version" / version header | `git tag` | `git tag --sort=-v:refname \| head -5` — docs frequently lag behind tags |
| Keyboard shortcuts | The shortcut hook/handler | `read_file` + `grep_search` for `e.key ===` / `ctrlKey` — shortcuts get added/removed |
| Feature list | CHANGELOG.md + code | `read_file CHANGELOG.md` (recent entries) — new features land without doc updates |

### 3. Common drift areas (check these specifically)

These are the categories that drift most often — verify each one:

1. **Framework versions** — "React 18" in docs when `package.json` says `^19.1.0`. Extremely common.
2. **File structure** — docs list subdirectories (`settings/`, `connections/`) that were flattened, and miss new files (stores, hooks, lib utils added later).
3. **Code snippets** — docs show a simpler pattern that was *replaced* by a more complex one. Example: `requestHandler: { fetchFn: fetch }` documented, but actual code uses a custom `handle()` handler cast `as never`. **The documented pattern may not even work** — always read the real implementation.
4. **Unimplemented features presented as working** — docs reference `invoke("download_file")` as if it exists, but it's a TODO/comment in the code. Check that referenced commands/functions actually exist.
5. **Keyboard shortcuts** — docs list shortcuts (Ctrl+N, Ctrl+F) that don't exist in the handler, and miss ones that do (Ctrl+R added later).
6. **Version numbers / "Current Version" footer** — almost always behind the latest git tag.
7. **Missing new features** — encrypted export/import, theming systems, clipboard stores, drag-and-drop workarounds get built but never documented.
8. **Dead code presented as active** — boilerplate commands (e.g. `greet`) described as part of the architecture when they're unused.

### 4. Rewrite — preserve structure, correct content

- Keep the doc's existing section organization (users/agents are familiar with it).
- Correct every drifted claim with the verified ground truth.
- Add new sections for significant features that exist but weren't documented.
- Add a "Known Issues & Technical Debt" section capturing things found during audit (legacy/duplicate files, unimplemented TODOs, disabled security settings) — this is high-value context for future agents.
- Update the "Last Updated" date and "Current Version" footer to verified values.

### 5. Keep CONVENTIONS.md (detailed) and CLAUDE.md (quick-ref) in sync

If the project has both a detailed conventions file and a quick-reference file, update both. Don't let them diverge — they should describe the same reality at different levels of detail.

## Anti-patterns to avoid

- **Trusting the doc's file tree** — always `glob` the real structure. Docs copy-paste planning trees that never matched reality.
- **Trusting code snippets in docs** — always `read_file` the actual source. Snippets rot faster than any other section.
- **Skipping the version check** — `package.json` version and latest `git tag` are quick to check and almost always mismatch the doc footer.
- **Removing sections wholesale** — prefer correcting over deleting; the section structure is navigational scaffolding.
