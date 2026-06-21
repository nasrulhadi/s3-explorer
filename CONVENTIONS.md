# AI Editor Conventions

This file contains rules and conventions for AI coding assistants working on this project.

## Project Overview

**S3 Explorer** - Desktop application for S3-compatible object storage management (AWS S3, MinIO, Cloudflare R2, Backblaze B2).

- **Stack**: Tauri v2 (Rust) + React 18 + TypeScript + Tailwind CSS v4
- **State**: Zustand v5 + TanStack Query v5
- **Language**: Indonesian (user preference), English (code/comments)

## File Structure

```
src/
  App.tsx                    # Main app layout with view routing
  components/
    layout/                  # TitleBar, Sidebar, Toolbar, TransferPanel
    explorer/                # FileList, FileRow, FolderRow, BreadcrumbNav, ContextMenu
    settings/                # SettingsPage
    connections/             # ConnectionFormPage, DeleteConnectionPage
  hooks/
    useS3.ts                 # S3 operations hook
    useConnectivity.ts       # Internet connectivity detection
    useKeyboardShortcuts.ts  # Global keyboard shortcuts
  store/
    connectionStore.ts       # S3 connections (persisted)
    navigationStore.ts       # Current view state (partially persisted)
    transferStore.ts         # Upload/download queue
    settingsStore.ts         # User preferences (persisted)
  lib/
    s3Client.ts              # S3 client factory
    utils.ts                 # Helper functions
  types/
    index.ts                 # TypeScript interfaces
```

## Coding Conventions

### TypeScript
- Strict mode enabled
- Use `interface` for object shapes, `type` for unions/aliases
- Avoid `any` - use proper types or `unknown`
- File naming: PascalCase for components, camelCase for hooks/utils

### React Components
- Functional components with hooks only
- Use `React.memo` for expensive list items
- Colocate styles with components (Tailwind classes)
- Extract complex logic to custom hooks

### State Management (Zustand)
```typescript
// ✅ GOOD - Selective subscriptions
const connections = useConnectionStore((s) => s.connections);
const addConnection = useConnectionStore((s) => s.addConnection);

// ❌ BAD - Whole store subscription
const store = useConnectionStore();

// ✅ GOOD - Memoize filtered results
const transfers = useTransferStore((s) => s.transfers);
const activeTransfers = useMemo(
  () => transfers.filter((t) => t.status === "active"),
  [transfers]
);

// ❌ BAD - Inline filter (causes infinite loops)
const activeTransfers = useTransferStore((s) => s.transfers.filter(...));
```

### Tailwind CSS
- Use CSS custom properties for theming: `bg-[var(--s3-sidebar-bg)]`
- Avoid inline dynamic classes (use static classes or style attribute)
- Dark mode: Use `dark:` prefix or `.dark` class
- Height calculations: Use static utilities (`h-screen`, `flex-1`) not `calc(100vh - 56px)`

### S3 Operations
```typescript
// ✅ Use Tauri fetch for AWS SDK
import { fetch } from "@tauri-apps/plugin-http";

const s3Client = new S3Client({
  region: connection.region,
  endpoint: connection.endpoint,
  credentials: {
    accessKeyId: connection.accessKeyId,
    secretAccessKey: connection.secretAccessKey,
  },
  requestHandler: {
    fetchFn: fetch, // Use Tauri's fetch
  },
});

// ✅ For large files (>100MB), use Rust commands
const result = await invoke("download_file", { bucket, key, destPath });
```

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

#### 4. Commit changelog
```bash
git add CHANGELOG.md
git commit -m "docs: update changelog for v{x.x.x}"
```

#### 5. Create git tag
```bash
git tag -a v{x.x.x} -m "Short release description"
```

#### 6. Push
```bash
git push origin main --tags
```

### Changelog Categories

1. **Added** - New features or capabilities
2. **Changed** - Modifications to existing features
3. **Fixed** - Bug fixes
4. **UI** - User interface changes (optional, can be in Added/Changed)
5. **Performance** - Performance optimizations (optional)

**Best practices:**
- Be specific: "Fixed connectivity indicator infinite loop" not "Fixed bug"
- User-focused: Write from user perspective
- Group related changes
- Link issues when applicable: "Fixed #123"

## UI/UX Patterns

### Connectivity Indicator
- **Icon**: Circle (8px) with `fill="currentColor"`
- **Colors**: Green (#22c55e) for Online, Red (#ef4444) for Offline
- **Text**: "Online" / "Offline"
- **Locations**: Status bar, Welcome screen, Empty state

### Activity Indicator
- **Icon**: ArrowUpDown (14px)
- **Animation**: `animate-pulse` when active, `opacity-40` when idle
- **Color**: Accent color when active, muted when idle

### Status Bar
- **Layout**: Fixed width sections to prevent layout shift
- **Content**: Item count | Selection count | Connectivity | Activity
- **Height**: `h-8` (32px)

### Modals vs Pages
- **Use pages** for complex forms (connection, settings, delete)
- **Use modals** only for simple confirmations
- **Pattern**: Page-based routing with view state management

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| F5 | Refresh current folder |
| Backspace | Go back in history |
| Ctrl+U | Upload files |
| Ctrl+N | New folder |
| Ctrl+F | Focus search |
| Delete | Delete selected items |
| Escape | Close modal / Clear selection |

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
// ❌ BAD - Dynamic class
<div className={`h-[calc(100vh-${headerHeight}px)]`} />

// ✅ GOOD - Static class or style
<div className="h-screen flex-1" />
<div style={{ height: `calc(100vh - ${headerHeight}px)` }} />
```

### S3 Request Failures
**Problem**: Host header causes signature mismatch
```typescript
// ❌ BAD - Includes host header
await fetch(url, { headers: { host: "s3.amazonaws.com" } });

// ✅ GOOD - Let SDK handle headers
await fetch(url);
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

### Test Coverage
- Focus on critical paths (S3 operations, state management)
- Test error handling (network failures, invalid credentials)
- Test edge cases (empty buckets, large files, special characters)

## Deployment

### Build Commands
```bash
pnpm tauri build        # Build installer
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
- [ ] GitHub Release created (optional)

## Important Files

| File | Purpose |
|------|---------|
| `CHANGELOG.md` | Version history and release notes |
| `PROJECT.md` | Project overview and architecture |
| `CONVENTIONS.md` | This file - AI editor guidelines |
| `src/App.tsx` | Main app layout and view routing |
| `src/store/*.ts` | Zustand state stores |
| `src/hooks/useS3.ts` | S3 operations |
| `src/hooks/useConnectivity.ts` | Internet connectivity check |
| `src-tauri/src/lib.rs` | Rust backend commands |

## Communication Style

- **User language**: Indonesian (respond in Indonesian)
- **Code language**: English (comments, variable names)
- **Design decisions**: Discuss collaboratively before implementing
- **Icon selection**: Preview at https://lucide.dev/icons/ before choosing
- **Step-by-step**: Guide user through complex implementations

## References

- [Keep a Changelog](https://keepachangelog.com)
- [Semantic Versioning](https://semver.org)
- [Tauri v2 Documentation](https://v2.tauri.app)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)

---

**Last Updated**: 2026-06-20
**Current Version**: v1.0.0
