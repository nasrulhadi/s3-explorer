import { X, ExternalLink } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useT } from "../../i18n";

const GITHUB_CHANGELOG = "https://github.com/nasrulhadi/s3-explorer/blob/main/CHANGELOG.md";

interface ChangelogModalProps {
  open: boolean;
  onClose: () => void;
}

interface ChangelogSection {
  version: string;
  date: string;
  content: string;
}

/** Parse the first (latest) version block from CHANGELOG.md */
function parseLatest(raw: string): ChangelogSection | null {
  // Skip preamble before first version header
  const firstHeader = raw.indexOf("\n## [");
  if (firstHeader === -1) return null;

  const fromHeader = raw.slice(firstHeader + 1); // skip leading \n
  const blocks = fromHeader.split(/\n(?=## \[)/); // split at version headers
  const block = blocks[0];

  const headerMatch = /^## \[([^\]]+)\]\s*-\s*(.+)/.exec(block);
  if (!headerMatch) return null;

  return {
    version: headerMatch[1],
    date: headerMatch[2].trim(),
    content: block.slice(headerMatch[0].length).trim(),
  };
}

type Segment = { type: "text" | "code"; text: string };

/** Lightweight markdown → structured items with inline code support */
function renderItems(content: string) {
  return content
    .split("\n")
    .filter((line) => !line.startsWith("---") && line.trim() !== "")
    .map((line) => {
      if (line.startsWith("### ")) {
        return { type: "heading" as const, text: line.slice(4).replace(/\*\*/g, "") };
      }
      const trimmed = line.replace(/^[\s*-]+/, "").trim();
      if (!trimmed) return null;

      // Split by backtick: plain text + inline code segments
      const segments: Segment[] = [];
      const parts = trimmed.split(/(`[^`]+`)/g);
      for (const part of parts) {
        if (part.startsWith("`") && part.endsWith("`")) {
          segments.push({ type: "code", text: part.slice(1, -1) });
        } else {
          const cleaned = part.replace(/\*\*/g, "").trim();
          if (cleaned) segments.push({ type: "text", text: cleaned });
        }
      }
      return { type: "item" as const, segments };
    })
    .filter(Boolean);
}

/** Render segments with inline code badges */
function ItemText({ segments }: { segments: Segment[] }) {
  return (
    <span className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
      {segments.map((seg, i) =>
        seg.type === "code" ? (
          <code key={i} className="inline-block px-1 py-px rounded-md text-[11px] font-mono bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-zinc-200">
            {seg.text}
          </code>
        ) : (
          <span key={i}>{i > 0 ? " " : ""}{seg.text}</span>
        ),
      )}
    </span>
  );
}

export default function ChangelogModal({ open, onClose }: ChangelogModalProps) {
  const t = useT();

  if (!open) return null;

  const section = parseLatest(__CHANGELOG__);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="
          w-full max-w-lg max-h-[75vh] flex flex-col
          bg-white dark:bg-zinc-800
          border border-gray-200 dark:border-zinc-700
          rounded-2xl shadow-2xl
          mx-4
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-baseline gap-2">
            <h2 className="text-sm font-semibold text-[var(--s3-window-text)]">
              {t.changelog.title}
            </h2>
            {section && (
              <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-[var(--s3-accent-base)] text-[var(--s3-accent-text)]">
                v{section.version}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--s3-window-text)] hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-track]:bg-transparent">
          {section ? (
            <>
              <p className="text-[11px] text-gray-400">{section.date}</p>

              {renderItems(section.content).map((item, i) => {
                if (!item) return null;
                if (item.type === "heading") {
                  return (
                    <p
                      key={i}
                      className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide pt-1 first:pt-0"
                    >
                      {item.text}
                    </p>
                  );
                }
                return (
                  <div key={i} className="flex items-start gap-2 pl-2">
                    <span className="text-gray-300 dark:text-gray-600 mt-1.5 w-1 h-1 rounded-full bg-current shrink-0" />
                    <ItemText segments={item.segments} />
                  </div>
                );
              })}
            </>
          ) : (
            <p className="text-xs text-gray-400 italic">Not available.</p>
          )}
        </div>

        {/* Footer — View full changelog */}
        <div className="px-5 py-3 border-t border-gray-200 dark:border-zinc-700">
          <button
            onClick={() => openUrl(GITHUB_CHANGELOG)}
            className="flex items-center gap-1.5 text-xs text-[var(--s3-accent-active)] hover:underline cursor-pointer font-medium"
          >
            <span>{t.changelog.viewFull}</span>
            <ExternalLink size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}
