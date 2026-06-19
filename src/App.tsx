import { useCallback, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast, Toaster } from "sonner";
import TitleBar from "./components/layout/TitleBar";
import Sidebar from "./components/layout/Sidebar";
import Toolbar from "./components/layout/Toolbar";
import FileList from "./components/explorer/FileList";
import ConnectionFormPage from "./components/ConnectionFormPage";
import SettingsPage from "./components/SettingsPage";
import TransferPanel from "./components/layout/TransferPanel";
import { useConnectionStore } from "./store/connectionStore";
import { useNavigationStore } from "./store/navigationStore";
import { useSettingsStore } from "./store/settingsStore";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import "./App.css";

// ─── Inner layout (must be inside QueryClientProvider) ──────

function AppLayout() {
  const queryClient = useQueryClient();

  // Connection state (for welcome screen)
  const hasConnections = useConnectionStore((s) => s.connections.length > 0);

  // Navigation state
  const connectionId = useNavigationStore((s) => s.connectionId);
  const bucket = useNavigationStore((s) => s.bucket);
  const prefix = useNavigationStore((s) => s.prefix);
  const history = useNavigationStore((s) => s.history);
  const goBack = useNavigationStore((s) => s.goBack);
  const setPrefix = useNavigationStore((s) => s.setPrefix);

  // Search / filter state (shared between Toolbar and FileList)
  const [filterQuery, setFilterQuery] = useState("");

  // View state: replaces separate modal booleans
  type View = "main" | "addConnection" | "editConnection" | "settings";
  const [view, setView] = useState<View>("main");
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null);

  // Store actions for delete
  const removeConnection = useConnectionStore((s) => s.removeConnection);
  const setActiveConnection = useConnectionStore((s) => s.setActiveConnection);
  const connections = useConnectionStore((s) => s.connections);

  // ── Startup: check settings for session restore ────────────
  const restoreLastSession = useSettingsStore((s) => s.restoreLastSession);
  const goHome = useNavigationStore((s) => s.goHome);
  useEffect(() => {
    if (!restoreLastSession) {
      goHome();
      setActiveConnection(null);
    }
  // Run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Theme: apply dark/light class to document ──────────────
  const theme = useSettingsStore((s) => s.theme);
  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      // system: follow OS preference
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => {
        root.classList.toggle("dark", e.matches);
      };
      root.classList.toggle("dark", mq.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  // ── Callbacks ──────────────────────────────────────────────

  const handleRefresh = useCallback(() => {
    if (!connectionId || !bucket) return;
    queryClient.invalidateQueries({
      queryKey: ["s3", "objects", connectionId, bucket, prefix],
    });
  }, [queryClient, connectionId, bucket, prefix]);

  const handleNavigate = useCallback(
    (targetPrefix: string) => {
      if (targetPrefix === "") {
        setPrefix("");
      } else {
        setPrefix(targetPrefix);
      }
    },
    [setPrefix],
  );

  const handleSearchChange = useCallback((query: string) => {
    setFilterQuery(query);
  }, []);

  const handleUpload = useCallback(() => {
    toast.info("Upload", {
      description: "Upload dialog coming soon — drag & drop files onto the main area.",
    });
  }, []);

  const handleNewFolder = useCallback(() => {
    toast.info("New Folder", {
      description: "Create folder dialog coming soon.",
    });
  }, []);

  // ── Keyboard shortcuts ─────────────────────────────────────

  useKeyboardShortcuts({
    onRefresh: handleRefresh,
    onBack: () => {
      if (history.length > 0) goBack();
    },
    onUpload: handleUpload,
    onClose: () => {
      if (view !== "main") {
        setView("main");
        setEditingConnectionId(null);
      }
    },
    onDelete: () => {
      toast.info("Delete", {
        description: "Delete selected items — coming soon.",
      });
    },
  });

  // ── Edit / Delete connection handlers ───────────────────────

  const handleEditConnection = useCallback((id: string) => {
    setEditingConnectionId(id);
    setView("editConnection");
  }, []);

  const handleDeleteConnection = useCallback((id: string) => {
    const conn = connections.find((c) => c.id === id);
    if (!conn) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${conn.name}"?\n\nThis action cannot be undone.`,
    );
    if (!confirmed) return;

    removeConnection(id);
    toast.success(`Connection "${conn.name}" deleted.`);

    // If we deleted the active connection, reset navigation
    if (connectionId === id) {
      useNavigationStore.getState().goHome();
    }
  }, [connections, removeConnection, connectionId]);

  // Handlers to open the connection form page
  const openAddConnection = useCallback(() => {
    setEditingConnectionId(null);
    setView("addConnection");
  }, []);

  const closeConnectionForm = useCallback(() => {
    setView("main");
    setEditingConnectionId(null);
  }, []);

  // Find the connection being edited
  const editingConnection = editingConnectionId
    ? connections.find((c) => c.id === editingConnectionId) ?? undefined
    : undefined;

  // ──────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-50 dark:bg-gray-950" onContextMenu={(e) => e.preventDefault()}>
      {/* ── Custom title bar ──────────────────────────────── */}
      <TitleBar />

      {/* ── Welcome screen (no connections at all) ───────── */}
      {!hasConnections && view === "main" ? (
        <WelcomeScreen onAddConnection={openAddConnection} />
      ) : (
        <>
          {/* ── Main content row ─────────────────────────────── */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left panel */}
            <Sidebar
              onAddConnection={openAddConnection}
              onEditConnection={handleEditConnection}
              onDeleteConnection={handleDeleteConnection}
              onOpenSettings={() => setView("settings")}
            />

            {/* Right panel */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              {view === "addConnection" || view === "editConnection" ? (
                <ConnectionFormPage
                  onDone={closeConnectionForm}
                  editConnection={editingConnection ?? undefined}
                />
              ) : view === "settings" ? (
                <SettingsPage onDone={() => setView("main")} />
              ) : (
                <>
                  <Toolbar
                    connectionId={connectionId}
                    bucket={bucket}
                    prefix={prefix}
                    history={history}
                    onBack={goBack}
                    onNavigate={handleNavigate}
                    onRefresh={handleRefresh}
                    onUpload={handleUpload}
                    onNewFolder={handleNewFolder}
                    onSearchChange={handleSearchChange}
                  />

                  {/* Content area */}
                  <main className="flex-1 overflow-hidden p-4" onContextMenu={(e) => e.preventDefault()}>
                    {!connectionId || !bucket ? (
                      <EmptyState />
                    ) : (
                      <FileList filterQuery={filterQuery} />
                    )}
                  </main>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Welcome screen (no connections) ───────────────────────

function WelcomeScreen({ onAddConnection }: { onAddConnection: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
      {/* Cloud icon */}
      <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-6">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-blue-500"
        >
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
        </svg>
      </div>

      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
        Welcome to S3 Explorer
      </h2>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        Connect to your S3-compatible storage to browse, upload, and manage
        your files. Supports AWS S3, MinIO, Cloudflare R2, Backblaze B2, and
        more.
      </p>

      <button
        onClick={onAddConnection}
        className="
          mt-8 inline-flex items-center gap-2 px-5 py-2.5
          text-sm font-medium text-white bg-blue-500 rounded-lg
          hover:bg-blue-600 active:bg-blue-700
          transition-colors shadow-sm
        "
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add Your First Connection
      </button>

      <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
        You can also press the{" "}
        <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-[10px] font-mono">
          +
        </kbd>{" "}
        button in the sidebar at any time.
      </p>
    </div>
  );
}

/** Shown when connections exist but no bucket is selected */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 dark:text-gray-500 px-8">
      <svg
        className="mb-4"
        width="56"
        height="56"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
      </svg>
      <p className="text-lg font-medium text-gray-500 dark:text-gray-400">Select a bucket to browse</p>
      <p className="mt-1 text-sm text-gray-400 dark:text-gray-500 max-w-xs">
        Click a connection in the sidebar, then select a bucket to view and manage your files.
      </p>
      <div className="mt-6 text-xs text-gray-400 dark:text-gray-500 space-y-1">
        <span className="block">
          <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-[10px] font-mono">F5</kbd>{" "}
          Refresh
        </span>
        <span className="block">
          <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-[10px] font-mono">Backspace</kbd>{" "}
          Go back
        </span>
        <span className="block">
          <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-[10px] font-mono">Ctrl+U</kbd>{" "}
          Upload
        </span>
      </div>
    </div>
  );
}

// ─── Public App component ────────────────────────────────────

export default function App() {
  return (
    <>
      <AppLayout />
      <TransferPanel />
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        theme="light"
      />
    </>
  );
}
