# AI Editor Conventions

This file contains rules and conventions for AI coding assistants working on this project.

## Project Overview

**S3 Explorer** — Desktop application for S3-compatible object storage management (AWS S3, MinIO, Cloudflare R2, Backblaze B2).

- **Stack**: Tauri v2 (Rust) + React 19 + TypeScript + Tailwind CSS v4
- **State**: Zustand v5 (5 stores) + TanStack Query v5
- **Virtualization**: TanStack Virtual v3
- **Icons**: Lucide React
- **Font**: Onest (@fontsource/onest)
- **Language**: Indonesian (user preference), English (code/comments)
- **Current Version: v1.3.0

## Architecture

### CORS Bypass — The Core Design Decision

All AWS SDK HTTP traffic is routed through Tauri's native HTTP plugin (`@tauri-apps/plugin-http`) to bypass WebView CORS restrictions. This is what makes a browser-based S3 client viable inside Tauri — S3-compatible providers (R2, B2, MinIO) typically don't serve CORS headers.

The custom HTTP handler lives in `src/lib/s3Client.ts` and implements a `handle()` method that mirrors `@smithy/fetch-http-handler`'s `FetchHttpHandler` but calls Tauri's `fetch` instead of `globalThis.fetch`.

### Backend (Rust) — Minimal Shell

The Rust backend (`src-tauri/`) is a thin shell:
- Hosts the frameless desktop window (custom title bar, `decorations: false`)
- Provides the `http` plugin as CORS-bypass proxy for frontend AWS SDK calls
- Provides the `opener` plugin (open URLs/files in OS default handler)
- Single boilerplate `greet` command (unused — dead code)
- **No S3 logic, no database, no filesystem access in Rust** — all application logic lives in the TypeScript frontend

### Frontend (React) — All Application Logic

All S3 operations (auth, listing, presigning, uploads, downloads) execute in the renderer process using `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`.

## File Structure

```
src/
  main.tsx                     # Entry point, QueryClient setup
  App.tsx                      # Root layout, view routing, theme/accent application
  App.css                      # Tailwind v4 import + CSS custom properties (light/dark)
  vite-env.d.ts
  assets/                      # Provider icons (s3-s3.svg, s3-r2.svg, s3-b2.svg, s3-io.svg)
  components/
    ConnectionFormPage.tsx     # Add/edit connection (page, not modal)
    DeleteConnectionPage.tsx   # Delete connection confirmation (page)
    SettingsPage.tsx           # Settings: theme, accent, toolbar toggles, export/import
    explorer/
      FileList.tsx             # Main file list (virtualized) — largest file (~2300 lines)
      FileRow.tsx              # Single file row
      FolderRow.tsx            # Single folder row
      UploadModal.tsx          # Upload progress modal
    layout/
      TitleBar.tsx             # Custom frameless title bar (minimize/maximize/close/drag)
      Sidebar.tsx              # Connection list + bucket list
      Toolbar.tsx              # Breadcrumb nav + action buttons + filter
      TransferPanel.tsx        # Floating transfer progress panel (bottom-right)
    modals/
      AddConnectionModal.tsx   # Legacy add connection modal (may be stale)
      ImportConnectionsModal.tsx  # Import encrypted connections backup
      PassphraseModal.tsx      # Passphrase input for encrypt/decrypt
  hooks/
    useS3.ts                   # Central S3 operations (queries + mutations)
    useConnectivity.ts         # Internet connectivity detection (60s interval)
    useDownload.ts             # Download progress tracking
    useKeyboardShortcuts.ts    # Global keyboard shortcuts
  store/
    connectionStore.ts         # S3 connections (persisted — localStorage)
    navigationStore.ts         # Current view state (partially persisted)
    transferStore.ts           # Upload/download/move queue (NOT persisted)
    settingsStore.ts           # User preferences (persisted — localStorage)
    clipboardStore.ts          # Copy/paste items (NOT persisted)
  lib/
    s3Client.ts                # S3 client factory + custom Tauri HTTP handler
    utils.ts                   # Helpers: formatFileSize, formatDate, getFileIcon, etc.
    crypto.ts                  # AES-256-GCM encryption for connection export/import
    accentColors.ts            # Accent color definitions (5 colors, light/dark variants)
  types/
    index.ts                   # All TypeScript interfaces/types
src-tauri/                     # Rust backend (minimal shell)
  src/
    main.rs                    # Binary entry point
    lib.rs                     # Tauri builder + greet command (boilerplate)
  Cargo.toml                   # Dependencies: tauri, tauri-plugin-http, tauri-plugin-opener
  tauri.conf.json              # App config (frameless, 1200x800, CSP null)
  capabilities/default.json    # Permissions: window controls, http (all URLs), opener
```

