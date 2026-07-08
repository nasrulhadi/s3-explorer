import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, FolderUp, X, FileIcon, AlertCircle } from "lucide-react";
import { useTransferStore } from "../../store/transferStore";
import type { S3Connection } from "../../types";
import { createS3Client } from "../../lib/s3Client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { useT } from "../../i18n";

// ─── Constants ──────────────────────────────────────────────

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200 MB

// ─── Pending file entry ─────────────────────────────────────

interface PendingFile {
  file: File;
  relativePath: string;
  size: number;
}

// ─── Props ──────────────────────────────────────────────────

interface UploadModalProps {
  open: boolean;
  connectionId: string | null;
  bucket: string | null;
  prefix: string;
  getConnection: (id: string) => S3Connection | undefined;
  onClose: () => void;
  onUploadComplete: () => void;
  dropFiles?: PendingFile[];
}

// ─── Component ──────────────────────────────────────────────

export default function UploadModal({
  open,
  connectionId,
  bucket,
  prefix,
  getConnection,
  onClose,
  onUploadComplete,
  dropFiles,
}: UploadModalProps) {
  const t = useT();

  type Stage = "choice" | "review";
  const [stage, setStage] = useState<Stage>("choice");

  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [rejectedFiles, setRejectedFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStage("choice");
    setPendingFiles([]);
    setRejectedFiles([]);
    setUploading(false);
  }, []);

  useEffect(() => {
    if (open && dropFiles && dropFiles.length > 0) {
      const accepted: PendingFile[] = [];
      const rejected: string[] = [];
      for (const f of dropFiles) {
        if (f.size > MAX_FILE_SIZE) {
          rejected.push(`${f.relativePath} ${t.modals.upload.exceedsLimit}`);
        } else {
          accepted.push(f);
        }
      }
      setPendingFiles(accepted);
      setRejectedFiles(rejected);
      setStage("review");
    }
  }, [open, dropFiles, t]);

  const addFiles = useCallback((fileList: FileList, isFolder: boolean) => {
    const accepted: PendingFile[] = [];
    const rejected: string[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];

      if (file.size > MAX_FILE_SIZE) {
        rejected.push(`${file.name} ${t.modals.upload.exceedsLimit}`);
        continue;
      }

      accepted.push({
        file,
        relativePath: isFolder
          ? file.webkitRelativePath || file.name
          : file.name,
        size: file.size,
      });
    }

    if (accepted.length > 0) {
      setPendingFiles((prev) => [...prev, ...accepted]);
      setStage("review");
    }
    setRejectedFiles((prev) => [...prev, ...rejected]);
  }, [t]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) addFiles(e.target.files, false);
      e.target.value = "";
    },
    [addFiles],
  );

  const handleFolderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) addFiles(e.target.files, true);
      e.target.value = "";
    },
    [addFiles],
  );

  const removeFile = useCallback((index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = useCallback(async () => {
    if (!connectionId || !bucket || pendingFiles.length === 0 || uploading)
      return;

    setUploading(true);

    const filesToUpload = [...pendingFiles];
    onClose();
    reset();

    const transferStore = useTransferStore.getState();

    for (let i = 0; i < filesToUpload.length; i++) {
      const pf = filesToUpload[i];
      const key = `${prefix}${pf.relativePath}`;

      const id = `upload-${Date.now()}-${i}`;
      transferStore.addTransfer({
        id,
        type: "upload",
        fileName: pf.relativePath,
        totalBytes: pf.size,
        transferredBytes: 0,
        status: "active",
        key,
        bucket,
        connectionId,
      });

      try {
        const conn = getConnection(connectionId);
        if (!conn) continue;
        const client = createS3Client(conn);
        const fileBuffer = await pf.file.arrayBuffer();
        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: new Uint8Array(fileBuffer),
            ContentType: pf.file.type || "application/octet-stream",
          }),
        );
        transferStore.updateTransfer(id, {
          status: "done",
          transferredBytes: pf.size,
        });
      } catch (err) {
        transferStore.updateTransfer(id, {
          status: "error",
          error: (err as Error).message,
        });
      }
    }

    onUploadComplete();
  }, [
    connectionId,
    bucket,
    prefix,
    pendingFiles,
    uploading,
    getConnection,
    onUploadComplete,
    onClose,
    reset,
  ]);

  const fmtSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!open) return null;

  const uploadCount = pendingFiles.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-4 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          type="file"
          ref={folderInputRef}
          // @ts-expect-error webkitdirectory is a non-standard attribute
          webkitdirectory=""
          onChange={handleFolderChange}
          className="hidden"
        />

        {stage === "choice" ? (
          <>
            <div className="px-5 pt-5 pb-5">
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                {t.modals.upload.title.replace("PATH", `/${bucket}/${prefix}`)}
              </h3>
            </div>

            <div className="px-5 pb-6 flex gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex flex-col items-center gap-2 px-4 py-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-zinc-600 hover:border-[var(--s3-accent-active)] hover:bg-[var(--s3-accent-base)] transition-all cursor-pointer"
              >
                <Upload size={28} className="text-[var(--s3-accent-text)]" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {t.modals.upload.uploadFile}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {t.modals.upload.browseFiles}
                </span>
              </button>
              <button
                onClick={() => folderInputRef.current?.click()}
                className="flex-1 flex flex-col items-center gap-2 px-4 py-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-zinc-600 hover:border-[var(--s3-accent-active)] hover:bg-[var(--s3-accent-base)] transition-all cursor-pointer"
              >
                <FolderUp size={28} className="text-[var(--s3-accent-text)]" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {t.modals.upload.uploadFolder}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {t.modals.upload.browseFolders}
                </span>
              </button>
            </div>

            <div className="mx-5 mb-3 px-4 py-6 rounded-lg bg-gray-100 dark:bg-zinc-700/50 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t.modals.upload.selectFilesNotice}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {t.modals.upload.maxSize}
              </p>
            </div>

            {rejectedFiles.length > 0 && (
              <div className="px-5 pb-3">
                {rejectedFiles.map((msg, i) => (
                  <p
                    key={i}
                    className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1"
                  >
                    <AlertCircle size={12} /> {msg}
                  </p>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end px-5 pb-6 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
              >
                {t.modals.upload.cancel}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="px-5 pt-5 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                  {t.modals.upload.reviewTitle}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t.modals.upload.selectedFiles.replace("ITEMS", String(uploadCount))} ·{" "}
                  {fmtSize(pendingFiles.reduce((s, f) => s + f.size, 0))}
                </p>
              </div>
              {!uploading && (
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  className="text-xs text-[var(--s3-accent-text)] hover:underline"
                >
                  {t.modals.upload.addMore}
                </button>
              )}
            </div>

            <div className="px-5 pb-6 max-h-64 overflow-y-auto space-y-1">
              {pendingFiles.map((pf, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-zinc-700/50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileIcon size={14} className="text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-200 truncate">
                      {pf.relativePath}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {fmtSize(pf.size)}
                    </span>
                    {!uploading && (
                      <button
                        onClick={() => removeFile(i)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {rejectedFiles.length > 0 && (
              <div className="px-5 pb-3">
                {rejectedFiles.map((msg, i) => (
                  <p
                    key={i}
                    className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1"
                  >
                    <AlertCircle size={12} /> {msg}
                  </p>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 px-5 pb-6">
              <button
                onClick={onClose}
                disabled={uploading}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
              >
                {t.modals.upload.cancel}
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--s3-accent-active)] text-white hover:bg-[var(--s3-accent-hover)] disabled:opacity-50 transition-colors"
              >
                {uploading
                  ? `${t.modals.upload.uploading} ${uploadCount} file${uploadCount > 1 ? "s" : ""}…`
                  : `${t.modals.upload.upload} ${uploadCount} file${uploadCount > 1 ? "s" : ""}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
