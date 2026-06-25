# S3 Explorer — Project Overview

## Apa ini?
Aplikasi desktop untuk manajemen object storage S3-compatible (AWS S3, MinIO, Cloudflare R2, Backblaze B2, dll).
Tampilannya seperti Windows Explorer / Finder — navigasi folder dengan klik, aksi file via klik kanan.

## Tech Stack
- **Framework desktop**: Tauri v2 (Rust backend — minimal shell)
- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4 (CSS-based config, no `tailwind.config.js`)
- **Package manager**: pnpm
- **AWS SDK**: `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (AWS SDK JS v3)
- **State management**: Zustand v5 (5 stores, 4 persisted)
- **Async data**: TanStack Query v5
- **Virtualized list**: TanStack Virtual v3 (untuk bucket dengan ribuan file)
- **Context menu**: Radix UI (`@radix-ui/react-context-menu`)
- **Icons**: Lucide React
- **Font**: Onest (`@fontsource/onest`)
- **Notifications/toast**: Sonner
- **ZIP download**: JSZip
- **Build tool**: Vite v7

## Arsitektur

### CORS Bypass — Inti Arsitektur

Semua HTTP traffic AWS SDK di-route melalui Tauri native HTTP plugin (`@tauri-apps/plugin-http`) untuk bypass CORS. S3-compatible providers (R2, B2, MinIO) umumnya tidak serve CORS headers, jadi browser `fetch` akan di-block oleh WebView.

Custom HTTP handler di `src/lib/s3Client.ts` implement `handle()` method yang mirror `@smithy/fetch-http-handler`'s `FetchHttpHandler`, tapi pakai Tauri's `fetch` instead of `globalThis.fetch`.

### Backend Rust — Minimal Shell

Backend Rust (`src-tauri/`) hanya:
- Host frameless desktop window (custom title bar, `decorations: false`)
- Provide HTTP plugin sebagai CORS-bypass proxy
- Provide opener plugin (open URLs/files di OS default handler)
- **Tidak ada S3 logic, database, atau filesystem access di Rust**
- Command `greet` di `lib.rs` adalah boilerplate yang tidak dipakai (dead code)

### Frontend React — Semua Application Logic

Semua S3 operations (auth, listing, presigning, uploads, downloads) jalan di renderer process.

## Struktur Project
```
src/                             ← frontend React
  main.tsx                       ← entry point, QueryClient setup
  App.tsx                        ← root layout, view routing, theme/accent
  App.css                        ← Tailwind v4 import + CSS variables (light/dark)
  assets/                        ← provider icons (s3-s3.svg, s3-r2.svg, etc.)
  components/
    ConnectionFormPage.tsx       ← add/edit connection (page, not modal)
    DeleteConnectionPage.tsx     ← delete connection confirmation (page)
    SettingsPage.tsx             ← settings: theme, accent, toolbar, export/import
    explorer/
      FileList.tsx               ← list file/folder utama (virtualized, ~2300 lines)
      FileRow.tsx                ← satu baris file
      FolderRow.tsx              ← satu baris folder
      UploadModal.tsx            ← upload progress modal
    layout/
      TitleBar.tsx               ← custom frameless title bar
      Sidebar.tsx                ← daftar koneksi + bucket
      Toolbar.tsx                ← breadcrumb + tombol aksi + filter
      TransferPanel.tsx          ← floating transfer progress (bottom-right)
    modals/
      AddConnectionModal.tsx     ← legacy (superseded by ConnectionFormPage)
      ImportConnectionsModal.tsx ← import encrypted connections backup
      PassphraseModal.tsx        ← passphrase input untuk encrypt/decrypt
  hooks/
    useS3.ts                     ← central S3 operations (queries + mutations)
    useConnectivity.ts           ← deteksi konektivitas internet (60s interval)
    useDownload.ts               ← download progress tracking
    useKeyboardShortcuts.ts      ← global keyboard shortcuts
  store/
    connectionStore.ts           ← Zustand: koneksi S3 (persisted)
    navigationStore.ts           ← Zustand: path, bucket, history (partially persisted)
    transferStore.ts             ← Zustand: queue upload/download/move (NOT persisted)
    settingsStore.ts             ← Zustand: preferences (persisted)
    clipboardStore.ts            ← Zustand: copy/paste items (NOT persisted)
  lib/
    s3Client.ts                  ← S3 client factory + custom Tauri HTTP handler
    utils.ts                     ← helper: formatFileSize, formatDate, getFileIcon, dll
    crypto.ts                    ← AES-256-GCM encryption untuk export/import
    accentColors.ts              ← definisi accent colors (5 warna, light/dark)
  types/
    index.ts                     ← semua TypeScript types/interfaces
