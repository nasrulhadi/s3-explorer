# GitHub Copilot Instructions for S3 Explorer

## Project Overview
S3 Explorer is a desktop application built with Tauri v2 + React 18 + TypeScript for managing S3-compatible object storage (AWS S3, MinIO, Cloudflare R2, Backblaze B2).

## Technology Stack
- **Desktop Framework**: Tauri v2 (Rust backend)
- **Frontend**: React 18 + TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 with CSS custom properties
- **State Management**: Zustand v5
- **Data Fetching**: TanStack Query v5
- **Icons**: Lucide React
- **Virtualization**: TanStack Virtual
- **Package Manager**: pnpm

## Critical Patterns

### Zustand Store Usage (IMPORTANT)
Always memoize derived state to prevent infinite loops:

```typescript
// ✅ CORRECT
const transfers = useTransferStore((s) => s.transfers);
const activeTransfers = useMemo(
  () => transfers.filter((t) => t.status === "active"),
  [transfers]
);

// ❌ INCORRECT - Causes infinite re-renders
const activeTransfers = useTransferStore((s) => 
  s.transfers.filter((t) => t.status === "active")
);
```

### Tailwind CSS Usage
Use CSS custom properties for theming:

```typescript
// ✅ CORRECT
<div className="bg-[var(--s3-sidebar-bg)] text-[var(--s3-sidebar-text)]">

// ❌ INCORRECT
<div className="bg-gray-900 text-white">
```

Avoid dynamic class names:

```typescript
// ✅ CORRECT - Static classes
<div className="h-screen flex-1">

// ❌ INCORRECT - Dynamic classes
<div className={`h-[calc(100vh-${headerHeight}px)]`}>

// ✅ ALTERNATIVE - Use style attribute
<div style={{ height: `calc(100vh - ${headerHeight}px)` }}>
```

### S3 Client Configuration
Always use Tauri's fetch for AWS SDK:

```typescript
import { fetch } from "@tauri-apps/plugin-http";
import { S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: connection.region,
  endpoint: connection.endpoint,
  credentials: {
    accessKeyId: connection.accessKeyId,
    secretAccessKey: connection.secretAccessKey,
  },
  requestHandler: {
    fetchFn: fetch, // Required for Tauri
  },
});
```

For large files (>100MB), use Rust commands:

```typescript
import { invoke } from "@tauri-apps/api/core";

const result = await invoke("download_file", { 
  bucket: "my-bucket", 
  key: "large-file.zip",
  destPath: "/path/to/save" 
});
```

## File Naming Conventions
- **Components**: PascalCase (e.g., `FileList.tsx`, `ConnectionFormPage.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useS3.ts`, `useConnectivity.ts`)
- **Utils**: camelCase (e.g., `utils.ts`, `s3Client.ts`)
- **Types**: PascalCase interfaces (e.g., `S3Connection`, `NavigationState`)

## Component Structure

### Functional Components with Hooks
```typescript
interface FileListProps {
  filterQuery: string;
}

export default function FileList({ filterQuery }: FileListProps) {
  // Hooks first
  const connectionId = useNavigationStore((s) => s.connectionId);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  
  // Derived state with useMemo
  const filteredItems = useMemo(() => {
    return items.filter(item => item.name.includes(filterQuery));
  }, [items, filterQuery]);
  
  // Event handlers
  const handleClick = useCallback((key: string) => {
    setSelectedKeys(prev => new Set(prev).add(key));
  }, []);
  
  // Render
  return <div>...</div>;
}
```

## UI/UX Patterns

### Connectivity Indicator
```typescript
<div className="flex items-center gap-1">
  <Circle 
    size={8} 
    className={isOnline ? "text-green-500" : "text-red-500"} 
    fill="currentColor"
  />
  <span>{isOnline ? "Online" : "Offline"}</span>
</div>
```

### Activity Indicator
```typescript
<ArrowUpDown
  size={14}
  className={`${
    isActivity
      ? "text-[var(--s3-accent)] animate-pulse"
      : "text-[var(--s3-window-muted)] opacity-40"
  }`}
/>
```

### Loading States
Always show skeleton during loading:

```typescript
if (isLoading) {
  return <SkeletonRow count={8} />;
}
```

## Error Handling
Always wrap S3 operations in try/catch with toast notifications:

```typescript
const handleDelete = async (key: string) => {
  try {
    await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    toast.success("File deleted");
  } catch (error) {
    toast.error("Delete failed", {
      description: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
```

## Version Control

### Commit Message Format
Use conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Formatting, styling
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Adding tests

### Push Workflow
When user requests push:
1. Check commits: `git log v{version}..HEAD --oneline`
2. Update `CHANGELOG.md` with categorized changes
3. Commit changelog: `git commit -m "docs: update changelog for v{x.x.x}"`
4. Create tag: `git tag -a v{x.x.x} -m "Release description"`
5. Push: `git push origin main --tags`

### Semantic Versioning
- **PATCH** (1.0.0 → 1.0.1): Bug fixes only
- **MINOR** (1.0.0 → 1.1.0): New features, backward compatible
- **MAJOR** (1.0.0 → 2.0.0): Breaking changes

## Testing Before Commit
```bash
pnpm tsc --noEmit    # TypeScript validation
pnpm vite build      # Build validation
pnpm tauri dev       # Manual testing
```

## Important Files
- `CONVENTIONS.md` - Detailed coding conventions
- `PROJECT.md` - Architecture and feature overview
- `CHANGELOG.md` - Version history and release notes
- `src/App.tsx` - Main application layout
- `src/store/` - Zustand state stores
- `src/hooks/` - Custom React hooks
- `src-tauri/src/` - Rust backend commands

## Additional Resources
- [Tauri v2 Docs](https://v2.tauri.app)
- [Zustand Docs](https://docs.pmnd.rs/zustand)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
