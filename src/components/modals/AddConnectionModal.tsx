import { useState, useEffect, useCallback, type FormEvent } from "react";
import { X, Eye, EyeOff, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { ListBucketsCommand } from "@aws-sdk/client-s3";
import { toast } from "sonner";
import { createS3Client } from "../../lib/s3Client";
import { useConnectionStore } from "../../store/connectionStore";
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
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "eu-central-1",
  "eu-north-1",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "ap-northeast-2",
  "ap-south-1",
  "sa-east-1",
  "ca-central-1",
  "me-south-1",
  "af-south-1",
];

interface FormErrors {
  name?: string;
  endpoint?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

type TestStatus = "idle" | "testing" | "success" | "error";

// ─── Component ──────────────────────────────────────────────

interface AddConnectionModalProps {
  onClose: () => void;
}

export default function AddConnectionModal({ onClose }: AddConnectionModalProps) {
  const addConnection = useConnectionStore((s) => s.addConnection);

  // ── Form state ─────────────────────────────────────────────
  const [name, setName] = useState("");
  const [provider, setProvider] = useState<S3Provider>("aws");
  const [endpoint, setEndpoint] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [showSecret, setShowSecret] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testMessage, setTestMessage] = useState("");

  // ── Show/hide endpoint based on provider ───────────────────
  const showEndpoint = provider !== "aws";

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

  // ── Escape key closes modal ────────────────────────────────
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // ── Validation ─────────────────────────────────────────────
  function validate(): boolean {
    const e: FormErrors = {};

    if (!name.trim()) e.name = "Connection name is required.";
    if (showEndpoint && !endpoint.trim())
      e.endpoint = "Endpoint URL is required for this provider.";
    if (!region.trim()) e.region = "Region is required.";
    if (!accessKeyId.trim()) e.accessKeyId = "Access Key ID is required.";
    if (!secretAccessKey.trim())
      e.secretAccessKey = "Secret Access Key is required.";

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
      };

      addConnection(data);
      toast.success(`Connection "${data.name}" saved.`);
      onClose();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [name, provider, endpoint, region, accessKeyId, secretAccessKey, showEndpoint, addConnection, onClose],
  );

  // ──────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* ── Header ──────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Add S3 Connection
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Form ────────────────────────────────────────── */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Connection Name */}
          <Field label="Connection Name" error={errors.name}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. AWS Production"
              className={INPUT_CLASS}
            />
          </Field>

          {/* Provider */}
          <Field label="Provider">
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as S3Provider)}
              className={INPUT_CLASS}
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>

          {/* Endpoint URL (conditional) */}
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
          <Field label="Access Key ID" error={errors.accessKeyId}>
            <input
              type="text"
              value={accessKeyId}
              onChange={(e) => setAccessKeyId(e.target.value)}
              placeholder="AKIA…"
              autoComplete="off"
              className={INPUT_CLASS}
            />
          </Field>

          {/* Secret Access Key */}
          <Field label="Secret Access Key" error={errors.secretAccessKey}>
            <div className="relative">
              <input
                type={showSecret ? "text" : "password"}
                value={secretAccessKey}
                onChange={(e) => setSecretAccessKey(e.target.value)}
                placeholder="••••••••••••••••"
                autoComplete="off"
                className={`${INPUT_CLASS} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowSecret((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>

          {/* ── Test Connection result ──────────────────── */}
          {testStatus !== "idle" && (
            <div
              className={`
                flex items-start gap-2 px-3 py-2.5 rounded-lg text-sm
                ${testStatus === "testing" ? "bg-blue-50 text-blue-700" : ""}
                ${testStatus === "success" ? "bg-green-50 text-green-700" : ""}
                ${testStatus === "error" ? "bg-red-50 text-red-700" : ""}
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
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={testConnection}
              disabled={testStatus === "testing"}
              className="
                flex-1 px-4 py-2.5 text-sm font-medium rounded-lg
                border border-gray-300 text-gray-700
                hover:bg-gray-50 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {testStatus === "testing" ? "Testing…" : "Test Connection"}
            </button>
            <button
              type="submit"
              className="
                flex-1 px-4 py-2.5 text-sm font-medium rounded-lg
                bg-blue-500 text-white
                hover:bg-blue-600 transition-colors
              "
            >
              Save Connection
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Shared styling ─────────────────────────────────────────

const INPUT_CLASS =
  "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all bg-white text-gray-800 placeholder-gray-400";

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
      <label className="block text-sm font-medium text-gray-700 mb-1">
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
    case "minio":
      return "http://localhost:9000";
    case "r2":
      return "https://{accountId}.r2.cloudflarestorage.com";
    case "b2":
      return "https://s3.{region}.backblazeb2.com (auto-filled if empty)";
    case "custom":
      return "https://s3.example.com";
    default:
      return "";
  }
}

function regionPlaceholder(provider: S3Provider): string {
  switch (provider) {
    case "b2":
      return "us-west-004";
    case "r2":
      return "auto";
    default:
      return "us-east-1";
  }
}