src-tauri/                       ← Rust backend (minimal shell)
  src/
    main.rs                      ← binary entry point
    lib.rs                       ← Tauri builder + greet command (boilerplate)
  Cargo.toml                     ← deps: tauri, tauri-plugin-http, tauri-plugin-opener
  tauri.conf.json                ← app config (frameless, 1200x800, CSP null)
  capabilities/default.json      ← permissions: window controls, http, opener
```

## Types Utama (TypeScript)
```typescript
// Koneksi ke S3-compatible storage
interface S3Connection {
  id: string;
  name: string;            // label user, mis: "AWS Production"
  provider: S3Provider;    // "aws" | "minio" | "r2" | "b2" | "custom"
  endpoint?: string;       // untuk non-AWS (MinIO, R2, dll)
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  defaultBucket?: string;  // untuk R2/B2 yang tidak support ListBuckets
  createdAt: number;
}

// Item di dalam bucket (file atau folder)
interface S3Item {
  key: string;             // full S3 key
  name: string;            // nama tampilan (bagian terakhir dari key)
  type: ItemType;          // "file" | "folder" | "bucket"
  size?: number;           // bytes, hanya untuk file
  lastModified?: Date;
  etag?: string;
  storageClass?: string;
}

// State navigasi
interface NavigationState {
  connectionId: string | null;
  bucket: string | null;
  prefix: string;          // path folder sekarang, mis: "folder/subfolder/"
  history: string[];       // untuk tombol back
}

// Transfer (upload/download/move)
interface Transfer {
  id: string;
  type: TransferType;      // "upload" | "download" | "move"
  fileName: string;
  totalBytes: number;
  transferredBytes: number;
  status: TransferStatus;  // "pending" | "active" | "done" | "error"
  error?: string;
  key?: string;
  bucket?: string;
  connectionId?: string;
}
```

## Fitur yang Sudah Diimplementasi

### Core
1. **Manajemen koneksi** — tambah, edit, hapus koneksi S3 (credentials di localStorage via Zustand persist)
2. **Browse bucket** — klik koneksi → list semua bucket (R2/B2 pakai defaultBucket karena tidak support ListBuckets)
3. **Browse folder** — klik folder → masuk ke dalam, breadcrumb update
4. **Navigasi back** — tombol back, klik breadcrumb, history stack
5. **Right-click menu** pada file:
   - Download
   - Copy URL (presigned URL)
   - Rename
   - Delete
   - Get Info (modal dengan metadata)
6. **Right-click menu** pada folder:
   - Download folder (sebagai ZIP via JSZip)
   - Delete folder (recursive, B2-safe)
   - Get Info
7. **Upload file** — via tombol Upload atau drag & drop (custom mouse-based, bukan HTML5 DnD)
8. **Create folder** — tombol New Folder
9. **Progress indicator** — TransferPanel floating dengan real-time progress
10. **Search/filter** — filter nama file di folder aktif

### Tambahan
- **Multi-select** — Ctrl+klik, Shift+klik
- **Copy/Paste** — antar folder dalam connection yang sama (clipboardStore)
- **Custom drag & drop** — mouse-based (HTML5 DnD broken di Tauri WebView2)
- **Recursive folder move** — copy all children → delete source (B2-safe)
- **Recursive folder rename** — copy all children → delete originals
- **Dark mode** — system / light / dark (stored di settingsStore)
- **Theming** — 5 accent colors (blue, green, yellow, brown, stone)
- **Keyboard shortcuts** — F5, Ctrl+R, Backspace, Ctrl+U, Delete, Escape
- **Encrypted export/import** — AES-256-GCM + PBKDF2 untuk backup connections
- **Provider-specific icons** — custom SVG untuk R2, B2, IO (MinIO), S3 (AWS/Custom)
- **Get Info modal** — metadata file/folder dengan copy button per field
- **Get URL modal** — presigned URL dengan copy button
- **Connectivity indicator** — online/offline detection (60s interval)
- **Activity indicator** — pulse animation saat transfer aktif
- **Virtual scrolling** — handle ribuan file dengan TanStack Virtual
- **Toolbar customization** — toggle filter/upload/new-folder/reload/breadcrumbs

### Belum Diimplementasi
- Preview file (gambar, teks, PDF)
- Sync folder lokal ↔ S3
- `download_file` Rust command untuk large files (>100MB) — masih TODO
- Download cancellation
- Bucket management (create/delete bucket)
- Multipart upload untuk file besar

## S3 Operations yang Digunakan
```typescript
// List semua bucket (tidak support R2/B2 — pakai defaultBucket)
ListBucketsCommand

