# 🗄️ S3 Explorer

**A modern desktop application for managing S3-compatible object storage**

[![Version](https://img.shields.io/badge/version-1.7.0-blue.svg)](https://github.com/nasrulhadi/s3-explorer/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](#)

---

## ✨ Features

### 🎯 Core Functionality
- **Multi-Provider Support** — Connect to AWS S3, MinIO, Cloudflare R2, Backblaze B2, and any S3-compatible storage
- **File Browser** — Navigate folders with click-based interaction, just like Windows Explorer or macOS Finder
- **Context Menu** — Right-click for file/folder operations (download, copy URL, rename, delete, get info)
- **Transfer Management** — Track upload/download/move progress with real-time status updates
- **Keyboard Shortcuts** — Efficient navigation with F5/Ctrl+R (refresh), Backspace (back), Ctrl+U (upload), Delete, Escape

### 📁 File Operations
- **Multi-Select** — Ctrl+click and Shift+click to select multiple files/folders
- **Copy/Paste** — Copy and paste files/folders between locations within the same connection
- **Custom Drag & Drop** — Mouse-based drag & drop (HTML5 DnD is broken in Tauri WebView2)
- **Recursive Folder Operations** — Delete, rename, and move folders recursively (B2-safe)
- **Folder ZIP Download** — Download entire folders as ZIP archives
- **File/Folder Rename** — Rename files and folders (recursive copy + delete for folders)
- **Presigned URLs** — Generate shareable presigned URLs with copy button
- **Get Info Modal** — View metadata (size, date, storage class, ETag) with per-field copy

### 🎨 Modern UI/UX
- **Dark Mode** — System / light / dark theme switching
- **Accent Colors** — 5 accent color options (blue, green, yellow, brown, stone)
- **Resizable Column Headers** — Drag column dividers to resize Name/Size/Modified width, persisted across restarts
- **Bucket Connection Indicator** — Green dot next to opened connections in the sidebar
- **Auto-Update** — Automatic update check on startup and every 30 minutes; inline modal with "Install & Relaunch"
- **Virtual Scrolling** — Handle buckets with thousands of files smoothly
- **Breadcrumb Navigation** — Clear path visualization with history-based back navigation
- **Activity Indicator** — Visual feedback for loading states and transfers
- **Toolbar Customization** — Toggle filter, upload, new folder, reload, and breadcrumb visibility
- **Connection Emoji Icons** — Customize each connection with an emoji icon (200 curated emojis across 10 categories)
- **Sidebar Redesign** — Notion-inspired layout with search filter, live connection count, and accent left-bar active state
- **Empty State** — Hero illustration with shortcut hints when no bucket is selected

### 🔐 Security & Privacy
- **Optional Master Password** — Lock the app on startup and encrypt saved connections at rest
- **Encrypted Local Vault** — Protect connection credentials with PBKDF2 SHA-256 + AES-256-GCM when master password is enabled
- **Encrypted Export/Import** — Backup connections with AES-256-GCM encryption (PBKDF2 key derivation)
- **Export Guard** — Require the master password before exporting connections when local vault protection is enabled
- **Local Storage** — Credentials stay on your device; without master password protection they are stored via Zustand persist
- **No Telemetry** — Your data stays private
- **Open Source** — Full transparency with MIT license

---

## 🚀 Quick Start

### Download
Get the latest release from [GitHub Releases](https://github.com/nasrulhadi/s3-explorer/releases)

**Available installers:**
- 🪟 Windows (`.exe` / `.msi`)
- 🍎 macOS (`.dmg`)
- 🐧 Linux (`.AppImage` / `.deb`)

### First Steps
1. Install the application for your platform
2. Launch S3 Explorer
3. Click **"Add Connection"** in the sidebar
4. Enter your S3 credentials:
   - Provider (AWS, MinIO, R2, B2, or Custom)
   - Endpoint (for non-AWS providers)
   - Region
   - Access Key ID
   - Secret Access Key
   - Default Bucket (for R2/B2 which don't support ListBuckets)
5. Click **"Save Connection"**
6. Select a bucket and start browsing!

---

## 📦 Supported Providers

| Provider | Status | Notes |
|----------|--------|-------|
| **AWS S3** | ✅ Fully Supported | Standard AWS regions |
| **Cloudflare R2** | ✅ Fully Supported | Requires endpoint + default bucket |
| **Backblaze B2** | ✅ Fully Supported | Auto-resolve endpoint from region |
| **MinIO** | ✅ Fully Supported | Self-hosted or cloud, path-style addressing |
| **DigitalOcean Spaces** | ✅ Fully Supported | S3-compatible |
| **Custom S3** | ✅ Fully Supported | Any S3-compatible endpoint |

---

## 🛠️ Tech Stack

### Frontend
- **[React 19](https://react.dev)** — UI framework
- **[TypeScript](https://www.typescriptlang.org)** — Type safety (strict mode)
- **[Tailwind CSS v4](https://tailwindcss.com)** — Utility-first styling (CSS-based config)
- **[TanStack Query v5](https://tanstack.com/query/latest)** — Data fetching & caching
- **[TanStack Virtual v3](https://tanstack.com/virtual/latest)** — Virtualized lists
- **[Zustand v5](https://docs.pmnd.rs/zustand)** — State management (5 stores)
- **[Lucide React](https://lucide.dev)** — Beautiful icons
- **[Sonner](https://sonner.emilkowal.ski)** — Toast notifications
- **[Radix UI](https://www.radix-ui.com)** — Context menu
- **[JSZip](https://stuk.github.io/jszip)** — Folder ZIP downloads
- **[@fontsource/onest](https://fontsource.org/fonts/onest)** — Bundled font

### Backend (Tauri)
- **[Tauri v2](https://v2.tauri.app)** — Desktop framework (frameless window)
- **[Rust](https://www.rust-lang.org)** — Native performance
- **[@aws-sdk/client-s3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)** — S3 operations (runs in frontend, HTTP routed through Rust)

### Development
- **[Vite v7](https://vitejs.dev)** — Build tool
- **[pnpm](https://pnpm.io)** — Package manager

---

## 📖 Installation from Source

### Prerequisites
- [Node.js](https://nodejs.org) 18+ (LTS recommended)
- [pnpm](https://pnpm.io) 8+
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- Platform-specific dependencies for [Tauri v2](https://v2.tauri.app/start/prerequisites/)

### Clone & Install
```bash
# Clone the repository
git clone https://github.com/nasrulhadi/s3-explorer.git
cd s3-explorer

# Install dependencies
pnpm install
```

### Development
```bash
# Start development server with hot reload
pnpm tauri dev
```

The app will open automatically. Changes to React code will hot-reload instantly.

### Build
```bash
# Build for production
pnpm tauri build
```

Installers will be generated in `src-tauri/target/release/bundle/`

---

## 📁 Project Structure

```
s3-explorer/
├── src/                              # Frontend React application
│   ├── main.tsx                      # Entry point, QueryClient setup
│   ├── App.tsx                       # Root layout, view routing, theme/accent
│   ├── App.css                       # Tailwind v4 + CSS custom properties
│   ├── components/
│   │   ├── pages/                    # ConnectionFormPage, DeleteConnectionPage, SettingsPage
│   │   ├── explorer/                 # FileList, FileRow, FolderRow, EmptyState, ColumnHeader, ExplorerContextMenu
│   │   │   └── hooks/                # useFileSelection, useFileClipboard, useDragMove
│   │   ├── layout/                   # TitleBar, Sidebar, Toolbar, TransferPanel
│   │   └── modals/                   # NewFolderModal, RenameModal, DeleteConfirmModal, InfoModal, UrlModal, ZipErrorModal, UploadModal, UpdateModal, EmojiPicker, PassphraseModal, ImportConnectionsModal
│   ├── hooks/
│   │   ├── useS3.ts                  # S3 operations (queries + mutations)
│   │   ├── useUpdateChecker.ts        # Automatic update detection
│   │   ├── useDownload.ts            # Download progress tracking
│   │   └── useKeyboardShortcuts.ts   # Global keyboard shortcuts
│   ├── store/                        # Zustand state stores
│   │   ├── connectionStore.ts        # S3 connections (persisted)
│   │   ├── navigationStore.ts        # View state & history (partially persisted)
│   │   ├── transferStore.ts          # Upload/download/move queue
│   │   ├── settingsStore.ts          # User preferences (persisted)
│   │   ├── clipboardStore.ts         # Copy/paste items
│   │   └── updateStore.ts            # Auto-update state
│   ├── lib/
│   │   ├── s3Client.ts               # S3 client factory + CORS-bypass handler
│   │   ├── s3FolderOps.ts            # B2-safe recursive folder operations
│   │   ├── utils.ts                  # Helper functions
│   │   ├── crypto.ts                 # AES-256-GCM encryption for export/import
│   │   ├── accentColors.ts           # Accent color definitions
│   │   ├── emojis.ts                 # Curated emoji list for connection icons
│   │   └── menuStyles.ts             # Shared context menu styling constants
│   └── types/
│       └── index.ts                  # TypeScript interfaces
│
├── src-tauri/                        # Rust backend (minimal shell)
│   ├── src/
│   │   ├── main.rs                   # Binary entry point
│   │   └── lib.rs                    # Tauri builder + plugins
│   ├── icons/                        # App icons (generated from source PNG)
│   ├── Cargo.toml                    # Rust dependencies + author
│   ├── tauri.conf.json               # App config (frameless, 1200x800)
│   └── capabilities/default.json     # Window/HTTP/opener permissions
│
├── scripts/
│   └── release.mjs                   # Version sync script (git tag → all files)
│
├── CHANGELOG.md                      # Version history
└── README.md                         # This file
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `F5` or `Ctrl+R` | Refresh current folder |
| `Backspace` | Go back in history |
| `Ctrl+U` | Upload files |
| `Delete` | Delete selected items |
| `Escape` | Close modal / clear selection |

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Reporting Bugs
1. Check [existing issues](https://github.com/nasrulhadi/s3-explorer/issues) first
2. Create a new issue with:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - System info (OS, app version)

### Suggesting Features
1. Open a [feature request](https://github.com/nasrulhadi/s3-explorer/issues/new?template=feature_request.md)
2. Describe the use case
3. Propose a solution (optional)

### Submitting Code
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly: `pnpm tsc --noEmit && pnpm vite build`
5. Commit with conventional commits: `git commit -m "feat: add amazing feature"`
6. Push to your fork: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style
- Follow existing patterns in the codebase
- Use TypeScript strict mode
- Write clear commit messages
- Add comments for complex logic

---

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and release notes.

---

## 🗺️ Roadmap

### Planned Features
- [ ] File preview (images, text, PDF)
- [ ] Large file downloads via Rust backend (>100MB)
- [ ] Download cancellation
- [ ] Bucket management (create/delete bucket)
- [ ] Multipart upload for large files
- [ ] Sync folder local ↔ S3
- [ ] File versioning support

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

### Built With
- [Tauri](https://tauri.app) — Amazing desktop framework
- [React](https://react.dev) — UI library
- [Tailwind CSS](https://tailwindcss.com) — Styling framework
- [Lucide Icons](https://lucide.dev) — Beautiful icon set

### Inspired By
- [Cyberduck](https://cyberduck.io) — Popular S3 client
- [FileZilla](https://filezilla-project.org) — FTP client
- Windows Explorer & macOS Finder

### Contributors
Thanks to all the people who have contributed to this project!

---

## 📞 Support

### Getting Help
- 🐛 Report issues on [GitHub Issues](https://github.com/nasrulhadi/s3-explorer/issues)
- 💬 Join discussions on [GitHub Discussions](https://github.com/nasrulhadi/s3-explorer/discussions)

### Contact
- **Email**: si.nasrul@gmail.com
- **GitHub**: [@nasrulhadi](https://github.com/nasrulhadi)

---

## ⭐ Star History

If you find this project useful, please consider giving it a star! It helps others discover the project.

[![Star History Chart](https://api.star-history.com/svg?repos=nasrulhadi/s3-explorer&type=Date)](https://star-history.com/#nasrulhadi/s3-explorer&Date)

---

<div align="center">

**Made with ❤️ by [Nasrul Hadi](https://github.com/nasrulhadi)**

[Report Bug](https://github.com/nasrulhadi/s3-explorer/issues) · [Request Feature](https://github.com/nasrulhadi/s3-explorer/issues/new)

</div>
