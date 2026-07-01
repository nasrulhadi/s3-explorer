import emptyStateImg from "../../assets/emptyState.webp";

const SHORTCUTS = [
  { key: "F5", label: "Refresh" },
  { key: "←", label: "Go back" },
  { key: "Ctrl+U", label: "Upload" },
];

/** Shown when connections exist but no bucket is selected */
export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 select-none">
      {/* ── Hero image ── */}
      <img
        src={emptyStateImg}
        alt=""
        draggable={false}
        className="w-96 h-auto mb-8 opacity-90 dark:opacity-80 pointer-events-none"
      />

      {/* ── Headline ── */}
      <h2 className="text-lg font-medium text-gray-600 dark:text-gray-300">
        Select a bucket to browse
      </h2>
      <p className="mt-1.5 text-sm text-gray-400 dark:text-gray-500 max-w-xs leading-relaxed">
        Choose a connection from the sidebar, then pick a bucket to start managing your files.
      </p>

      {/* ── Shortcut hints (pill badges) ── */}
      <div className="mt-8 flex items-center gap-2 flex-wrap justify-center">
        {SHORTCUTS.map(({ key, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-[var(--s3-statusbar-bg)] px-3 py-1.5"
          >
            <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-mono leading-none">
              {key}
            </kbd>
            <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
