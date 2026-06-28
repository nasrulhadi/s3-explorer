import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import logo from "../../assets/server.png";

// ─── Window control icons (inline SVG) ──────────────────────

function IconMinimize() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12">
      <rect y="5" width="12" height="2" fill="currentColor" rx="0.5" />
    </svg>
  );
}

function IconMaximize() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12">
      <rect
        x="1" y="1" width="10" height="10" rx="1"
        fill="none" stroke="currentColor" strokeWidth="1.5"
      />
    </svg>
  );
}

function IconRestore() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12">
      <rect
        x="3" y="0.5" width="8.5" height="8.5" rx="1"
        fill="none" stroke="currentColor" strokeWidth="1.3"
      />
      <rect
        x="0.5" y="3" width="8.5" height="8.5" rx="1"
        fill="none" stroke="currentColor" strokeWidth="1.3"
      />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12">
      <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// ─── Component ──────────────────────────────────────────────

export default function TitleBar() {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    let destroyed = false;
    const win = getCurrentWindow();

    win.isMaximized()
      .then((val) => { if (!destroyed) setMaximized(val); })
      .catch(() => {});

    // Keep icon in sync when window is resized / maximized / restored
    let unlistenFn: (() => void) | null = null;
    win.onResized(() => {
      win.isMaximized()
        .then((val) => { if (!destroyed) setMaximized(val); })
        .catch(() => {});
    }).then((fn) => { unlistenFn = fn; });

    return () => {
      destroyed = true;
      unlistenFn?.();
    };
  }, []);

  return (
    <div className="flex items-center h-9 bg-[var(--s3-titlebar-bg)] select-none shrink-0 overflow-hidden relative z-10">
      {/* Drag region — fills remaining space */}
      <div
        data-tauri-drag-region
        onMouseDown={(e) => {
          if (e.button === 0) {
            getCurrentWindow().startDragging();
          }
        }}
        className="flex-1 self-stretch flex items-center gap-2 pl-4 cursor-grab"
      >
        <img src={logo} alt="" className="w-4 h-4 pointer-events-none select-none" draggable={false} />
        <span className="text-sm font-medium text-[var(--s3-titlebar-text)] opacity-100 pointer-events-none">
          S3 Explorer
        </span>
      </div>

      {/* Window controls */}
      <div className="flex h-9">
        <button
          onClick={() => getCurrentWindow().minimize()}
          className="w-12 h-9 flex items-center justify-center text-[var(--s3-titlebar-text)] opacity-50 hover:opacity-100 hover:bg-[var(--s3-titlebar-btn-hover)] transition-colors"
          title="Minimize"
        >
          <IconMinimize />
        </button>

        <button
          onClick={() => getCurrentWindow().toggleMaximize()}
          className="w-12 h-9 flex items-center justify-center text-[var(--s3-titlebar-text)] opacity-50 hover:opacity-100 hover:bg-[var(--s3-titlebar-btn-hover)] transition-colors"
          title={maximized ? "Restore" : "Maximize"}
        >
          {maximized ? <IconRestore /> : <IconMaximize />}
        </button>

        <button
          onClick={() => getCurrentWindow().close()}
          className="w-12 h-9 flex items-center justify-center text-[var(--s3-titlebar-text)] opacity-50 hover:opacity-100 hover:bg-[var(--s3-danger)] hover:text-white transition-colors"
          title="Close"
        >
          <IconClose />
        </button>
      </div>
    </div>
  );
}