// List isi folder (dengan delimiter "/" untuk folder virtual)
ListObjectsV2Command({ Bucket, Prefix, Delimiter: "/" })

// Download file
GetObjectCommand → response body di JS (belum via Rust)

// Upload file
PutObjectCommand

// Delete file/folder
DeleteObjectCommand / DeleteObjectsCommand (batch, recursive untuk folder)

// Generate presigned URL (share link)
getSignedUrl + GetObjectCommand (@aws-sdk/s3-request-presigner)

// Rename (S3 tidak punya rename → CopyObject + DeleteObject)
CopyObjectCommand + DeleteObjectCommand

// Create folder (S3 folder = object dengan key diakhiri "/")
PutObjectCommand({ Key: "folder/", Body: "" })
```

## Desain UI
- **Theming**: CSS custom properties (`--s3-*`) di `App.css` untuk light/dark mode
- **Accent colors**: 5 pilihan (blue, green, yellow, brown, stone) — di-inject dinamis via `App.tsx`
- **Font**: Onest (@fontsource/onest)
- **Layout**: 2 panel — sidebar kiri (koneksi + bucket) + area utama (file list)
- **Nuansa**: Modern, clean, mirip Cyberduck tapi lebih minimalis
- **Title bar**: Custom frameless (`decorations: false`) dengan minimize/maximize/close
- **Toolbar**: Breadcrumb navigasi + tombol Upload, New Folder, Refresh + filter
- **Status bar**: Di bawah, tampilkan jumlah item + selection count + connectivity + activity
- **Transfer panel**: Floating bottom-right, auto-remove completed after 4s
- **Window**: 1200×800 default, min 1024×600, `resizable: false`

## Konvensi Kode
- Semua komponen React: functional component + hooks
- TypeScript strict mode ON (`strict`, `noUnusedLocals`, `noUnusedParameters`)
- Nama file komponen: PascalCase (mis: `FileList.tsx`)
- Nama file hooks/utils: camelCase (mis: `useS3.ts`)
- Error handling: selalu wrap S3 calls dalam try/catch, tampilkan error toast via Sonner
- Loading state: selalu ada spinner/skeleton saat fetch data
- Hindari `any` di TypeScript — gunakan type yang proper
- State: selective subscriptions via Zustand selectors (jangan subscribe whole store)
- Tailwind: pakai CSS variables (`var(--s3-*)`), hindari dynamic class names

## Cara Menjalankan
```bash
pnpm install          # install dependencies
pnpm tauri dev        # jalankan development mode (hot reload)
pnpm tauri build      # build installer untuk distribusi
```

## Environment / Platform
- Target platform: Windows (utama), macOS, Linux
- Tauri v2
- Node.js LTS
- Rust stable
- pnpm

## Catatan Penting
- Credentials S3 disimpan di localStorage (Zustand persist) — **belum** pakai Tauri secure store / OS keychain
- `download_file` Rust command untuk large files **belum diimplementasi** — semua download masih via JS
- S3 folder itu virtual (tidak benar-benar ada) — folder = prefix string yang diakhiri "/"
- Saat ListObjectsV2 dengan Delimiter "/": `CommonPrefixes` = folder, `Contents` = file
- R2 dan B2 tidak support ListBuckets — pakai `defaultBucket` field di connection
- HTML5 Drag & Drop broken di Tauri WebView2 — pakai mouse-based implementation
- Rate limit AWS: hindari request terlalu cepat, implementasi exponential backoff untuk retry
- CSP disabled (`"csp": null` di tauri.conf.json)
- Backend Rust hanya shell — semua app logic di frontend TypeScript

---

**Last Updated**: 2026-06-25
**Current Version**: v1.1.5
