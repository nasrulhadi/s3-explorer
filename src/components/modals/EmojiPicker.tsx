import { useState, useMemo, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { EMOJI_CATEGORIES, ALL_EMOJIS } from "../../lib/emojis";

interface EmojiPickerProps {
  open: boolean;
  selected?: string;
  onSelect: (emoji: string) => void;
  onClear?: () => void;
  onClose: () => void;
}

export default function EmojiPicker({
  open,
  selected,
  onSelect,
  onClear,
  onClose,
}: EmojiPickerProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Search across all emojis; show flat grid when searching
  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return ALL_EMOJIS.filter((e) => e.includes(q) || nameMatch(e, q));
  }, [query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm mx-4 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header / Search ── */}
        <div className="p-3 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
            <Search size={14} className="shrink-0 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search emoji…"
              className="flex-1 min-w-0 bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600 outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="shrink-0 p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* ── Body: scrollable emoji grid ── */}
        <div className="max-h-64 overflow-y-auto p-2">
          {searchResults ? (
            // Search mode: flat grid
            searchResults.length > 0 ? (
              <div className="grid grid-cols-9 gap-0.5">
                {searchResults.map((emoji, i) => (
                  <EmojiButton
                    key={`${emoji}-${i}`}
                    emoji={emoji}
                    isSelected={selected === emoji}
                    onClick={() => onSelect(emoji)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-8">
                No emoji found
              </p>
            )
          ) : (
            // Browse mode: grouped by category
            <div className="space-y-2">
              {EMOJI_CATEGORIES.map((cat) => (
                <div key={cat.id}>
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                    {cat.label}
                  </p>
                  <div className="grid grid-cols-9 gap-0.5">
                    {cat.emojis.map((emoji, i) => (
                      <EmojiButton
                        key={`${cat.id}-${emoji}-${i}`}
                        emoji={emoji}
                        isSelected={selected === emoji}
                        onClick={() => onSelect(emoji)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
          {onClear ? (
            <button
              onClick={onClear}
              className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            >
              Reset
            </button>
          ) : <span />}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="
                px-4 py-2 text-sm font-medium rounded-lg
                border border-gray-300 dark:border-gray-600
                text-gray-700 dark:text-gray-200
                hover:bg-gray-50 dark:hover:bg-gray-700
                transition-colors
              "
            >
              Cancel
            </button>
            <button
              onClick={() => { if (selected) { onSelect(selected); } onClose(); }}
              disabled={!selected}
              className="
                px-4 py-2 text-sm font-medium rounded-lg
                bg-[var(--s3-accent-active)] text-white
                hover:bg-[var(--s3-accent-hover)]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              "
            >
              Select
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmojiButton({
  emoji,
  isSelected,
  onClick,
}: {
  emoji: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-7 h-7 flex items-center justify-center rounded-md text-base transition-colors
        ${isSelected
          ? "bg-[var(--s3-accent-base)] ring-1 ring-[var(--s3-accent-active)]"
          : "hover:bg-gray-100 dark:hover:bg-gray-700"
        }
      `}
    >
      {emoji}
    </button>
  );
}

/** Naive name matching — emoji-to-keyword map for common ones */
const EMOJI_NAMES: Record<string, string[]> = {
  "📁": ["folder"], "📂": ["folder", "open"], "🗄️": ["database", "storage", "cabinet"],
  "💾": ["save", "disk"], "📦": ["box", "package"], "☁️": ["cloud"],
  "🔒": ["lock", "secure"], "🔓": ["unlock"], "🔑": ["key"],
  "🚀": ["rocket", "launch", "deploy"], "⭐": ["star", "favorite"],
  "🔥": ["fire", "hot"], "⚡": ["bolt", "fast", "power"], "✅": ["check", "done", "ok"],
  "❌": ["cross", "no", "error"], "🟢": ["green", "online"], "🔴": ["red", "offline", "stop"],
  "🟡": ["yellow", "warning"], "🔵": ["blue"], "🟠": ["orange"],
};
function nameMatch(emoji: string, q: string): boolean {
  const names = EMOJI_NAMES[emoji];
  return names ? names.some((n) => n.includes(q)) : false;
}
