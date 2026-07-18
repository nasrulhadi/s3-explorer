# Connections

## Goal

Add, edit, delete, and back up S3 connections.

## Prerequisites

- App unlocked (if master password is on)

## Providers in the form

Pick one of:

- **AWS S3**  
- **Cloudflare R2**  
- **Backblaze B2**  
- **MinIO**  
- **Custom**

Fields change a bit per provider (endpoint, region, default bucket, force path style, etc.).

![Connection form placeholder](https://placehold.co/1200x800/ccc/f5f5f5/png?text=Connection+form)

> **Warning:** Access keys are secrets. Treat export files and screenshots carefully.

> **Tip:** For custom endpoints, if you use plain `http://` to a non-local host, the form may show a warning. Prefer HTTPS when you can.

**Status: implemented**

## Add a connection

### Steps

1. Sidebar footer **+** or Welcome **Add connection**.  
2. Choose provider (icon button group).  
3. Enter:
   - Display name  
   - Access key / secret  
   - Endpoint / region / bucket fields as shown  
4. Optional: emoji icon for the connection.  
5. Save.

### Verify

- Connection appears in the sidebar.  
- Clicking it lists buckets (or jumps into default bucket for R2/B2-style setups).

## Edit / delete

- Hover a connection → pencil / trash.  
- Edit opens the form page again.  
- Delete asks for confirmation on a dedicated page (not a tiny modal).

**Status: implemented**

## Emoji icons

Connections can use a curated emoji picker (categories, search). Purely cosmetic — helps you spot “prod” vs “dev” fast.

**Status: implemented**

## Export / import

Settings → **Data**:

- **Export** — encrypted backup of connections (AES-256-GCM + strong PBKDF2).  
- **Import** — restore from backup with preview.

If the **local vault** (master password) is on, export may require the master password first (**export guard**).

**Status: implemented**

## Multi-bucket sidebar

Custom / AWS-style accounts that support listing buckets show a **tree** under the connection:

```text
My MinIO
├── bucket-a
└── bucket-b
```

- Active bucket: bold accent text + small green dot  
- Clicking a bucket from Settings (or any other page) should bring you back to the explorer  

**Status: implemented**

## Related

- [First run](./02-first-run.md)  
- [Security](./07-security-and-privacy.md)  
- [REFERENCE – providers](./REFERENCE.md#providers)  
