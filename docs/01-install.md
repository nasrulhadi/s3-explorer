# Install

## Goal

Get S3 Explorer running on your machine (or build it yourself).

## Prerequisites

- A desktop OS: **Windows**, **macOS**, or **Linux**
- For **releases**: nothing fancy — download the installer from GitHub Releases
- For **from source**:
  - Node.js + pnpm  
  - Rust toolchain  
  - Platform deps for [Tauri](https://v2.tauri.app/start/prerequisites/)

## Option A — Install from release (recommended)

### Steps

1. Open the project’s **GitHub Releases** page (same repo as this app).  
2. Download the artifact for your OS (e.g. Windows `.msi` / `.exe`, macOS `.dmg`, Linux package as published).  
3. Run the installer / open the package like any other desktop app.  
4. Launch **S3 Explorer**.

![Releases download placeholder](https://placehold.co/1200x800/ccc/f5f5f5/png?text=GitHub+Releases+download)

### Verify

- The app window opens (custom title bar, sidebar + main area).  
- You see the **Welcome** screen if no connections exist yet, or the explorer if you already have data.

**Status: implemented** (exact file names follow each release)

## Option B — Run / build from source

### Steps

1. Clone the repo and `cd` into it.  
2. Install JS deps:

   ```bash
   pnpm install
   ```

3. Dev mode:

   ```bash
   pnpm tauri dev
   ```

4. Production build:

   ```bash
   pnpm tauri build
   ```

5. Grab the built installer/binary from the Tauri output folder for your platform.

![Dev terminal placeholder](https://placehold.co/1200x800/ccc/f5f5f5/png?text=pnpm+tauri+dev)

### Verify

- Dev: hot reload UI, S3 calls work against a real endpoint.  
- Build: package installs and starts cleanly.

**Status: implemented**

## Auto-update

After install, the app can **check for updates** (startup + periodic). Settings → About has **Check for Updates**.  
When an update is ready, you’ll get an install / relaunch style modal.

**Status: implemented** (needs a published update channel / `update.json` config for full end-to-end)

## Related

- [First run](./02-first-run.md)  
- [Troubleshooting](./10-troubleshooting.md)  
