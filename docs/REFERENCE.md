# Reference

Deep tables and glossary. Prefer the how-to pages for day-to-day steps.

## Glossary

| Term | Meaning here |
|------|----------------|
| Bucket | Top-level container in S3-compatible storage |
| Key | Full object path (string) |
| Prefix | “Folder path” portion of keys |
| Connection | Saved endpoint + credentials + provider settings |
| Vault | Encrypted local store when master password is on |
| Presigned URL | Time-limited signed link to an object |
| Transfer | Upload / download / move job in the floating panel |

## Providers matrix

| Provider | List buckets | Notes |
|----------|--------------|--------|
| AWS S3 | Yes | Standard |
| Cloudflare R2 | Often limited | Default bucket workflow common |
| Backblaze B2 | Often limited | Empty folder placeholder for B2 |
| MinIO | Yes (typical) | Custom endpoint |
| Custom | Depends on vendor | Path-style; Content-Length quirks fixed in HTTP bridge |

**Status: implemented** as product features; exact API behavior is vendor-dependent.

## Limits (app-enforced)

| Limit | Value | Where |
|-------|-------|--------|
| ZIP download max files | 250 | Folder ZIP download |
| ZIP download max size | 500 MB | Folder ZIP download |
| Upload part size | 8 MB | `@aws-sdk/lib-storage` defaults in `useUpload` |
| Upload queue size | 4 concurrent parts | `useUpload` |

Values are from current code; always re-check source if you need absolute accuracy.

## Local data (conceptual)

| Data | Mechanism |
|------|-----------|
| Connections / settings / security flags | Zustand persist → browser storage (WebView) |
| Vault ciphertext | Encrypted when master password enabled |
| Column widths, theme, language | settings store |
| Transfer queue | In-memory (not meant to survive restart) |

Exact storage keys use `s3-explorer-*` style names in the stores (see source under `src/store/`).

## Keyboard shortcuts (quick)

| Keys | Action |
|------|--------|
| F5 / Ctrl+R | Refresh |
| Backspace | Back |
| Ctrl+U | Upload |
| Delete | Delete selection |
| Escape | Close / deselect |

Full page: [09-keyboard-shortcuts.md](./09-keyboard-shortcuts.md)

## Stack (high level)

| Layer | Tech |
|-------|------|
| Shell | Tauri v2 |
| UI | React 19 + TypeScript + Tailwind v4 |
| S3 | `@aws-sdk/client-s3`, `@aws-sdk/lib-storage`, `@aws-sdk/s3-request-presigner` |
| State | Zustand + TanStack Query |
| List perf | TanStack Virtual |

## License

MIT — see repo root `LICENSE`.

## Related

- [Docs index](./README.md)  
- [Changelog](../CHANGELOG.md)  
- [App README](../README.md)  