## Coding Conventions

### TypeScript
- Strict mode enabled (`strict: true`, `noUnusedLocals`, `noUnusedParameters`)
- Use `interface` for object shapes, `type` for unions/aliases
- Avoid `any` — use proper types or `unknown`
- File naming: PascalCase for components, camelCase for hooks/utils
- `moduleResolution: "bundler"`, `target: ES2020`

### React Components
- Functional components with hooks only
- Use `React.memo` for expensive list items (FileRow, FolderRow)
- Colocate styles with components (Tailwind classes)
- Extract complex logic to custom hooks

### State Management (Zustand)
```typescript
// ✅ GOOD — Selective subscriptions
const connections = useConnectionStore((s) => s.connections);
const addConnection = useConnectionStore((s) => s.addConnection);

// ❌ BAD — Whole store subscription
const store = useConnectionStore();

// ✅ GOOD — Memoize filtered results
const transfers = useTransferStore((s) => s.transfers);
const activeTransfers = useMemo(
  () => transfers.filter((t) => t.status === "active"),
  [transfers]
);

// ❌ BAD — Inline filter in selector (causes infinite loops)
const activeTransfers = useTransferStore((s) => s.transfers.filter(...));
```

### Zustand Stores Overview

| Store | Persisted | Key | Purpose |
|-------|-----------|-----|---------|
| `connectionStore` | ✅ | `s3-explorer-connections` | S3 connections + active connection |
| `navigationStore` | ✅ | `s3-explorer-navigation` | Path/bucket/prefix + history (history NOT persisted) |
| `transferStore` | ❌ | — | Upload/download/move queue |
| `settingsStore` | ✅ | `s3-explorer-settings` | Theme, accent, toolbar toggles, restore session |
| `clipboardStore` | ❌ | — | Copy/paste items between folders |

### Tailwind CSS v4
- Config is CSS-based (no `tailwind.config.js`) — uses `@tailwindcss/vite` plugin
- Import: `@import "tailwindcss"` in `App.css`
- Use CSS custom properties for theming: `bg-[var(--s3-sidebar-bg)]`
- Dark mode: `@custom-variant dark` + `.dark` class on `<html>`
- Accent colors injected dynamically at runtime via `App.tsx` → `--s3-accent-*` variables
- Avoid inline dynamic classes (use static classes or `style` attribute)
- Use static height utilities (`h-screen`, `flex-1`) not `calc(100vh - 56px)`

### S3 Client — Custom HTTP Handler
```typescript
// ✅ The custom handler in s3Client.ts routes through Tauri's native fetch
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

// The handler implements handle() and destroy(), cast as `as never`
// to satisfy the SDK's requestHandler typing.
// DO NOT use the simple fetchFn pattern — it doesn't work with Tauri:
//   requestHandler: { fetchFn: fetch }  // ❌ Won't bypass CORS properly

// ✅ Provider-specific endpoint resolution:
// - AWS: no endpoint override (SDK default)
// - MinIO/custom: user-supplied endpoint, forcePathStyle: true
// - R2: requires endpoint (https://{accountId}.r2.cloudflarestorage.com)
// - B2: https://s3.{region}.backblazeb2.com if no endpoint given
```

### Encrypted Export/Import
- `lib/crypto.ts` uses Web Crypto API: PBKDF2 (SHA-256, 100k iterations) → AES-GCM 256-bit key
- Binary format: `MAGIC ("S3XPLR") | salt (16B) | iv (12B) | ciphertext`
- `isEncryptedExport()` checks magic prefix to determine if passphrase is needed

## UI/UX Patterns

