# S3 Explorer — Project Overview

## Apa ini?
Aplikasi desktop untuk manajemen object storage S3-compatible (AWS S3, MinIO, Cloudflare R2, Backblaze B2, dll).
Tampilannya seperti Windows Explorer / Finder — navigasi folder dengan klik, aksi file via klik kanan.

## Tech Stack
- **Framework desktop**: Tauri v2 (Rust backend)
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS v4
- **Package manager**: pnpm
- **AWS SDK**: `@aws-sdk/client-s3` (AWS SDK JS v3)
- **State management**: Zustand
- **Async data**: TanStack Query (React Query v5)
- **Context menu**: Radix UI (`@radix-ui/react-context-menu`)
- **Icons**: Lucide React
- **Virtualized list**: TanStack Virtual (untuk bucket dengan ribuan file)
- **Notifications/toast**: Sonner

## Struktur Project
```
src/                        ← frontend React
  App.tsx
  main.tsx
  components/
    layout/
      Sidebar.tsx           ← daftar bucket + navigasi
      Toolbar.tsx           ← breadcrumb + tombol aksi
    explorer/
      FileList.tsx          ← list file/folder utama (virtualized)
      FileRow.tsx           ← satu baris file/folder
      FolderRow.tsx         ← satu baris folder
      BreadcrumbNav.tsx     ← path navigasi atas
      ContextMenu.tsx       ← right-click menu
      EmptyState.tsx        ← tampilan kosong
    modals/
      AddConnectionModal.tsx   ← tambah koneksi S3 baru
      CreateFolderModal.tsx
      RenameModal.tsx
      DeleteConfirmModal.tsx
    common/
      Button.tsx
      Input.tsx
      Modal.tsx
      Spinner.tsx
      ProgressBar.tsx
  hooks/
    useS3.ts               ← hook utama untuk semua S3 operations
    useConnections.ts      ← manajemen saved connections
    useNavigation.ts       ← state navigasi (path, bucket aktif)
    useDownload.ts         ← download progress tracking
  store/
    connectionStore.ts     ← Zustand: daftar koneksi S3
    navigationStore.ts     ← Zustand: path sekarang, bucket aktif
    transferStore.ts       ← Zustand: queue upload/download
  lib/
    s3Client.ts            ← factory function buat S3Client
    utils.ts               ← helper: format ukuran file, tanggal, dll
  types/
    index.ts               ← semua TypeScript types/interfaces
src-tauri/                 ← Rust backend Tauri
  src/
    main.rs
    lib.rs
    commands/
      download.rs          ← download file via Rust (lebih reliable untuk file besar)
      fs.rs                ← akses filesystem lokal
```

## Types Utama (TypeScript)
```typescript
// Koneksi ke S3-compatible storage
interface S3Connection {
  id: string
  name: string            // label user, mis: "AWS Production"
  provider: 'aws' | 'minio' | 'r2' | 'b2' | 'custom'
  endpoint?: string       // untuk non-AWS (MinIO, R2, dll)
  region: string
  accessKeyId: string
  secretAccessKey: string
  createdAt: number
}

// Item di dalam bucket (file atau folder)
interface S3Item {
  key: string             // full S3 key
  name: string            // nama tampilan (bagian terakhir dari key)
  type: 'file' | 'folder' | 'bucket'
  size?: number           // bytes, hanya untuk file
  lastModified?: Date
  etag?: string
  storageClass?: string
}

// State navigasi
interface NavigationState {
  connectionId: string | null
  bucket: string | null
  prefix: string          // path folder sekarang, mis: "folder/subfolder/"
  history: string[]       // untuk tombol back
}

// Transfer (upload/download)
interface Transfer {
  id: string
  type: 'upload' | 'download'
  fileName: string
  totalBytes: number
  transferredBytes: number
  status: 'pending' | 'active' | 'done' | 'error'
  error?: string
}
```

## Fitur yang Harus Ada (MVP)
1. **Manajemen koneksi** — tambah, edit, hapus koneksi S3 (credentials disimpan di local storage / Tauri store)
2. **Browse bucket** — klik koneksi → list semua bucket
3. **Browse folder** — klik folder → masuk ke dalam, breadcrumb update
4. **Navigasi back** — tombol back, klik breadcrumb
5. **Right-click menu** pada file:
   - Download
   - Copy URL (presigned URL)
   - Rename
   - Delete
   - Get Info (size, tanggal, storage class)
6. **Right-click menu** pada folder:
   - Download folder (sebagai ZIP)
   - Delete folder
   - Get Info
7. **Upload file** — drag & drop ke area utama, atau tombol Upload
8. **Create folder** — tombol New Folder
9. **Progress indicator** — saat download/upload berlangsung
10. **Search/filter** — filter nama file di folder aktif

## Fitur Tambahan (Post-MVP)
- Multi-select file (Ctrl+klik, Shift+klik)
- Cut/Copy/Paste antar folder
- Preview file (gambar, teks, PDF)
- Dark mode
- Keyboard shortcuts
- Sync folder lokal ↔ S3

## S3 Operations yang Digunakan
```typescript
// List semua bucket
ListBucketsCommand

// List isi folder (dengan delimiter "/" untuk folder virtual)
ListObjectsV2Command({ Bucket, Prefix, Delimiter: "/" })

// Download file
GetObjectCommand → stream ke disk via Tauri

// Upload file
PutObjectCommand atau multipart untuk file besar

// Delete file/folder
DeleteObjectCommand / DeleteObjectsCommand (batch)

// Generate presigned URL (share link)
getSignedUrl + GetObjectCommand

// Rename (S3 tidak punya rename → CopyObject + DeleteObject)
CopyObjectCommand + DeleteObjectCommand

// Create folder (S3 folder = object dengan key diakhiri "/")
PutObjectCommand({ Key: "folder/", Body: "" })
```

## Desain UI
- **Warna brand**: Dark sidebar (#1a1a2e), Content area (#f8f9fa), Accent (#3b82f6 biru)
- **Font**: Inter atau system font
- **Layout**: 2 panel — sidebar kiri (koneksi + bucket) + area utama (file list)
- **Nuansa**: Modern, clean, mirip Cyberduck tapi lebih minimalis
- **Toolbar**: Breadcrumb navigasi + tombol Upload, New Folder, Refresh
- **Status bar**: Di bawah, tampilkan jumlah item + total size folder

## Konvensi Kode
- Semua komponen React: functional component + hooks
- TypeScript strict mode ON
- Nama file komponen: PascalCase (mis: `FileList.tsx`)
- Nama file hooks/utils: camelCase (mis: `useS3.ts`)
- Error handling: selalu wrap S3 calls dalam try/catch, tampilkan error toast via Sonner
- Loading state: selalu ada spinner/skeleton saat fetch data
- Hindari `any` di TypeScript — gunakan type yang proper

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

## Catatan Penting
- Credentials S3 **JANGAN** di-hardcode — simpan via Tauri's secure store atau OS keychain
- Untuk download file besar (>100MB), gunakan Rust command di `src-tauri` bukan JS fetch
- S3 folder itu virtual (tidak benar-benar ada) — folder = prefix string yang diakhiri "/"
- Saat ListObjectsV2 dengan Delimiter "/": `CommonPrefixes` = folder, `Contents` = file
- Rate limit AWS: hindari request terlalu cepat, implementasi exponential backoff untuk retry