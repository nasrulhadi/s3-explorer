# Overview

## Goal

Get a clear picture of what **S3 Explorer** is, who should use it, and how it sits on your machine.

## What it is

S3 Explorer is a **desktop app** (Tauri + React) for browsing and managing **S3-compatible object storage**. Think “Windows Explorer / Finder, but for buckets.”

You add a connection (access key + secret + endpoint), open a bucket, then upload, download, rename, delete, copy URLs, and so on.

![App overview placeholder](https://placehold.co/1200x800/ccc/f5f5f5/png?text=S3+Explorer+main+window)

## What it is not

- Not a full AWS Console replacement (no IAM wizard, no CloudFront, no account billing).
- Not a sync client like `rclone` with continuous two-way sync (**Status: planned** for local ↔ S3 sync).
- Not a cloud SaaS — **no remote server of ours** holds your keys. Credentials stay on your machine (localStorage / encrypted vault).
- Not a CLI. Everything is GUI-first.

## Who it’s for

- Devs and power users who already know “bucket / key / prefix.”
- People hopping between **AWS S3**, **Cloudflare R2**, **Backblaze B2**, **MinIO**, or other S3-compatible APIs.
- Anyone who wants a lighter feel than the web console for day-to-day file ops.

## Supported providers

| Provider | In app | Notes |
|----------|--------|--------|
| AWS S3 | Yes | Standard endpoint / region |
| Cloudflare R2 | Yes | Often uses a fixed “default” bucket; ListBuckets may not apply |
| Backblaze B2 | Yes | S3-compatible API; empty folders use a B2-friendly placeholder |
| MinIO | Yes | Custom endpoint + path-style |
| Custom S3-compatible | Yes | Your own endpoint URL |

> **Note:** If a provider is S3 API compatible, **Custom** is usually the path. Quirks (CORS, ListBuckets, Content-Length) still depend on the vendor.

## High-level architecture

```text
┌─────────────────────────────┐
│  React UI (frontend)        │
│  AWS SDK v3 for S3          │
│  Zustand + TanStack Query   │
└──────────────┬──────────────┘
               │ HTTP via Tauri plugin
               │ (native fetch → bypasses browser CORS)
┌──────────────▼──────────────┐
│  Tauri v2 shell (Rust)      │
│  Window, HTTP, opener,      │
│  updater plugins            │
└─────────────────────────────┘
```

- **All S3 logic runs in the frontend** (TypeScript).
- Rust is a **thin shell**: window chrome, native HTTP, open URLs, auto-update.
- No app-owned cloud proxy for your S3 traffic.

**Status: implemented**

## Platforms

| Platform | Badge / intent |
|----------|----------------|
| Windows | Primary (WebView2) |
| macOS | Supported in project packaging |
| Linux | Supported in project packaging |

See [Install](./01-install.md) for real install paths.

## License

**MIT** — see the repo `LICENSE` file.

## Where to go next

1. [Install](./01-install.md)  
2. [First run](./02-first-run.md)  
3. [Connections](./03-connections.md)  

## Related

- [REFERENCE.md](./REFERENCE.md) — glossary + limits  
- [FAQ](./11-faq.md)  