### Theming System
- CSS custom properties defined in `App.css` for light (`:root`) and dark (`.dark`)
- Accent colors: 5 options (blue, green, yellow, brown, stone) — defined in `lib/accentColors.ts`
- Accent CSS vars (`--s3-accent-base/hover/active/text`) injected at runtime by `App.tsx`
- Theme modes: `system` | `light` | `dark` (stored in `settingsStore`)

### Connectivity Indicator
- **Icon**: Circle (8px) with `fill="currentColor"`
- **Colors**: Green (#22c55e) for Online, Red (#ef4444) for Offline
- **Text**: "Online" / "Offline"
- **Check interval**: 60 seconds (via `useConnectivity` hook)

### Activity Indicator
- **Icon**: ArrowUpDown (14px)
- **Animation**: `animate-pulse` when active, `opacity-40` when idle
- **Color**: Accent color when active, muted when idle

### Status Bar
- **Layout**: Fixed width sections to prevent layout shift
- **Content**: Item count | Selection count | Connectivity | Activity
- **Height**: `h-8` (32px)

### Modals vs Pages
- **Use pages** for complex forms (connection add/edit, settings, delete confirmation)
- **Use modals** for: simple confirmations, upload progress, passphrase input, import preview
- **Pattern**: Page-based routing via `view` state in `App.tsx` (`"main" | "addConnection" | "editConnection" | "deleteConnection" | "settings"`)

### Transfer Panel
- Floating panel (bottom-right), always mounted in `App.tsx`
- Auto-removes completed transfers after 4 seconds
- Shows upload/download/move progress

### Custom Drag & Drop
- HTML5 DnD is broken in Tauri WebView2 — replaced with mouse-based implementation
- Uses `document.elementFromPoint()` for drop target detection
- 10px movement threshold before drag starts
- Floating ghost label follows cursor
- Multi-select drag supported
- Recursive folder move: copy all children → delete source (B2-safe)

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| F5 | Refresh current folder |
| Ctrl+R | Refresh current folder |
| Backspace | Go back in history (not in inputs) |
| Ctrl+U | Upload files |
| Delete | Delete selected items |
| Escape | Close modal / clear selection |

Shortcuts are ignored when focus is in an input, textarea, or contenteditable element.

## Version Control Workflow

### Semantic Versioning (SemVer)
- **MAJOR.MINOR.PATCH** (e.g., 1.2.3)
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, minor improvements
- **MINOR** (1.0.0 → 1.1.0): New features, backward compatible
- **MAJOR** (1.0.0 → 2.0.0): Breaking changes

### Git Tag Format
```bash
git tag -a v1.0.0 -m "Description of release"
```

### When User Asks to Push

**Follow these steps in order:**

#### 1. Check commits since last tag
```bash
git log v{last_version}..HEAD --oneline
```

#### 2. Determine version bump
- `fix:` commits → PATCH bump
- `feat:` commits → MINOR bump
- `feat!:` or `BREAKING CHANGE:` → MAJOR bump

#### 3. Update CHANGELOG.md
Add new section at top (below header):
```markdown
## [x.x.x] - YYYY-MM-DD

### Added
- New feature description

### Changed
- Change to existing feature

### Fixed
- Bug fix description

### UI
- UI/UX changes

### Performance
- Optimization changes
```

#### 4. Run version sync script
Updates `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, `README.md`, `CONVENTIONS.md`, `CLAUDE.md`, `.cursorrules` to the new version:
```bash
node scripts/release.mjs {x.x.x}
```
> `__APP_VERSION__` (Vite inject from git tag) auto-updates app UI at build time.
> Script only syncs static files that can't read git tag.

#### 5. Commit all changes
```bash
git add -A
git commit -m "chore: bump version to v{x.x.x}"
```

#### 6. Create git tag
```bash
git tag -a v{x.x.x} -m "Short release description"
```

#### 7. Push (when user says so)
```bash
git push origin main --tags
```

### Changelog Categories

1. **Added** — New features or capabilities
2. **Changed** — Modifications to existing features
3. **Fixed** — Bug fixes
4. **UI** — User interface changes (optional, can be in Added/Changed)
5. **Performance** — Performance optimizations (optional)

**Best practices:**
- Be specific: "Fixed connectivity indicator infinite loop" not "Fixed bug"
- User-focused: Write from user perspective
- Group related changes

## Common Pitfalls

### Zustand Selector Infinite Loop
**Problem**: Selector returns new array/object every render
```typescript
// ❌ BAD
const items = useStore((s) => s.items.filter(x => x.active));

// ✅ GOOD
const items = useStore((s) => s.items);
const filtered = useMemo(() => items.filter(x => x.active), [items]);
```

### CSS Specificity Conflicts
**Problem**: Tailwind classes overridden by component styles
```typescript
// ❌ BAD — Dynamic class
<div className={`h-[calc(100vh-${headerHeight}px)]`} />

// ✅ GOOD — Static class or style
<div className="h-screen flex-1" />
<div style={{ height: `calc(100vh - ${headerHeight}px)` }} />
```

### S3 Request Failures
**Problem**: Host header causes signature mismatch
```typescript
// ❌ BAD — Includes host header
await fetch(url, { headers: { host: "s3.amazonaws.com" } });

// ✅ GOOD — Let SDK handle headers; custom handler skips "host" automatically
await fetch(url);
```

### HTML5 Drag & Drop in Tauri WebView2
**Problem**: Native HTML5 DnD events don't fire reliably in Tauri's WebView2
```typescript
// ❌ BAD — onDragStart/onDrop may not fire
<div onDragStart={...} onDrop={...} />

// ✅ GOOD — Mouse-based drag (already implemented in FileList.tsx)
// Uses mousedown/mousemove/mouseup with elementFromPoint()
```

## Testing

### Before Committing
```bash
# TypeScript check
pnpm tsc --noEmit

# Build check
pnpm vite build

# Manual testing
pnpm tauri dev
```

## Deployment

### Build Commands
```bash
pnpm tauri build          # Build installer
pnpm tauri build --debug  # Debug build
```

### Release Checklist
- [ ] All changes committed
- [ ] CHANGELOG.md updated
- [ ] Version bumped correctly
- [ ] Build passes
- [ ] TypeScript checks pass
- [ ] Manual testing complete
- [ ] Git tag created
- [ ] Pushed to GitHub

## Important Files

| File | Purpose |
|------|---------|
| `CONVENTIONS.md` | This file — AI editor guidelines |
| `PROJECT.md` | Project overview and architecture |
| `CLAUDE.md` | Quick-reference AI assistant instructions |
| `CHANGELOG.md` | Version history and release notes |
| `src/App.tsx` | Main app layout, view routing, theme application |
| `src/lib/s3Client.ts` | S3 client factory + CORS-bypass HTTP handler |
| `src/hooks/useS3.ts` | Central S3 operations (queries + mutations) |
| `src/components/explorer/FileList.tsx` | Core file list (largest, most complex) |
| `src/store/*.ts` | Zustand state stores |
| `src-tauri/src/lib.rs` | Tauri builder (minimal backend) |
| `src-tauri/tauri.conf.json` | App config (window, security, bundle) |

## Communication Style

- **User language**: Indonesian (respond in Indonesian)
- **Code language**: English (comments, variable names)
- **Design decisions**: Discuss collaboratively before implementing
- **Icon selection**: Preview at https://lucide.dev/icons/ before choosing
- **Step-by-step**: Guide user through complex implementations

## Known Issues & Technical Debt

- `AddConnectionModal.tsx` appears to be legacy/superseded by `ConnectionFormPage.tsx`
- `download_file` Rust command is a TODO (not yet implemented) — large file downloads still go through JS
- Download cancellation not functional
- Credentials stored plaintext in localStorage (Zustand persist)
- `greet` command in Rust backend is dead code
- `FileList.tsx` is ~2300 lines — candidate for refactoring
- Window `resizable: false` in tauri.conf.json
- CSP disabled (`"csp": null`)

## References

- [Tauri v2 Documentation](https://v2.tauri.app)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [TanStack Virtual Documentation](https://tanstack.com/virtual/latest)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [AWS SDK JS v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Keep a Changelog](https://keepachangelog.com)
- [Semantic Versioning](https://semver.org)

---

**Last Updated**: 2026-06-25
**Current Version: v1.3.0
