# Browse and objects

## Goal

Move around a bucket, select objects, and use context actions.

## Prerequisites

- A working [connection](./03-connections.md) and an open bucket

## Main layout

| Area | Role |
|------|------|
| Sidebar | Connections + buckets |
| Toolbar | Breadcrumbs, filter, upload, new folder, reload |
| File list | Virtualized list of folders + files |
| Status bar | Item counts, selection, activity |
| Transfer panel | Floating progress (bottom-right when busy) |

![Main explorer placeholder](https://placehold.co/1200x800/ccc/f5f5f5/png?text=Explorer+layout)

**Status: implemented**

## Navigate

1. Click a **folder** row to enter that prefix.  
2. Use **breadcrumbs** to jump up.  
3. **Backspace** goes back (history).  
4. **F5** or **Ctrl+R** refreshes the current listing.

## Select

- Click a row to select.  
- **Ctrl+click** multi-select.  
- **Shift+click** range select.  
- Status bar shows `1 selected` / `N selected`.

**Status: implemented**

## Filter

Toolbar filter narrows the **current folder** by name (not a full-bucket search).

> **Note:** Search-within-bucket is **Status: planned**.

## Context menu (right-click)

Typical actions (exact labels follow UI language):

| Target | Actions |
|--------|---------|
| File | Download, Copy URL, Rename, Delete, Get Info |
| Folder | Download as ZIP, Delete, Get Info, … |
| Empty area | New folder, paste, refresh-style actions where wired |

![Context menu placeholder](https://placehold.co/1200x800/ccc/f5f5f5/png?text=Context+menu)

**Status: implemented** (menu contents can vary by selection)

## Get Info

Shows metadata (size, last modified, storage class, content type, etc.) with per-field copy.

## Presigned URL

**Copy URL** / URL modal: generates a **presigned** link you can share. Copy button + auto-copy behavior may apply.

> **Warning:** Anyone with a valid presigned URL can access that object until it expires. Don’t paste secrets into public chats.

**Status: implemented**

## Columns

Resizable **Name / Size / Modified / Class** headers. Widths can persist across restarts.

**Status: implemented**

## Drag & drop (inside the app)

Custom **mouse-based** drag (HTML5 DnD is unreliable in Tauri WebView2). Use it to move items between folders when the UI allows.

**Status: implemented** (OS → app drop is handled via the upload flow when files are dropped into the app)

## Empty state

No bucket / empty folder shows a friendly empty state with shortcut hints.

**Status: implemented**

## Related

- [Transfers](./05-transfers.md)  
- [Folders](./06-folders-and-prefixes.md)  
- [Shortcuts](./09-keyboard-shortcuts.md)  
