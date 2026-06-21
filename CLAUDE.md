# Claude Assistant Instructions

## Project: S3 Explorer
Desktop application for S3-compatible object storage management.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS v4
- **Backend**: Tauri v2 (Rust)
- **State**: Zustand v5 + TanStack Query v5
- **Icons**: Lucide React

## Critical Rules

### 1. Zustand Selector Pattern (Prevent Infinite Loops)
```typescript
// ✅ ALWAYS DO THIS
const items = useStore((s) => s.items);
const filtered = useMemo(() => items.filter(predicate), [items]);

// ❌ NEVER DO THIS
const filtered = useStore((s) => s.items.filter(predicate));
```

### 2. Tailwind CSS
- Use CSS custom properties: `bg-[var(--s3-sidebar-bg)]`
- Avoid dynamic class names
- Use static height utilities: `h-screen`, `flex-1`

### 3. S3 Client
- Use Tauri's fetch: `import { fetch } from "@tauri-apps/plugin-http"`
- Pass to AWS SDK: `requestHandler: { fetchFn: fetch }`

## Push Workflow

When user says "push" or "release":

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

3. **Commit changelog**
   ```bash
   git add CHANGELOG.md
   git commit -m "docs: update changelog for v{x.x.x}"
   ```

4. **Create tag**
   ```bash
   git tag -a v{x.x.x} -m "Release description"
   ```

5. **Push**
   ```bash
   git push origin main --tags
   ```

## Version Bumping (SemVer)
- **PATCH** (1.0.0 → 1.0.1): Bug fixes
- **MINOR** (1.0.0 → 1.1.0): New features
- **MAJOR** (1.0.0 → 2.0.0): Breaking changes

## UI Standards
- **Connectivity**: Circle icon (green/red) + "Online"/"Offline" text
- **Activity**: ArrowUpDown icon with pulse animation
- **Forms**: Use pages, not modals (except simple confirmations)
- **Status bar**: Fixed width sections, item count + indicators

## File Organization
- Components: `src/components/{layout,explorer,settings,connections}/`
- Hooks: `src/hooks/`
- Stores: `src/store/`
- Types: `src/types/index.ts`
- Utils: `src/lib/utils.ts`

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
- `CONVENTIONS.md` - Complete guidelines
- `PROJECT.md` - Architecture and features
- `CHANGELOG.md` - Version history
