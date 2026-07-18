# Transfers

## Goal

Upload and download objects with progress you can actually see — and cancel when you need to bail.

## Prerequisites

- Open bucket + permission to read/write objects

## Upload

### Steps

1. Click **Upload** (toolbar) or use **Ctrl+U**.  
2. Pick files and/or folders; review the list (you can add more).  
3. Confirm upload.  
4. Watch the **Transfer panel** (bottom-right). Progress should move as bytes go out.

![Upload modal placeholder](https://placehold.co/1200x800/ccc/f5f5f5/png?text=Upload+modal)

### How it works (tech-ish, short)

Uploads use **`@aws-sdk/lib-storage`** (`Upload` class) — multipart under the hood with progress events.  
That’s why big files don’t just “freeze then done” with zero feedback.

**Status: implemented**

### Cancel upload

In the Transfer panel, hit cancel on an **active upload**. The transfer should stop and show a cancelled / error-style state.

**Status: implemented**

## Download

### Single file

Right-click → **Download** (or equivalent). Progress appears in the Transfer panel. Cancel uses an abort signal on the HTTP download.

**Status: implemented**

### Folder as ZIP

Download a folder as a **ZIP** (JSZip). Hard limits apply (file count / total size). If you blow the limit, a **ZIP error** modal explains why.

| Limit | Approx. value in app |
|-------|----------------------|
| Max files in ZIP | 250 |
| Max total size | 500 MB |

**Status: implemented** (limits may change; see [REFERENCE](./REFERENCE.md#limits))

## Transfer panel

- Lists active + recent transfers  
- Progress bar + transferred bytes  
- Cancel for upload/download; **move** ops may hide cancel (not safely interruptible mid recursive copy/delete)  

![Transfer panel placeholder](https://placehold.co/1200x800/ccc/f5f5f5/png?text=Transfer+panel)

**Status: implemented**

## Large files / multipart

- **Upload:** multipart via lib-storage — good path for larger files.  
- **Download:** streaming through JS; a dedicated Rust large-file download path is still **Status: planned / partial**.  
- **Cancel download:** works for the current JS path; edge cases with huge files may still improve later.

## Related

- [Browse](./04-browse-and-objects.md)  
- [Troubleshooting](./10-troubleshooting.md)  
