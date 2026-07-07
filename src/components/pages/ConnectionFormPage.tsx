import { useState, useEffect, useCallback, type FormEvent } from "react";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Save, Smile } from "lucide-react";
import { ListBucketsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { createS3Client } from "../../lib/s3Client";
import { useConnectionStore } from "../../store/connectionStore";
import { useNavigationStore } from "../../store/navigationStore";
import EmojiPicker from "../modals/EmojiPicker";
import type { S3Provider, S3Connection, S3ConnectionFormData } from "../../types";

// ─── Constants ──────────────────────────────────────────────

const PROVIDERS: { value: S3Provider; label: string }[] = [
  { value: "aws", label: "AWS S3" },
  { value: "minio", label: "MinIO" },
  { value: "r2", label: "Cloudflare R2" },
  { value: "b2", label: "Backblaze B2" },
  { value: "custom", label: "Custom S3" },
];

const AWS_REGIONS = [
  "us-east-1", "us-east-2", "us-west-1", "us-west-2",
  "eu-west-1", "eu-west-2", "eu-west-3", "eu-central-1", "eu-north-1",
  "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ap-northeast-2",
  "ap-south-1", "sa-east-1", "ca-central-1", "me-south-1", "af-south-1",
];

interface FormErrors {
  name?: string;
  endpoint?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucket?: string;
}

type TestStatus = "idle" | "testing" | "success" | "error";

// ─── Input styling ──────────────────────────────────────────

const INPUT_CLASS =
  "w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-zinc-500 transition-all bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600";

// ─── Component ──────────────────────────────────────────────

interface ConnectionFormPageProps {
  /** Called when the user saves or cancels */
  onDone: () => void;
  /** If provided, the page opens in edit mode with pre-filled data */
  editConnection?: S3Connection;
}

export default function ConnectionFormPage({ onDone, editConnection }: ConnectionFormPageProps) {
  const addConnection = useConnectionStore((s) => s.addConnection);
  const updateConnection = useConnectionStore((s) => s.updateConnection);
  const isEditMode = !!editConnection;

  // ── Form state ─────────────────────────────────────────────
  const [name, setName] = useState(editConnection?.name ?? "");
  const [provider, setProvider] = useState<S3Provider>(editConnection?.provider ?? "aws");
  const [endpoint, setEndpoint] = useState(editConnection?.endpoint ?? "");
  const [region, setRegion] = useState(editConnection?.region ?? "us-east-1");
  const [accessKeyId, setAccessKeyId] = useState(editConnection?.accessKeyId ?? "");
  const [secretAccessKey, setSecretAccessKey] = useState(editConnection?.secretAccessKey ?? "");
  const [bucket, setBucket] = useState(editConnection?.defaultBucket ?? "");
  const [emoji, setEmoji] = useState<string | undefined>(editConnection?.emoji);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testMessage, setTestMessage] = useState("");

  const providerLocked = isEditMode;
  const showEndpoint = provider !== "aws";
  const showBucket = provider === "r2" || provider === "b2";

  // Reset endpoint when switching to AWS
  useEffect(() => {
    if (provider === "aws") setEndpoint("");
  }, [provider]);

  // Reset region to default when switching provider
  useEffect(() => {
    if (provider === "aws") setRegion("us-east-1");
    else if (provider === "b2") setRegion("us-west-004");
    else setRegion("auto");
  }, [provider]);

  // ── Validation ─────────────────────────────────────────────
  function validate(): boolean {
    const e: FormErrors = {};
    if (!name.trim()) e.name = "Connection name is required.";
    if (showEndpoint && !endpoint.trim()) e.endpoint = "Endpoint URL is required for this provider.";
    if (!region.trim()) e.region = "Region is required.";
    if (!accessKeyId.trim()) e.accessKeyId = "Access Key ID is required.";
    if (!secretAccessKey.trim()) e.secretAccessKey = "Secret Access Key is required.";
    if (showBucket && !bucket.trim()) e.bucket = "Bucket name is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Build a temporary S3Connection for testing ─────────────
  function buildTestConnection(): S3Connection {
    return {
      id: "__test__",
      name: name.trim(),
      provider,
      endpoint: showEndpoint ? endpoint.trim() : undefined,
      region: region.trim(),
      accessKeyId: accessKeyId.trim(),
      secretAccessKey: secretAccessKey.trim(),
      createdAt: Date.now(),
    };
  }

  // ── Test Connection ────────────────────────────────────────
  async function testConnection() {
    if (!validate()) return;

    setTestStatus("testing");
    setTestMessage("");

    try {
      const client = createS3Client(buildTestConnection());

      if (provider === "r2" || provider === "b2") {
        if (bucket.trim()) {
          try {
            const res = await client.send(
              new ListObjectsV2Command({ Bucket: bucket.trim(), MaxKeys: 1 }),
            );
            const count = res.KeyCount ?? 0;
            setTestStatus("success");
            setTestMessage(
              `Connected! Bucket "${bucket.trim()}" is accessible${count > 0 ? ` (${count}+ objects)` : " (empty)"}.`,
            );
          } catch (err) {
            const msg = (err as Error).message;
            if (msg.includes("AccessDenied") || msg.includes("Access Denied")) {
              setTestStatus("error");
              setTestMessage(`Access denied to bucket "${bucket.trim()}". Check your API token permissions.`);
            } else if (msg.includes("NoSuchBucket")) {
              setTestStatus("error");
              setTestMessage(`Bucket "${bucket.trim()}" does not exist.`);
            } else {
              setTestStatus("error");
              setTestMessage(msg);
            }
          }
        } else {
          try {
            const res = await client.send(new ListBucketsCommand({}));
            const count = res.Buckets?.length ?? 0;
            setTestStatus("success");
            setTestMessage(`Connected! Found ${count} bucket${count !== 1 ? "s" : ""}.`);
          } catch (err) {
            const msg = (err as Error).message;
            if (msg.includes("AccessDenied") || msg.includes("Access Denied") || msg.includes("NotEntitled") || msg.includes("not entitled")) {
              setTestStatus("success");
              setTestMessage("Connection OK! Bucket listing not supported — enter bucket name in the sidebar.");
            } else {
              throw err;
            }
          }
        }
        return;
      }

      const res = await client.send(new ListBucketsCommand({}));
      const count = res.Buckets?.length ?? 0;
      setTestStatus("success");
      setTestMessage(`Connected! Found ${count} bucket${count !== 1 ? "s" : ""}.`);
    } catch (err) {
      setTestStatus("error");
      setTestMessage((err as Error).message);
    }
  }

  // ── Save ───────────────────────────────────────────────────
  const handleSave = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      const data: S3ConnectionFormData = {
        name: name.trim(),
        provider,
        endpoint: showEndpoint ? endpoint.trim() : undefined,
        region: region.trim(),
        accessKeyId: accessKeyId.trim(),
        secretAccessKey: secretAccessKey.trim(),
        defaultBucket: showBucket ? bucket.trim() : undefined,
        emoji: emoji?.trim() || undefined,
      };

      if (!isEditMode) {
        const newId = addConnection(data);
        if (showBucket && bucket.trim()) {
          useConnectionStore.getState().setActiveConnection(newId);
          useNavigationStore.getState().setBucket(newId, bucket.trim());
        }

      } else {
        updateConnection(editConnection!.id, data);

      }

      onDone();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [name, provider, endpoint, region, accessKeyId, secretAccessKey, showEndpoint, showBucket, bucket, emoji, isEditMode, addConnection, updateConnection, onDone],
  );

  // ──────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ── Page header ──────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 h-14 border-b border-gray-200 dark:border-zinc-700 bg-[var(--s3-window-bg)] shrink-0">
        <button
          onClick={onDone}
          className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
          {isEditMode ? "Edit Connection" : "New Connection"}
        </h2>
      </div>

      {/* ── Scrollable form ─────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-[var(--s3-window-bg)]">
        <form onSubmit={handleSave} className="max-w-xl mx-auto p-8 space-y-5">
          {/* Icon + Connection Name */}
          <Field label="Connection Name" error={errors.name}>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEmojiPickerOpen(true)}
                title="Choose icon"
                className="
                  shrink-0 w-10 h-10 flex items-center justify-center rounded-lg
                  border border-gray-300 dark:border-zinc-600
                  bg-white dark:bg-zinc-800
                  text-gray-500 dark:text-gray-400
                  hover:bg-gray-50 dark:hover:bg-gray-700
                  transition-colors cursor-pointer text-lg
                "
              >
                {emoji || <Smile size={20} />}
              </button>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. AWS Production"
                className={INPUT_CLASS}
              />
            </div>
          </Field>

          {/* Provider */}
          <Field label="Provider">
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as S3Provider)}
              disabled={providerLocked}
              className={`${INPUT_CLASS} ${providerLocked ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>

          {/* Endpoint URL */}
          {showEndpoint && (
            <Field label="Endpoint URL" error={errors.endpoint}>
              <input
                type="url"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder={endpointPlaceholder(provider)}
                className={INPUT_CLASS}
              />
            </Field>
          )}

          {/* Region */}
          <Field label="Region" error={errors.region}>
            {provider === "aws" ? (
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className={INPUT_CLASS}
              >
                {AWS_REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder={regionPlaceholder(provider)}
                className={INPUT_CLASS}
              />
            )}
          </Field>

          {/* Access Key ID */}
          <Field label={provider === "b2" ? "Key ID" : "Access Key ID"} error={errors.accessKeyId}>
            <input
              type="text"
              value={accessKeyId}
              onChange={(e) => setAccessKeyId(e.target.value)}
              placeholder={provider === "b2" ? "0058…" : "AKIA…"}
              autoComplete="off"
              className={INPUT_CLASS}
            />
          </Field>

          {/* Secret Access Key */}
          <Field label={provider === "b2" ? "Application Key" : "Secret Access Key"} error={errors.secretAccessKey}>
            <input
              type="text"
              value={secretAccessKey}
              onChange={(e) => setSecretAccessKey(e.target.value)}
              placeholder="e.g. wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
              autoComplete="off"
              className={INPUT_CLASS}
            />
          </Field>

          {/* Bucket Name (R2/B2) */}
          {showBucket && (
            <Field label="Bucket Name" error={errors.bucket}>
              <input
                type="text"
                value={bucket}
                onChange={(e) => setBucket(e.target.value)}
                placeholder="my-bucket"
                className={INPUT_CLASS}
              />
            </Field>
          )}

          {/* ── Test Connection result ──────────────────── */}
          {testStatus !== "idle" && (
            <div
              className={`
                flex items-start gap-2 px-4 py-3 rounded-lg text-sm
                ${testStatus === "testing" ? "bg-[var(--s3-accent-base)] text-[var(--s3-accent-text)]" : ""}
                ${testStatus === "success" ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300" : ""}
                ${testStatus === "error" ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300" : ""}
              `}
            >
              {testStatus === "testing" && (
                <Loader2 size={16} className="shrink-0 mt-0.5 animate-spin" />
              )}
              {testStatus === "success" && (
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              )}
              {testStatus === "error" && (
                <XCircle size={16} className="shrink-0 mt-0.5" />
              )}
              <span className="break-all">{testMessage || "Testing…"}</span>
            </div>
          )}

          {/* ── Actions ─────────────────────────────────── */}
          <div className="flex items-center gap-3 pt-8">
            <button
              type="button"
              onClick={testConnection}
              disabled={testStatus === "testing"}
              className="
                flex-1 px-4 py-2.5 text-sm font-medium rounded-lg
                border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-200
                hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {testStatus === "testing" ? "Testing…" : "Test Connection"}
            </button>
            <button
              type="submit"
              className="
                flex-1 inline-flex items-center justify-center gap-2
                px-4 py-2.5 text-sm font-medium rounded-lg
                bg-[var(--s3-accent-active)] text-white
                hover:bg-[var(--s3-accent-hover)] transition-colors
              "
            >
              <Save size={15} />
              {isEditMode ? "Save Changes" : "Save Connection"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Emoji picker modal ── */}
      <EmojiPicker
        open={emojiPickerOpen}
        selected={emoji}
        onSelect={setEmoji}
        onClear={() => setEmoji(undefined)}
        onClose={() => setEmojiPickerOpen(false)}
      />
    </div>
  );
}

// ─── Sub-component: labelled field ──────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────

function endpointPlaceholder(provider: S3Provider): string {
  switch (provider) {
    case "minio": return "http://localhost:9000";
    case "r2": return "https://{accountId}.r2.cloudflarestorage.com";
    case "b2": return "https://s3.{region}.backblazeb2.com (auto-filled if empty)";
    case "custom": return "https://s3.example.com";
    default: return "";
  }
}

function regionPlaceholder(provider: S3Provider): string {
  switch (provider) {
    case "b2": return "us-west-004";
    case "r2": return "auto";
    default: return "us-east-1";
  }
}
