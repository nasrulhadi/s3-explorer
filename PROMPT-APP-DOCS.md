# Prompt: Write complete English product documentation (for s3-explorer app repo)

Copy everything under **Prompt (paste into app repo)** into an agent chat in the **s3-explorer** (Tauri app) repository.  
English only. Output = Markdown files in that repo. Indonesian translation is a later pass.

---

## Prompt (paste into app repo)

```
# Task: Write complete English product documentation (Markdown)

You are documenting **S3 Explorer**, the Tauri desktop app in **this repository**.
Do **not** invent features. Source of truth = this codebase (UI, commands, config, README, release notes, IPC, storage, S3 client code).

## Goal

Produce **complete, step-by-step English documentation** as Markdown files, ready to publish later on the marketing site (`s3-explorer-web` / docs hub).
**English only** for this pass. Do **not** write Indonesian yet. A separate translation pass comes after these docs are final.

## Before writing

1. Explore the repo thoroughly:
   - README, CHANGELOG, licenses
   - App entry, main windows, routes/screens
   - Connection / credential flow (AWS S3, R2, B2, MinIO, custom endpoints)
   - Browse, upload, download, folders, delete, rename, copy/move if present
   - Multipart / transfer queue / retries if present
   - Security: vault, OS keychain, encryption, telemetry claims (verify in code)
   - Settings, keyboard shortcuts, tray, updates if present
   - Supported platforms & install artifacts (Windows / macOS / Linux)
   - Known limitations, env vars, logging
2. Prefer **what the app actually does** over marketing copy.
3. If something is unclear or unfinished, mark it:
   - `Status: implemented` | `partial` | `planned` | `unknown — needs product owner`
4. Do **not** invent metrics, testimonials, or unsupported providers.

## Output location

Create a docs tree (adjust only if a docs folder already exists and is the project convention):

```text
docs/
  README.md                 # docs index / TOC + how to read
  00-overview.md
  01-install.md
  02-first-run.md
  03-connections.md
  04-browse-and-objects.md
  05-transfers.md
  06-folders-and-prefixes.md
  07-security-and-privacy.md
  08-settings.md
  09-keyboard-shortcuts.md
  10-troubleshooting.md
  11-faq.md
  REFERENCE.md              # glossary, providers matrix, limits, file paths
