// ============================================================
// S3 Explorer — Utility Helpers
// ============================================================

/**
 * Format a byte count into a human-readable string.
 *
 * @example
 * formatFileSize(1234)       → "1.2 KB"
 * formatFileSize(1048576)    → "1.0 MB"
 * formatFileSize(0)          → "0 B"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB", "PB"] as const;
  const base = 1024;
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(base)),
    units.length - 1,
  );
  const value = bytes / Math.pow(base, exponent);

  // Use 1 decimal place; drop it when it's .0 for whole numbers
  const formatted = value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
  return `${formatted} ${units[exponent]}`;
}

/**
 * Format a Date into a human-readable locale string.
 *
 * Output: "18 Jun 2025, 14:32"  (uses system locale)
 */
export function formatDate(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// Map of file extensions → Lucide React icon names
// (see https://lucide.dev/icons/ for the full list)
const EXTENSION_ICON_MAP: Record<string, string> = {
  // Images
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  svg: "image",
  webp: "image",
  ico: "image",
  bmp: "image",

  // Documents
  pdf: "file-text",
  doc: "file-text",
  docx: "file-text",
  txt: "file-text",
  rtf: "file-text",
  odt: "file-text",

  // Spreadsheets
  xls: "file-spreadsheet",
  xlsx: "file-spreadsheet",
  csv: "file-spreadsheet",
  ods: "file-spreadsheet",

  // Presentations
  ppt: "file-presentation",
  pptx: "file-presentation",
  odp: "file-presentation",

  // Archives
  zip: "archive",
  rar: "archive",
  "7z": "archive",
  tar: "archive",
  gz: "archive",
  bz2: "archive",
  xz: "archive",

  // Audio
  mp3: "music",
  wav: "music",
  flac: "music",
  ogg: "music",
  aac: "music",
  m4a: "music",

  // Video
  mp4: "video",
  avi: "video",
  mkv: "video",
  mov: "video",
  webm: "video",
  flv: "video",

  // Code / data
  js: "file-code",
  ts: "file-code",
  jsx: "file-code",
  tsx: "file-code",
  py: "file-code",
  rs: "file-code",
  go: "file-code",
  java: "file-code",
  c: "file-code",
  cpp: "file-code",
  h: "file-code",
  html: "file-code",
  css: "file-code",
  scss: "file-code",
  json: "file-json",
  xml: "file-code",
  yaml: "file-code",
  yml: "file-code",
  toml: "file-code",
  sh: "terminal",
  bat: "terminal",
  ps1: "terminal",

  // Executables
  exe: "binary",
  msi: "binary",
  dmg: "binary",
  deb: "binary",
  rpm: "binary",
  appimage: "binary",
};

/**
 * Return the Lucide icon name that best represents a file based on its extension.
 *
 * @example
 * getFileIcon("report.pdf")   → "file-text"
 * getFileIcon("photo.jpg")    → "image"
 * getFileIcon("unknown.xyz")  → "file"
 */
export function getFileIcon(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex === -1 || dotIndex === fileName.length - 1) return "file";

  const ext = fileName.slice(dotIndex + 1).toLowerCase();
  return EXTENSION_ICON_MAP[ext] ?? "file";
}

/**
 * Check whether an S3 key represents a folder.
 *
 * S3 convention: a "folder" key always ends with "/".
 *
 * @example
 * isFolder("photos/")            → true
 * isFolder("photos/vacation/")   → true
 * isFolder("photos/cat.jpg")     → false
 */
export function isFolder(key: string): boolean {
  return key.endsWith("/");
}

/**
 * Extract the display name of an item from its full S3 key.
 *
 * If a `prefix` is provided, it is stripped from the beginning of the key
 * so that only the "local" name inside the current folder is returned.
 *
 * @example
 * getItemName("photos/vacation/beach.jpg", "photos/vacation/")  → "beach.jpg"
 * getItemName("photos/vacation/",          "photos/")           → "vacation"
 * getItemName("readme.md",                 "")                  → "readme.md"
 * getItemName("my-bucket",                 "")                  → "my-bucket"
 */
export function getItemName(key: string, prefix: string): string {
  // Strip the prefix if present
  let name = prefix && key.startsWith(prefix) ? key.slice(prefix.length) : key;

  // Remove trailing slash (folders)
  if (name.endsWith("/")) {
    name = name.slice(0, -1);
  }

  // For nested keys without a prefix, return the last segment
  if (!prefix) {
    const lastSlash = name.lastIndexOf("/");
    if (lastSlash !== -1) {
      name = name.slice(lastSlash + 1);
    }
  }

  return name;
}
