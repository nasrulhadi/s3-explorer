# Folders and prefixes

## Goal

Understand how “folders” work on S3, and how create / rename / move / delete behave in the app.

## Prerequisites

- Open bucket with write permission for create/rename/delete

## Mental model

S3 doesn’t have real directories like NTFS.  
A “folder” is usually a **prefix** — keys that share a path ending in `/`.  
The app lists with a delimiter so you get Explorer-like folders.

![Folder tree placeholder](https://placehold.co/1200x800/ccc/f5f5f5/png?text=Folders+as+prefixes)

## Create folder

### Steps

1. **New folder** from toolbar or context menu.  
2. Type a name.  
3. Confirm. Input stays disabled while the request runs.

Under the hood the app puts a **zero-byte marker object** with a trailing `/` (B2 may use a special empty-file name).

> **Note:** Some strict S3-compatible APIs require a proper `Content-Length` on PUT. The app’s Tauri HTTP bridge is set up so empty folder markers still work on those servers.

**Status: implemented**

## Rename

- **Files:** copy-to-new-key + delete old (or equivalent rename path).  
- **Folders:** recursive rename of children (B2-safe style: copy then delete source).  

While renaming, the modal input disables so you don’t keep typing mid-flight.

**Status: implemented**

## Move / copy-paste

- Clipboard store supports **copy/paste** between folders **in the same connection**.  
- Drag-move uses the custom mouse DnD layer.  
- Folder moves are recursive; if a child copy fails, the op should **abort** so the source isn’t half-deleted.

**Status: implemented** (same-connection; not cross-account)

## Delete

- Single or bulk delete.  
- Folders delete recursively.  
- Confirm modal before destructive ops.

> **Warning:** Deletes hit the real bucket. There is no “trash” in the app.

**Status: implemented**

## Related

- [Browse](./04-browse-and-objects.md)  
- [Transfers](./05-transfers.md)  
