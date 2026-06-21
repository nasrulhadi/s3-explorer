# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com),
and this project adheres to [Semantic Versioning](https://semver.org).

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
