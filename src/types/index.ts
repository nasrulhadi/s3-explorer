// ============================================================
// S3 Explorer — TypeScript Types & Interfaces
// ============================================================

// --- Provider & Item Types ---

/** S3-compatible storage provider */
export type S3Provider = "aws" | "minio" | "r2" | "b2" | "custom";

/** Type of an item inside a bucket */
export type ItemType = "file" | "folder" | "bucket";

/** Transfer direction */
export type TransferType = "upload" | "download" | "move";

/** Transfer lifecycle status */
export type TransferStatus = "pending" | "active" | "done" | "error";

/** Sortable fields for the file list */
export type SortField = "name" | "size" | "lastModified" | "storageClass";

/** Sort direction */
export type SortDirection = "asc" | "desc";

/** Context menu action types for files */
export type FileContextAction =
  | "download"
  | "copy-url"
  | "rename"
  | "delete"
  | "get-info";

/** Context menu action types for folders */
export type FolderContextAction = "download-zip" | "delete" | "get-info";

// --- Core Domain Models ---

/** Koneksi ke S3-compatible storage */
export interface S3Connection {
  id: string;
  name: string; // label user, mis: "AWS Production"
  provider: S3Provider;
  endpoint?: string; // untuk non-AWS (MinIO, R2, dll)
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** Default bucket for providers that don't support ListBuckets (e.g. R2). 1 connection = 1 bucket. */
  defaultBucket?: string;
  createdAt: number;
}

/** Form data untuk tambah/edit koneksi (tanpa id & createdAt) */
export type S3ConnectionFormData = Omit<S3Connection, "id" | "createdAt">;

/** Item di dalam bucket (file, folder, atau bucket itu sendiri) */
export interface S3Item {
  key: string; // full S3 key
  name: string; // nama tampilan (bagian terakhir dari key)
  type: ItemType;
  size?: number; // bytes, hanya untuk file
  lastModified?: Date;
  etag?: string;
  storageClass?: string;
}

// --- Navigation ---

/** State navigasi aplikasi */
export interface NavigationState {
  connectionId: string | null;
  bucket: string | null;
  prefix: string; // path folder sekarang, mis: "folder/subfolder/"
  history: string[]; // untuk tombol back
}

/** Satu segmen pada breadcrumb navigasi */
export interface BreadcrumbItem {
  label: string;
  /** Full prefix path up to this segment (empty string for root/bucket) */
  prefix: string;
}

// --- Transfer (Upload / Download) ---

/** Transfer (upload/download) progress tracker */
export interface Transfer {
  id: string;
  type: TransferType;
  fileName: string;
  totalBytes: number;
  transferredBytes: number;
  status: TransferStatus;
  error?: string;
  /** S3 key of the object being transferred */
  key?: string;
  /** Bucket the transfer belongs to */
  bucket?: string;
  /** Connection ID that owns this transfer */
  connectionId?: string;
}

// --- File List Sorting & Filtering ---

/** Pengaturan sorting untuk file list */
export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

/** Filter/search state untuk folder aktif */
export interface FilterConfig {
  query: string;
}

// --- Modal & Dialogs ---

/** Info detail file/folder untuk modal "Get Info" */
export interface ItemInfo {
  name: string;
  key: string;
  type: ItemType;
  size?: number;
  lastModified?: Date;
  etag?: string;
  storageClass?: string;
  /** Computed human-readable size string, e.g. "12.4 MB" */
  sizeFormatted?: string;
}

/** Presigned URL result */
export interface PresignedUrlResult {
  url: string;
  expiresAt: Date;
}

// --- Context Menu ---

/** Item yang dikirim ke context menu handler */
export interface ContextMenuTarget {
  item: S3Item;
  /** Mouse position for menu placement */
  position: { x: number; y: number };
}

// --- API Response Wrappers ---

/** Generic async operation state */
export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

/** Result dari list bucket operation */
export interface ListBucketsResult {
  buckets: S3Item[];
}

/** Result dari list objects operation (folder contents) */
export interface ListObjectsResult {
  /** Items (files + folders) in current prefix */
  items: S3Item[];
  /** Whether there are more items to load (pagination) */
  isTruncated: boolean;
  /** Continuation token for next page */
  continuationToken?: string;
}
