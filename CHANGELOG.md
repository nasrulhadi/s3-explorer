# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com),
and this project adheres to [Semantic Versioning](https://semver.org).

## [1.1.6] - 2026-06-27

### Changed
- **Sidebar Redesign**: Modern Notion-inspired layout with functional improvements
  - Header with `CONNECTIONS` label, live count, and toggle search icon
  - Real-time connection name filter (show/hide via search icon, with clear button)
  - Connection items: consistent `Database` icon + provider/region (or bucket for R2/B2) metadata
  - Active connection: subtle left accent bar (3px) + soft accent background (replaces full accent block)
  - Bucket list with vertical tree guide line + accent left bar for active bucket
  - Removed inline SVG provider placeholder icons (R2/B2/IO/S3 text boxes)
- **Settings Page**: Section cards with bordered rounded containers
  - All sections (General/Appearance/Toolbar/Data) wrapped in bordered cards, no background
  - ABOUT section retains background fill
  - Page width widened from `max-w-lg` to `max-w-xl`
- **Delete Connection Page**: Endpoint truncation (50 chars + "…") with full title tooltip; provider shown as full label (AWS S3 / Cloudflare R2 / Backblaze B2 / MinIO / Custom S3)
- **Connection Form Page**: Page width widened to `max-w-xl`
- **FileList Architecture**: Decomposed 2293-line monolith into modular structure
  - Extracted 6 modals + ColumnHeader to dedicated files under `modals/` and `explorer/`
  - Extracted S3 folder operations to `lib/s3FolderOps.ts` (B2-safe recursive ops)
  - Custom hooks: `useFileSelection`, `useFileClipboard`, `useDragMove`
  - Unified context menu as `ExplorerContextMenu` component
  - Result: `FileList.tsx` reduced from 2293 → ~600 lines

### Fixed
- **Delete Modal Duplication**: Handler previously copy-pasted across 3 render branches (Loading/Error/Empty) — now defined once

---

## [1.1.5] - 2026-06-24

### Added
- **Export/Import Connections**: Settings page data management with encryption
  - Export all connections to AES-256-GCM encrypted `.enc` backup
  - Import encrypted backups with passphrase decryption
  - Merge-by-ID strategy with preview modal and result report (new/updated/skipped)
- **Passphrase Modal**: Password input with show/hide toggle, confirm field, error display

### Fixed
- **TransferPanel**: All transfer types (upload/download/move) now auto-remove on completion

---

## [1.1.4] - 2026-06-24

### Added
- **Custom Mouse-Based Drag & Drop**: Complete replacement of HTML5 DnD (broken in Tauri WebView2)
  - Mouse tracking with 10px threshold and floating ghost label
  - Drop target detection via `document.elementFromPoint()`
  - Multi-select drag: drag multiple files, folders, or mixed simultaneously
  - Recursive folder move: all children copied before source deletion (B2-safe)
- **Move Progress Feedback**: Combined TransferPanel + inline dimming
  - Amber pulsing progress bar with "Moving…" label per source item
  - Source items dimmed (`opacity-40 pointer-events-none`) during move
  - Auto-remove completed entries after 4 seconds (all types: upload, download, move)

### Changed
- **Breadcrumb Truncation**: Last folder name >20 chars truncated to 19 + "…"
  - Full name restored when window is maximized
- **Filter Input**: Reduced width (`w-36`) with clear X button on right
- **Rename**: Folder rename now recursive — copies all children, deletes originals (B2-safe)

### Fixed
- **Drag Ghost Label**: No longer appears during navigation, clicks, or bucket changes
  - Unconditional `dragRef` cleanup on navigation, mouseup, and leave
  - Document-level mouseup safety net
- **Folder Drag Content Loss**: Children now preserved via recursive copy
- **Folder Rename Duplicate**: Recursive rename prevents leaving orphaned children

---

## [1.1.3] - 2026-06-24

### Added
- **Provider-Specific Icons**: Custom SVG icons for each provider in sidebar
  - R2, B2, IO (MinIO), S3 (AWS/Custom) — each with distinct label
  - Replaced generic Lucide Server icon
- **Get Info Modal**: Right-click → Get Info opens modal with metadata
  - Copy button per field (📋 → ✅ 1.5s)
  - Dynamic "File Info" / "Folder Info" subtitle
  - Monospace values, dark/light theme
- **Get URL Modal**: Presigned URL displayed with copy button
  - URL truncated with ellipsis, copy feedback
  - Auto-copies to clipboard on generation
- **ZIP Download**: Multi-file and folder download as ZIP
  - JSZip client-side with progress via TransferPanel
  - Limits: 250 files / 500 MB with error modal
  - Uses `tauriFetch` to bypass CORS
- **Backblaze B2 Support**: Full provider integration
  - Custom form labels (Key ID / Application Key)
  - Bucket field shown for B2 in connection form
  - `listBuckets` suppression (B2 keys often lack this permission)
- **Global cursor-pointer**: Added via CSS for all interactive elements

### Changed
- **Download System**: All downloads now use `tauriFetch` (CORS bypass)
  - Single file download also fixed
  - Native Save dialog via `showSaveFilePicker` with fallback
- **Connection Form Labels**: Dynamic per provider (B2 shows Key ID/Application Key)
- **TransferPanel Position**: Moved to `bottom-10` (above status bar)
- **Native Save Dialog**: Added `showSaveFilePicker` API with anchor fallback

### Fixed
- **Stale Selection on Reload**: Selection cleared when data refreshes
- **Stale Context Menu**: `contextTarget` reset on menu close via `onOpenChange`
- **CORS on Downloads**: Replaced browser `fetch` with `tauriFetch`
- **Download Save Dialog**: Delayed `URL.revokeObjectURL` and added File System Access API

---

## [1.1.2] - 2026-06-21

### Added
- **Upload Modal**: Full upload flow with choice and review stages
  - Upload File / Upload Folder buttons with native file/folder picker
  - Review list before upload with file name and size
  - Auto-transfer to TransferPanel during upload
  - 200 MB max file size with per-file validation
- **Drag & Drop** (modal internal only): Drop zone inside UploadModal
  - Later disabled due to Tauri v2 WebView2 limitation
- **Context Menu Everywhere**: Context menu now available in ALL states
  - Empty state: Right-click with Copy, Paste, Upload, New Folder, Reload
  - Loading & Error states: All modals remain accessible
- **Paste Duplicate Handling**: Auto-rename pasted files/folders
  - `file.txt` → `file-copy1.txt` → `file-copy2.txt`
  - `folder/` → `folder-copy1/`
- **Recursive Folder Operations**:
  - **Copy/Paste**: Paste folder copies ALL contents recursively (ListObjectsV2 + CopyObject)
  - **Delete**: Delete folder removes ALL contents via ListObjectsV2 + DeleteObjects batch
- **Dynamic Skeleton Count**: Loading skeleton matches last item count instead of fixed 8
- **Connectivity Check Fix**: Changed from HEAD to GET (cdn-cgi/trace only responds to GET)

### Changed
- **Modal Architecture**: All modals (NewFolder, Delete, Rename, Upload) are now rendered unconditionally — accessible from any UI state
- **New Folder State**: Moved `newFolderOpen` to App.tsx, same pattern as upload
  - Toolbar New Folder button now works in empty/loading/error states
- **Paste in All Menus**: Paste added to single-file, single-folder, and multi-item context menus
- **Upload Notice**: Changed from dashed-border drop zone to solid background info box
- **File Body Handling**: Upload body converted from `File` to `Uint8Array` for Tauri HTTP compatibility

### Fixed
- **Right-click in Empty State**: Removed `preventDefault` from ContextMenu trigger
- **Empty State Toolbar Actions**: Upload and New Folder from toolbar now work
- **Folder Paste Key**: Preserved trailing `/` for folder pastes
- **B2 Credential Flow**: Proper credential mapping (Key ID → Access Key, Application Key → Secret Key)
- **Remove Explorer Drag-and-Drop**: OS-level drag-and-drop removed (not supported in Tauri/WebView2)

---

## [1.1.0] - 2026-06-21

### Added
- **Unified Context Menu**: Single-source right-click menu for items and empty areas
  - Single file: Copy, Rename, Delete, Download, Get URL, Get Info
  - Single folder: Copy, Rename, Delete, Download as ZIP (soon), Get Info
  - Multi-select (2+ items): Copy, Delete, Download as ZIP (soon)
  - Empty area: Copy, Paste, Upload, New Folder, Reload
  - Selection-aware menu (single vs multi vs mixed)
- **Delete Confirmation Modal**: Modal dialog for single and bulk delete
  - Clicking outside or Cancel closes the modal
  - Folder warning about permanent removal
  - Bulk mode shows "Delete N Items"
- **Rename Modal**: Replaced window.prompt with proper modal
  - Pre-filled name, Enter/Escape support
  - Dynamic title (Rename File / Rename Folder)
  - Virtual folder detection with inline error message
- **New Folder Modal**: Popup dialog for creating folders
  - Input field with accent color focus ring
  - Cancel/Create buttons with Enter support
- **Clipboard Store**: Zustand store for copy/paste operations
  - Copy selected items to clipboard
  - Paste via S3 CopyObject

### Changed
- **Mutations Refactored**: All `useMutation` calls moved from lazy functions to top-level
  - Fixed "Invalid hook call" error in delete/rename/download/URL/Info operations
  - `deleteItem()`, `renameItem()` etc. → `deleteItem`, `renameItem` (no parens)
- **CopySource Format**: Added leading slash for S3 CopyObject compatibility
- **Selection/Context Reset**: State cleared after delete operations
  - Selected keys reset on successful delete
  - Context menu target reset to prevent stale menus
- **Removed All Toast Notifications**: Success/error/info toasts removed
  - Operations execute silently without visual feedback
  - `sonner` toast library import removed from all files

### Fixed
- **Context Menu Priority**: Multi-select menu now shown before single-item menu
- **Folder Key Computation**: Strip trailing slash before `lastIndexOf("/")`
  - Fixed rename creating invalid paths like `folder/new-folder/`
- **Delete Not Working**: Inline `onConfirm` avoids stale closure
- **Virtual Folder Handling**: Pre-check with HeadObject before rename
- **Old ContextMenu.tsx**: Removed orphaned file (no longer imported)

---

## [1.0.2] - 2026-06-21

### Added
- **Accent Color System**: Customizable accent colors with 5 soft pastel options
  - Blue, Green, Yellow, Brown, Stone (default: Stone)
  - Light and dark mode support with adaptive colors
  - Settings page dropdown with color preview circles
  - Extensible configuration in `src/lib/accentColors.ts`
  - CSS variables: `--s3-accent-base`, `--s3-accent-hover`, `--s3-accent-active`, `--s3-accent-text`

### Changed
- **UI Components**: Updated all components to use accent color system
  - Sidebar active connection background
  - Toolbar buttons and breadcrumb hover states
  - Toggle switches in Settings page
  - FileList selected items and sort arrows
  - TransferPanel progress bar and badges
  - Context menu highlight states
  - Search input focus rings
  - Welcome screen cloud icon and button
  - ConnectionFormPage input focus and buttons

### Fixed
- **Accent Color Reactivity**: Fixed dropdown not updating when theme changes
  - Now reactive to Light/Dark theme switches
  - Properly tracks system theme changes via media query listener
  - Uses `useState` + `useEffect` for real-time updates
- **Bucket Name Dark Mode**: Fixed text visibility in dark mode
  - Changed from hardcoded `text-white/60` to `text-[var(--s3-accent-text)]/60`
  - Now adapts to accent color and theme automatically
- **System Theme Tracking**: Added media query listener for OS theme changes
  - Accent colors now update when system theme changes (e.g., sunset)
  - Proper cleanup on component unmount

---

## [1.0.1] - 2026-06-21

### UI
- **About Section**: Added author information and donation link to Settings page
  - Author name and contact (Nasrul Hadi)
  - GitHub profile link
  - Buy Me a Coffee donation button
  - Version display
- **Toolbar Styling**: Added rounded top-left corner for visual integration with sidebar
  - Uses `rounded-tl-xl` for refined corner radius
  - Background consistency with sidebar for seamless visual flow
- **Settings Page**: Updated background to match explorer and blank page
  - Uses `bg-[var(--s3-window-bg)]` for visual consistency
  - About section uses sidebar background for distinction

### Changed
- **README.md**: Updated with actual GitHub username and contact information
  - Repository links now point to `github.com/nasrulhadi/s3-explorer`
  - Contact email: si.nasrul@gmail.com
  - GitHub profile: github.com/nasrulhadi

### Performance
- **Connectivity Hook**: Optimized to prevent unnecessary re-renders
  - Added state comparison to avoid redundant updates
  - Reduced ping interval to 60 seconds for better resource usage

---

## [1.0.0] - 2026-06-20

### Added
- **S3 Explorer Core**
  - Support for AWS S3, MinIO, Cloudflare R2, Backblaze B2, and S3-compatible storage
  - File browser with virtual scrolling for large directories
  - Context menu (right-click) for file/folder operations
  - Transfer progress tracking with TransferPanel
  - Keyboard shortcuts (F5 refresh, Backspace go back, Ctrl+U upload)

- **Connection Management**
  - Add/Edit/Delete connection pages (page-based, not modal)
  - Connection form with provider-specific validation
  - Default bucket support for R2 connections
  - Delete confirmation page with safety checks
  - Toolbar disconnect button

- **UI Components**
  - Custom title bar with window controls (minimize, maximize, close)
  - Sidebar with connection list and bucket expansion
  - Toolbar with breadcrumb navigation, search, and action buttons
  - Status bar with item count, selection info, and activity indicators
  - Welcome screen for first-time users
  - Empty state when no bucket is selected

- **Theme System**
  - Dark mode support with system preference detection
  - CSS custom properties for consistent theming
  - Tailwind CSS v4 integration with Vite plugin
  - Offline font embedding with @fontsource/onest

- **Connectivity & Activity**
  - Internet connectivity detection via Cloudflare DNS ping (60s interval)
  - Online/Offline indicator (green/red dot) in status bar, welcome screen, and empty state
  - Activity indicator (ArrowUpDown icon with pulse animation)
  - Transfer progress tracking with active/pending/completed states

- **Navigation**
  - Page-based routing with view state management
  - History-based back navigation
  - Breadcrumb truncation for long paths
  - Responsive breadcrumb with expandable overflow

### Changed
- **Architecture**
  - Migrated from modal-based to page-based UI for connection forms
  - Decoupled navigation state from persistence
  - Implemented cross-store active connection sync on startup
  - Used Zustand v5 for state management with selective persistence

- **Performance**
  - TanStack Virtual for efficient large list rendering
  - TanStack Query for data fetching and caching
  - Custom AWS SDK v3 HttpHandler with Tauri fetch

- **UI/UX**
  - Applied consistent theme colors using CSS variables
  - Responsive breadcrumb truncation (max 1 visible segment)
  - Skeleton loading states for better perceived performance
  - Silent refresh behavior (no loading spinner on background refetch)

### Fixed
- **Connectivity**
  - Fixed infinite loop in Zustand selector with memoization
  - Fixed blank screen when clicking connection in sidebar
  - Implemented robust connectivity detection with HTTP HEAD requests

- **UI**
  - Fixed CSS specificity conflicts with Tailwind
  - Fixed button shadow suppression on white backgrounds
  - Fixed title bar button hover background height
  - Prevented WebView2 default context menu on entire app

- **Navigation**
  - Fixed breadcrumb visibility limit for compactness
  - Fixed breadcrumb truncation dropdown vertical alignment
  - Fixed last-item untruncation in maximize mode

- **State Management**
  - Fixed schema evolution with auto-migration
  - Fixed selective state persistence to avoid storing transient data
  - Reset persisted UI state during conditional app startup

### UI
- **Icons & Indicators**
  - Changed connectivity indicator from Wifi/WifiOff to colored Circle dot
  - Changed activity indicator from RefreshCw to ArrowUpDown with pulse animation
  - Consistent Online/Offline text across all views
  - Fixed-width status indicators to prevent layout shift

- **Styling**
  - Applied dark mode class-based integration with Tailwind
  - Used CSS custom properties for theme management
  - Consistent sidebar connection visual state styling
  - Toolbar disconnect icon with proper state behavior

### Performance
- **Rendering**
  - TanStack Virtual for file list (supports 10,000+ items)
  - Memoized Zustand selectors to prevent infinite loops
  - Optimized re-renders with selective state subscriptions
  - Skeleton rows during loading for better UX

- **Network**
  - HEAD requests for connectivity checks (minimal data transfer)
  - 60-second interval for connectivity checks (reduced from 30s)
  - Cloudflare DNS endpoint for reliable connectivity detection
  - AbortController for streaming downloads with cancellation

---

## Version History

- **v1.0.0** (2026-06-20) - Initial stable release
  - Complete S3 explorer functionality
  - Multi-provider support (AWS S3, MinIO, R2, B2)
  - Dark mode with system preference
  - Connectivity & activity indicators
  - Page-based navigation architecture

---

## Upcoming Features (Roadmap)

- [ ] Upload dialog with drag & drop
- [ ] Create folder dialog
- [ ] Delete selected items with confirmation
- [ ] Multi-select operations
- [ ] File preview for images/text
- [ ] Search within bucket
- [ ] Bucket management (create/delete)
- [ ] Export/import connections
- [ ] Changelog page in app UI
