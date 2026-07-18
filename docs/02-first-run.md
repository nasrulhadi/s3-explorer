# First run

## Goal

Open the app for the first time, land on Welcome / Unlock, and get into a bucket.

## Prerequisites

- App installed or running via `pnpm tauri dev` — [Install](./01-install.md)

## What you’ll see

### A) No master password, no connections

**Welcome** screen (split layout): add a connection or import a backup.

![Welcome screen placeholder](https://placehold.co/1200x800/ccc/f5f5f5/png?text=Welcome+screen)

### B) Master password enabled

**Unlock** screen first. Enter the master password before anything else.

![Unlock screen placeholder](https://placehold.co/1200x800/ccc/f5f5f5/png?text=Unlock+screen)

> **Note:** Wrong passwords trigger a progressive cooldown after a few failures. That’s intentional.

## Steps — first connection (happy path)

1. From Welcome, choose **Add connection** (or the sidebar **+** later).  
2. Fill the form: name, provider, credentials, endpoint/region/bucket as needed.  
3. Save.  
4. Click the connection in the sidebar.  
5. Open a **bucket** (tree under the connection when multi-bucket).  
6. You should see objects / folders in the main list.

![Sidebar connection placeholder](https://placehold.co/1200x800/ccc/f5f5f5/png?text=Sidebar+connection+and+buckets)

## Steps — import instead

1. On Welcome, use **Import**.  
2. Pick an encrypted `.enc` backup (and passphrase if prompted).  
3. Review and confirm.  
4. Connections appear in the sidebar.

**Status: implemented**

## Verify

- Connection shows in the sidebar (emoji icon optional).  
- Bucket opens; file list or empty state appears.  
- Status bar shows item counts (e.g. `1 item` / `5 items`).

## Related

- [Connections](./03-connections.md)  
- [Security](./07-security-and-privacy.md)  
- [Browse](./04-browse-and-objects.md)  
