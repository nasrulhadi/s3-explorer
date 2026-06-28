# Claude Assistant Instructions

## Project: S3 Explorer
Desktop application for S3-compatible object storage management (AWS S3, MinIO, Cloudflare R2, Backblaze B2).

## Tech Stack
- **Frontend**: React 19 + TypeScript + Tailwind CSS v4
- **Backend**: Tauri v2 (Rust) — minimal shell, all app logic in frontend
- **State**: Zustand v5 (5 stores) + TanStack Query v5
- **Virtualization**: TanStack Virtual v3
- **Icons**: Lucide React
- **Font**: Onest
- **Current Version: v1.2.0

## Critical Rules

### 1. Zustand Selector Pattern (Prevent Infinite Loops)
```typescript
// ✅ ALWAYS DO THIS
const items = useStore((s) => s.items);
const filtered = useMemo(() => items.filter(predicate), [items]);

// ❌ NEVER DO THIS
const filtered = useStore((s) => s.items.filter(predicate));
```

### 2. Tailwind CSS v4
- Config is CSS-based (no `tailwind.config.js`) — `@import "tailwindcss"` in `App.css`
- Use CSS custom properties: `bg-[var(--s3-sidebar-bg)]`
- Accent colors injected at runtime via `App.tsx` → `--s3-accent-*` variables
- Avoid dynamic class names
- Use static height utilities: `h-screen`, `flex-1`

### 3. S3 Client — Custom HTTP Handler (NOT fetchFn)
```typescript
// ✅ Custom handler in s3Client.ts routes through Tauri's native fetch
//    to bypass CORS. Implements handle() + destroy(), cast as `as never`.
//    DO NOT use the simple fetchFn pattern — it doesn't work with Tauri.

// Provider-specific endpoint resolution:
// - AWS: no endpoint override (SDK default)
// - MinIO/custom: user endpoint, forcePathStyle: true
// - R2: requires endpoint (https://{accountId}.r2.cloudflarestorage.com)
// - B2: https://s3.{region}.backblazeb2.com if no endpoint given
```

### 4. HTML5 DnD Broken in Tauri WebView2
- Use mouse-based drag & drop (mousedown/mousemove/mouseup + `elementFromPoint()`)
- Already implemented in `FileList.tsx` — do not revert to HTML5 DnD

## Architecture

- **All S3 operations run in the frontend** via `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`
- **Rust backend is a minimal shell**: hosts frameless window + HTTP plugin (CORS bypass) + opener plugin
- **No S3 logic, database, or filesystem access in Rust**
- The `greet` command in `lib.rs` is dead boilerplate code

## File Organization
```
src/components/         # Flat — no settings/ or connections/ subdirs
  ConnectionFormPage.tsx, DeleteConnectionPage.tsx, SettingsPage.tsx
  explorer/   — FileList, FileRow, FolderRow, UploadModal
  layout/     — TitleBar, Sidebar, Toolbar, TransferPanel
  modals/     — AddConnectionModal (legacy), ImportConnectionsModal, PassphraseModal
src/hooks/             — useS3, useConnectivity, useDownload, useKeyboardShortcuts
src/store/              — connectionStore, navigationStore, transferStore, settingsStore, clipboardStore
src/lib/                — s3Client, utils, crypto (AES-256-GCM), accentColors
src/types/index.ts      — All TypeScript types
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| F5 / Ctrl+R | Refresh current folder |
| Backspace | Go back in history |
| Ctrl+U | Upload files |
| Delete | Delete selected items |
| Escape | Close modal / clear selection |

## Push Workflow

When user says "push", "release", or "commit+changelog+tag":

1. **Check commits since last tag**
   ```bash
   git log v{version}..HEAD --oneline
   ```

2. **Update CHANGELOG.md** with new version section:
   ```markdown
   ## [x.x.x] - YYYY-MM-DD

   ### Added
   - Feature description

   ### Fixed
   - Bug fix description
   ```

3. **Run version sync script** (updates package.json, src-tauri/tauri.conf.json, README.md, CONVENTIONS.md, CLAUDE.md, .cursorrules):
   ```bash
   node scripts/release.mjs {x.x.x}
   ```

4. **Commit all changes**
   ```bash
   git add -A
   git commit -m "chore: bump version to v{x.x.x}"
   ```

5. **Create tag**
   ```bash
   git tag -a v{x.x.x} -m "Release description"
   ```

6. **Push** (when user says so)
   ```bash
   git push origin main --tags
   ```

> **Note**: `__APP_VERSION__` (Vite inject from git tag) auto-updates app UI at build time.
> Script only syncs static files (package.json + docs) that can't read git tag.

## Version Bumping (SemVer)
- **PATCH** (1.0.0 → 1.0.1): Bug fixes
- **MINOR** (1.0.0 → 1.1.0): New features
- **MAJOR** (1.0.0 → 2.0.0): Breaking changes

## UI Standards
- **Connectivity**: Circle icon (green/red) + "Online"/"Offline" text
- **Activity**: ArrowUpDown icon with pulse animation
- **Forms**: Use pages, not modals (except simple confirmations)
- **Status bar**: Fixed width sections, item count + indicators
- **Theming**: 5 accent colors (blue, green, yellow, brown, stone) + system/light/dark mode

## Before Committing
Always run:
```bash
pnpm tsc --noEmit
pnpm vite build
```

## Communication
- User prefers Indonesian language
- Discuss UI decisions collaboratively before implementing
- Preview icons at https://lucide.dev/icons/ before choosing

## Reference Files
- `CONVENTIONS.md` — Complete guidelines (detailed)
- `PROJECT.md` — Architecture and features
- `CHANGELOG.md` — Version history
