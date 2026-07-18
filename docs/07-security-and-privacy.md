# Security and privacy

## Goal

Know how credentials are stored, how master password works, and what the app does **not** do with your data.

## Short version

- Your S3 keys live **on your machine**.  
- Optional **master password** encrypts the connection vault at rest.  
- Export backups are **encrypted**.  
- S3 traffic goes **from your app to your storage provider** (via Tauri native HTTP), not through a product backend.

**Status: implemented** for the behaviors below.

## Without master password

Connections can sit in **localStorage** via Zustand persist.  
That’s convenient, but plaintext-at-rest relative to the vault path.

> **Warning:** Anyone with OS access to your user profile may read stored data if the vault is off.

## Master password (local vault)

### What it does

- Encrypts stored connections (**PBKDF2 + AES-256-GCM**).  
- Shows **Unlock** on startup until you unlock.  
- **Lock** button in the sidebar (when vault is enabled) returns you to Unlock.  

![Unlock flow placeholder](https://placehold.co/1200x800/ccc/f5f5f5/png?text=Master+password+unlock)

### Enable / change / disable

Settings → **Security** → master password modal (enable / change / disable).

**Status: implemented**

### Idle auto-lock

After inactivity, the vault can lock itself (settings: off / 5 / 10 / 15 / 30 minutes style options).

**Status: implemented**

### Unlock rate limiting

Repeated wrong passwords → progressive cooldown (button disabled + countdown).  
Slows casual guessing; not a substitute for a strong password.

**Status: implemented**

### Export guard

If the vault is on, exporting connections may require the master password again.

**Status: implemented**

## Encrypted export / import

- Export uses AES-256-GCM with strong PBKDF2 (aligned with vault-strength iterations).  
- Import decrypts with the passphrase you set at export time.

> **Tip:** Store export files offline. Losing the passphrase means losing the backup.

**Status: implemented**

## What we don’t claim (verify yourself)

| Claim | Reality in this app |
|-------|---------------------|
| OS keychain for keys | **Not** the primary store; vault / localStorage instead |
| Server-side analytics product | No product telemetry backend described in core docs |
| Zero-knowledge cloud | N/A — there’s no hosted account cloud |

## Related

- [Settings](./08-settings.md)  
- [Connections export/import](./03-connections.md#export--import)  
- [FAQ](./11-faq.md)  
