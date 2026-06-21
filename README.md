# 🗄️ S3 Explorer

**A modern desktop application for managing S3-compatible object storage**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/nasrulhadi/s3-explorer/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](#)

---

## ✨ Features

### 🎯 Core Functionality
- **Multi-Provider Support** - Connect to AWS S3, MinIO, Cloudflare R2, Backblaze B2, and any S3-compatible storage
- **File Browser** - Navigate folders with click-based interaction, just like Windows Explorer or macOS Finder
- **Context Menu** - Right-click for file/folder operations (download, upload, delete, rename, copy URL)
- **Transfer Management** - Track upload/download progress with real-time status updates
- **Keyboard Shortcuts** - Efficient navigation with F5 (refresh), Backspace (back), Ctrl+U (upload)

### 🎨 Modern UI/UX
- **Dark Mode** - Automatic theme switching based on system preference
- **Virtual Scrolling** - Handle buckets with thousands of files smoothly
- **Breadcrumb Navigation** - Clear path visualization with history-based back navigation
- **Connectivity Indicator** - Real-time online/offline status detection
- **Activity Indicator** - Visual feedback for loading states and transfers

### 🔐 Security & Privacy
- **Local Storage** - Credentials stored securely on your device
- **No Telemetry** - Your data stays private
- **Open Source** - Full transparency with MIT license

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
5. Click **"Save Connection"**
6. Select a bucket and start browsing!

---

## 📦 Supported Providers

| Provider | Status | Notes |
|----------|--------|-------|
| **AWS S3** | ✅ Fully Supported | Standard AWS regions |
| **Cloudflare R2** | ✅ Fully Supported | Auto-fill endpoint, default bucket support |
| **Backblaze B2** | ✅ Fully Supported | S3-compatible API |
| **MinIO** | ✅ Fully Supported | Self-hosted or cloud |
| **DigitalOcean Spaces** | ✅ Fully Supported | S3-compatible |
| **Custom S3** | ✅ Fully Supported | Any S3-compatible endpoint |

---

## 🛠️ Tech Stack

### Frontend
- **[React 18](https://react.dev)** - UI framework
- **[TypeScript](https://www.typescriptlang.org)** - Type safety
- **[Tailwind CSS v4](https://tailwindcss.com)** - Utility-first styling
- **[TanStack Query v5](https://tanstack.com/query/latest)** - Data fetching & caching
- **[TanStack Virtual](https://tanstack.com/virtual/latest)** - Virtualized lists
- **[Zustand v5](https://docs.pmnd.rs/zustand)** - State management
- **[Lucide React](https://lucide.dev)** - Beautiful icons
- **[Sonner](https://sonner.emilkowal.ski)** - Toast notifications

### Backend (Tauri)
- **[Tauri v2](https://v2.tauri.app)** - Desktop framework
- **[Rust](https://www.rust-lang.org)** - Native performance
- **[AWS SDK JS v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)** - S3 operations

### Development
- **[Vite](https://vitejs.dev)** - Build tool
- **[pnpm](https://pnpm.io)** - Package manager
- **[ESLint](https://eslint.org)** - Code linting

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
├── src/                          # Frontend React application
│   ├── App.tsx                   # Main app layout & routing
│   ├── main.tsx                  # Entry point
│   ├── components/
│   │   ├── layout/               # TitleBar, Sidebar, Toolbar, TransferPanel
│   │   ├── explorer/             # FileList, FileRow, FolderRow, Breadcrumb
│   │   ├── settings/             # SettingsPage
│   │   └── connections/          # ConnectionFormPage, DeleteConnectionPage
│   ├── hooks/
│   │   ├── useS3.ts              # S3 operations hook
│   │   ├── useConnectivity.ts    # Internet connectivity detection
│   │   └── useKeyboardShortcuts.ts
│   ├── store/                    # Zustand state stores
│   │   ├── connectionStore.ts    # S3 connections
│   │   ├── navigationStore.ts    # View state & history
│   │   ├── transferStore.ts      # Upload/download queue
│   │   └── settingsStore.ts      # User preferences
│   ├── lib/
│   │   ├── s3Client.ts           # S3 client factory
│   │   └── utils.ts              # Helper functions
│   └── types/
│       └── index.ts              # TypeScript interfaces
│
├── src-tauri/                    # Rust backend (Tauri)
│   ├── src/
│   │   ├── main.rs               # Entry point
│   │   └── lib.rs                # Tauri commands
│   ├── Cargo.toml                # Rust dependencies
│   └── tauri.conf.json           # Tauri configuration
│
├── public/                       # Static assets
├── CHANGELOG.md                  # Version history
├── CONVENTIONS.md                # Coding guidelines
├── PROJECT.md                    # Architecture docs
└── README.md                     # This file
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `F5` | Refresh current folder |
| `Backspace` | Go back in history |
| `Ctrl+U` | Upload files |
| `Ctrl+N` | New folder |
| `Ctrl+F` | Focus search |
| `Delete` | Delete selected items |
| `Escape` | Close modal / Clear selection |

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
- Update documentation as needed

See [CONVENTIONS.md](CONVENTIONS.md) for detailed guidelines.

---

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and release notes.

---

## 🗺️ Roadmap

### Planned Features
- [ ] Multi-select operations (Ctrl+click, Shift+click)
- [ ] Cut/Copy/Paste between folders
- [ ] File preview (images, text, PDF)
- [ ] Drag & drop upload
- [ ] Search within bucket
- [ ] Bucket management (create/delete)
- [ ] Export/import connections
- [ ] S3 presigned URL sharing
- [ ] File versioning support
- [ ] Multipart upload for large files

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

### Built With
- [Tauri](https://tauri.app) - Amazing desktop framework
- [React](https://react.dev) - UI library
- [Tailwind CSS](https://tailwindcss.com) - Styling framework
- [Lucide Icons](https://lucide.dev) - Beautiful icon set

### Inspired By
- [Cyberduck](https://cyberduck.io) - Popular S3 client
- [FileZilla](https://filezilla-project.org) - FTP client
- Windows Explorer & macOS Finder

### Contributors
Thanks to all the people who have contributed to this project!

---

## 📞 Support

### Getting Help
- 📖 Check the [documentation](CONVENTIONS.md)
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

[Report Bug](https://github.com/nasrulhadi/s3-explorer/issues) · [Request Feature](https://github.com/nasrulhadi/s3-explorer/issues/new) · [Documentation](CONVENTIONS.md)

</div>
# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