```

If the repo already has a docs structure, **extend it** instead of duplicating. Keep one clear index.

## Audience

- Developers and power users who know object storage basics
- People switching from AWS Console / Cyberduck / Transmit / rclone GUI
- Assume English as default (open-source project)

## Writing rules

- Clear, direct, slightly technical. Not salesy. Not corporate fluff.
- Step-by-step numbered procedures where users must click/type something.
- Use exact UI labels from the app (quote them as in the UI).
- Prefer screenshots placeholders as:
  `![Description](./images/TODO-description.png)`
  Do not embed fake images.
- Callouts:
  - `> **Note:**`
  - `> **Warning:**` (data loss, credential risk)
  - `> **Tip:**`
- Cross-link between docs with relative paths.
- Every how-to page: **Goal → Prerequisites → Steps → Verify → Related**.
- Keep each file focused; move deep reference tables to `REFERENCE.md`.

## Required content (cover all that exist in code)

### 00-overview.md
- What S3 Explorer is / is not
- Who it’s for
- Supported providers (only if implemented): AWS S3, Cloudflare R2, Backblaze B2, MinIO, custom S3-compatible
- High-level architecture (desktop, local credentials, no server-side proxy unless true)
- License (MIT or whatever the repo states)
- Link to install + first run

### 01-install.md
- System requirements per OS
- Download / install steps (Windows, macOS, Linux) — match real artifacts (msi/exe/dmg/appimage/deb…)
- First launch permissions (macOS Gatekeeper, Windows SmartScreen) if relevant
- Update path if the app has auto-update or manual only
- Uninstall notes if non-obvious

### 02-first-run.md
- What you see on first open
- Create first connection (happy path)
- Minimal “list a bucket / open a prefix” success path
- Where data is stored locally (config paths) if known

### 03-connections.md
- Add / edit / delete connection
- Fields explained (endpoint, region, access key, secret, path-style vs virtual-hosted, session token, etc. — only real fields)
- Provider-specific recipes:
  - AWS S3
  - Cloudflare R2
  - Backblaze B2 (S3-compatible API)
  - MinIO
  - Custom endpoint
- Test connection / common auth errors
- Multiple accounts / switching

### 04-browse-and-objects.md
- Bucket list, object list, sorting, refresh
- Preview if any
- Create empty object / upload entry points
- Rename, delete, copy, move — only if implemented
- Selection multi-file behavior
- Pagination / virtual folders (prefix) behavior

### 05-transfers.md
- Upload (single, multi, folder) step-by-step
- Download step-by-step
- Multipart, concurrency, resume — only if real
- Queue UI, cancel, retry, failure states
- Bandwidth / large file notes from code or honest limits

### 06-folders-and-prefixes.md
- How “folders” work in S3 (prefixes)
- Create folder, navigate, delete prefix
- Edge cases (trailing slash, empty folder markers)

### 07-security-and-privacy.md
- Where secrets are stored (keychain/vault/file) — verify in code
- Encryption at rest if any
- Network: direct to endpoint vs any proxy
- Telemetry: state factually (e.g. none if none)
- Threat model short: what we protect / what we don’t
- Recommendations (IAM least privilege, don’t share exports)

### 08-settings.md
- Every settings panel/section with what it does
- Defaults and when to change them
- Language if app has i18n (separate from website i18n)

### 09-keyboard-shortcuts.md
- Table: Action | Shortcut | Context | OS notes
- Source from actual keybindings in code

### 10-troubleshooting.md
- Symptom → cause → fix table
- Auth failures, CORS (if relevant — often N/A for desktop), SSL, clock skew, region mismatch, path-style
- Logs: where to find, how to enable debug
- Reset local config (with warning)

### 11-faq.md
- Short honest FAQ (pricing free/MIT, commercial use, vs AWS console, offline, multiple accounts, etc.)
- Only answer what we can stand behind

### REFERENCE.md
- Glossary (bucket, prefix, object, endpoint, path-style…)
- Providers matrix: provider | endpoint pattern | region notes | gotchas
- Limits (max sizes, concurrency) if coded
- Config/file locations per OS
- Related links: app repo, website (placeholder `https://s3explorer.app`), Ko-fi only if already project-official

## docs/README.md (index)

- One-screen map of all docs with links
- Suggested reading order for new users
- “Doc status” line: `English complete · Indonesian TBD`
- How to propose doc fixes (issues/PR)

## Quality bar

- [ ] Another engineer can install and connect to MinIO using only these docs
- [ ] No feature mentioned that isn’t in the repo
- [ ] Every procedure has a clear success check
- [ ] Warnings on destructive actions (delete bucket/objects, wipe config)
- [ ] Consistent terminology (pick “connection” vs “account” and stick to it — match the UI)
- [ ] Internal links work
- [ ] `docs/README.md` is the entry point

## Process

1. Explore codebase; list screens + features in a short outline first (in the PR/commit message or top of `docs/README.md` “Coverage”).
2. Write the MD files.
3. Self-review against the UI labels.
4. Do **not** open PRs to the marketing site; stay in this app repo.
5. End with a summary:
   - Files created
   - Features documented
   - Gaps / `unknown` items for the maintainer

## Out of scope (this task)

- Indonesian translation
- Marketing landing page copy rewrite
- Changing app code (docs only, unless you find a wrong in-app string worth a tiny fix — prefer docs)
- Inventing screenshots

Start by scanning the repo, then write the files under `docs/`.
```

---

## After the app docs are final

1. Copy or sync `docs/*.md` from the app repo into the marketing site (or link to them).
2. Port into `s3-explorer-web` `/docs` (single hub or multi-page).
3. Then run an **Indonesian translation** pass on the finalized English set only.
