import { useCallback, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { Circle } from "lucide-react";
import TitleBar from "./components/layout/TitleBar";
import Sidebar from "./components/layout/Sidebar";
import Toolbar from "./components/layout/Toolbar";
import FileList from "./components/explorer/FileList";
import EmptyState from "./components/explorer/EmptyState";
import ConnectionFormPage from "./components/pages/ConnectionFormPage";
import DeleteConnectionPage from "./components/pages/DeleteConnectionPage";
import SettingsPage from "./components/pages/SettingsPage";
import TransferPanel from "./components/layout/TransferPanel";
import { useConnectionStore } from "./store/connectionStore";
import { useNavigationStore } from "./store/navigationStore";
import { useSettingsStore } from "./store/settingsStore";
import { useConnectivity } from "./hooks/useConnectivity";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { getAccentColor } from "./lib/accentColors";
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
  const [uploadOpen, setUploadOpen] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);

  // View state: replaces separate modal booleans
  type View = "main" | "addConnection" | "editConnection" | "deleteConnection" | "settings";
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

  // ── Accent Color: apply CSS variables ──────────────────────
  const accentColorId = useSettingsStore((s) => s.accentColor);
  useEffect(() => {
    const root = document.documentElement;
    const color = getAccentColor(accentColorId);
    const isDark = root.classList.contains("dark");
    const mode = isDark ? "dark" : "light";

    root.style.setProperty("--s3-accent-base", color[mode].base);
    root.style.setProperty("--s3-accent-hover", color[mode].hover);
    root.style.setProperty("--s3-accent-active", color[mode].active);
    root.style.setProperty("--s3-accent-text", color[mode].text);
  }, [accentColorId, theme]);

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
    setUploadOpen(true);
  }, []);

  const handleNewFolder = useCallback(() => {
    setNewFolderOpen(true);
  }, []);

  const handleDisconnect = useCallback(() => {
    goHome();
    setActiveConnection(null);
  }, [goHome, setActiveConnection]);

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
      // Delete coming soon
    },
  });

  // ── Edit / Delete connection handlers ───────────────────────

  const handleEditConnection = useCallback((id: string) => {
    setEditingConnectionId(id);
    setView("editConnection");
  }, []);

  const handleDeleteConnection = useCallback((id: string) => {
    setEditingConnectionId(id);
    setView("deleteConnection");
  }, []);

  // Handlers to open the connection form page
  const openAddConnection = useCallback(() => {
    setEditingConnectionId(null);
    setView("addConnection");
  }, []);

  const closeConnectionForm = useCallback(() => {
    setView("main");
    setEditingConnectionId(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!editingConnectionId) return;
    const conn = connections.find((c) => c.id === editingConnectionId);
    if (!conn) return;

    removeConnection(editingConnectionId);

    // If we deleted the active connection, reset navigation
    if (connectionId === editingConnectionId) {
      useNavigationStore.getState().goHome();
      setActiveConnection(null);
    }

    setView("main");
    setEditingConnectionId(null);
  }, [editingConnectionId, connections, removeConnection, connectionId, setActiveConnection]);

  // Find the connection being edited
  const editingConnection = editingConnectionId
    ? connections.find((c) => c.id === editingConnectionId) ?? undefined
    : undefined;

  // ──────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--s3-window-bg)]" onContextMenu={(e) => e.preventDefault()}>
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
            <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[var(--s3-sidebar-bg)]">
              {view === "addConnection" || view === "editConnection" ? (
                <ConnectionFormPage
                  onDone={closeConnectionForm}
                  editConnection={editingConnection ?? undefined}
                />
              ) : view === "deleteConnection" && editingConnection ? (
                <DeleteConnectionPage
                  connection={editingConnection}
                  onConfirm={handleConfirmDelete}
                  onCancel={closeConnectionForm}
                />
              ) : view === "settings" ? (
                <SettingsPage onDone={() => setView("main")} />
              ) : (
                <>
                  {connectionId && bucket && (
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
                      onDisconnect={handleDisconnect}
                    />
                  )}

                  {/* Content area */}
                  <main className="flex-1 overflow-hidden bg-[var(--s3-window-bg)] rounded-tl-xl" onContextMenu={(e) => e.preventDefault()}>
                    {!connectionId || !bucket ? (
                      <EmptyState />
                    ) : (
                      <FileList
                        filterQuery={filterQuery}
                        uploadOpen={uploadOpen}
                        newFolderOpen={newFolderOpen}
                        onUploadOpen={() => setUploadOpen(true)}
                        onUploadClose={() => setUploadOpen(false)}
                        onNewFolderOpen={() => setNewFolderOpen(true)}
                        onNewFolderClose={() => setNewFolderOpen(false)}
                      />
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
  const isOnline = useConnectivity();

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
      {/* Cloud icon */}
      <div className="w-20 h-20 rounded-2xl bg-[var(--s3-accent-base)] flex items-center justify-center mb-6">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[var(--s3-accent-text)]"
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
          text-sm font-medium text-white bg-[var(--s3-accent-active)] rounded-lg
          hover:bg-[var(--s3-accent-hover)] active:bg-[var(--s3-accent-hover)]
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

      {/* Connectivity indicator */}
      <div className="mt-8 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
        <Circle
          size={8}
          className={isOnline ? "text-green-500" : "text-red-500"}
          fill="currentColor"
        />
        <span>{isOnline ? "Online" : "Offline"}</span>
      </div>
    </div>
  );
}

/** Shown when connections exist but no bucket is selected */
// EmptyState moved to src/components/explorer/EmptyState.tsx

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
