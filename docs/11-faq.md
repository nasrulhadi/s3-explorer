# FAQ

## Is my data uploaded to S3 Explorer’s servers?

No. Object data and API calls go between **your app** and **your storage provider**. There’s no app-owned S3 proxy in the architecture.

## Where are credentials stored?

In the app’s local persisted state. With **master password** enabled, connections are encrypted at rest in the vault. Without it, treat storage as less hardened.

## Can I use it with my company’s MinIO / Ceph / custom gateway?

Usually yes via **Custom** (or MinIO provider). API quirks still apply.

## Does it support multipart upload?

Yes for **uploads** via `@aws-sdk/lib-storage` (progress + cancel).

## Can I customize keyboard shortcuts?

Not yet. Settings shows a **read-only** list. Custom binds are future work.

## Why is Indonesian available?

The app ships **EN + ID** UI strings via `useT()`. Product docs in this folder are **English first**; ID docs can come later.

## Is there a mobile app?

No. Desktop only (Tauri).

## Can I preview images/PDFs in-app?

**Status: planned** — not a core feature of the current mainline.

## Related

- [Overview](./00-overview.md)  
- [Troubleshooting](./10-troubleshooting.md)  
- [REFERENCE](./REFERENCE.md)  
