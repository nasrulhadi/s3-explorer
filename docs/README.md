# S3 Explorer Docs

English product docs for the **S3 Explorer** desktop app (this repo).

Read these in order if you’re new. Jump around if you already know object storage.

## How to read this

| Doc | What’s inside |
|-----|----------------|
| [00 – Overview](./00-overview.md) | What the app is, who it’s for, architecture, license |
| [01 – Install](./01-install.md) | Windows / macOS / Linux install + build from source |
| [02 – First run](./02-first-run.md) | Welcome screen, first connection, first unlock |
| [03 – Connections](./03-connections.md) | Add / edit / delete providers, emoji icons, export/import |
| [04 – Browse and objects](./04-browse-and-objects.md) | Sidebar, file list, select, context menu, info, URLs |
| [05 – Transfers](./05-transfers.md) | Upload, download, progress, cancel, ZIP limits |
| [06 – Folders and prefixes](./06-folders-and-prefixes.md) | “Folders” on S3, create, rename, move, delete |
| [07 – Security and privacy](./07-security-and-privacy.md) | Master password, vault, idle lock, unlock cooldown |
| [08 – Settings](./08-settings.md) | Theme, language, accent, toolbar, security, updates |
| [09 – Keyboard shortcuts](./09-keyboard-shortcuts.md) | Built-in shortcuts (read-only list for now) |
| [10 – Troubleshooting](./10-troubleshooting.md) | Common “why is this broken?” cases |
| [11 – FAQ](./11-faq.md) | Short answers |
| [REFERENCE](./REFERENCE.md) | Glossary, providers matrix, limits, paths |

Screenshots in these docs use placeholders (`placehold.co`) for now. Real images can replace them later under `docs/images/`.

## Status labels

When something isn’t rock-solid in code, you’ll see:

- **Status: implemented** — works in the app today  
- **Status: partial** — works with limits or provider quirks  
- **Status: planned** — mentioned as roadmap / not done  
- **Status: unknown — needs product owner** — unclear from code alone  

## Source of truth

These docs follow **this repository** (UI labels, stores, hooks, CHANGELOG, README).  
They are not marketing copy. If the app and a doc disagree, trust the app and file a docs fix.

## Related

- App README: [`../README.md`](../README.md)  
- Changelog: [`../CHANGELOG.md`](../CHANGELOG.md)  
