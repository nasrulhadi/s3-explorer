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
        className="w-1/2 min-w-[26.5rem] max-w-[40rem] h-auto mb-8 opacity-90 dark:opacity-80 pointer-events-none"
      />

      {/* ── Caption ── */}
      <p className="text-base text-gray-500 leading-relaxed max-w-md">
        Choose a connection from the sidebar to start exploring your buckets.
      </p>

      {/* ── Shortcut hints (glass pills) ── */}
      <div className="mt-8 flex items-center gap-2 flex-wrap justify-center">
        {SHORTCUTS.map(({ key, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 rounded-lg border border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-md px-3 py-1.5 shadow-sm"
          >
            <kbd className="px-1.5 py-0.5 rounded bg-white/60 dark:bg-white/10 text-gray-700 dark:text-gray-200 text-[10px] font-mono leading-none">
              {key}
            </kbd>
            <span className="text-xs text-gray-700 dark:text-gray-300">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
