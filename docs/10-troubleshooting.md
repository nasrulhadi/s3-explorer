# Troubleshooting

## Goal

Unstick the common failure modes without guessing.

## Prerequisites

- Know which **provider** and **endpoint** you’re using  
- Optional: DevTools console when running from source  

---

## Can’t create a folder (custom S3)

**Symptoms:** Upload works; “New folder” fails.

**Why it used to happen:** Some APIs return **411 MissingContentLength** if the PUT for the empty folder marker has no `Content-Length`. Browser `Headers` APIs strip that header; the app uses a Tauri HTTP path that can pass it through.

**What to try:**

1. Update to a build that includes the Content-Length fix (v1.11.0+).  
2. Confirm the key ends with `/` in network logs.  
3. Retry with HTTPS endpoint if you’re on plain HTTP.

**Status: implemented** fix in current mainline

---

## Connection works in AWS CLI but not here

**Checklist:**

1. Endpoint URL exact (no trailing junk).  
2. Region string the provider expects (`auto` vs real region).  
3. Path-style vs virtual-hosted — Custom/MinIO usually force path-style in app.  
4. Access key allowed for `ListBuckets` / `ListObjects` / `PutObject`.  

---

## R2 / B2 bucket list looks empty or odd

Those providers often **don’t support ListBuckets** the AWS way. The app may use a **default bucket** field instead of a full multi-bucket tree.

**Status: partial** (by provider design)

---

## Upload shows no progress / can’t cancel

On older builds, upload was a single `PutObject` with no progress events.  
Current builds use **lib-storage** multipart + cancel.

**What to try:** Update the app; cancel from the Transfer panel on **upload** rows.

**Status: implemented** in v1.11.0+

---

## Unlock screen cooldown

You failed the master password a few times. Wait for the timer; don’t spam attempts.

**Status: implemented**

---

## WebView / drag-and-drop feels weird

HTML5 DnD is flaky in Tauri WebView2. In-app move uses a **custom mouse** implementation. Prefer that over expecting full browser DnD.

**Status: implemented** workaround

---

## Auto-update never appears

Needs a configured update feed / signing keys for production. Local builds may not see public updates.

**Status: partial** depending on release pipeline

---

## Related

- [FAQ](./11-faq.md)  
- [Security](./07-security-and-privacy.md)  
- [Transfers](./05-transfers.md)  
