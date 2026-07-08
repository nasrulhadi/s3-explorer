import { useCallback, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Toaster } from "sonner";
import TitleBar from "./components/layout/TitleBar";
import Sidebar from "./components/layout/Sidebar";
import Toolbar from "./components/layout/Toolbar";
import FileList from "./components/explorer/FileList";
import EmptyState from "./components/explorer/EmptyState";
import WelcomeScreen from "./components/explorer/WelcomeScreen";
import UnlockScreen from "./components/explorer/UnlockScreen";
import ConnectionFormPage from "./components/pages/ConnectionFormPage";
import DeleteConnectionPage from "./components/pages/DeleteConnectionPage";
import SettingsPage from "./components/pages/SettingsPage";
import TransferPanel from "./components/layout/TransferPanel";
import UpdateModal from "./components/modals/UpdateModal";
import { useConnectionStore } from "./store/connectionStore";
import { useNavigationStore } from "./store/navigationStore";
import { useSettingsStore } from "./store/settingsStore";
import { useSecurityStore } from "./store/securityStore";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useUpdateChecker } from "./hooks/useUpdateChecker";
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
  const replaceConnections = useConnectionStore((s) => s.replaceConnections);
  const clearConnections = useConnectionStore((s) => s.clearConnections);
  const connections = useConnectionStore((s) => s.connections);

  // Security state
  const isMasterPasswordEnabled = useSecurityStore((s) => s.isMasterPasswordEnabled);
  const isUnlocked = useSecurityStore((s) => s.isUnlocked);
  const unlock = useSecurityStore((s) => s.unlock);
  const resetMasterPasswordAndConnections = useSecurityStore((s) => s.resetMasterPasswordAndConnections);
  const isLocked = isMasterPasswordEnabled && !isUnlocked;

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
    if (isLocked || !connectionId || !bucket) return;
    queryClient.invalidateQueries({
      queryKey: ["s3", "objects", connectionId, bucket, prefix],
    });
  }, [queryClient, isLocked, connectionId, bucket, prefix]);

  const handleNavigate = useCallback(
    (targetPrefix: string) => {
      if (isLocked) return;
      if (targetPrefix === "") {
        setPrefix("");
      } else {
        setPrefix(targetPrefix);
      }
    },
    [isLocked, setPrefix],
  );

  const handleSearchChange = useCallback((query: string) => {
    setFilterQuery(query);
  }, []);

  const handleUpload = useCallback(() => {
    if (isLocked) return;
    setUploadOpen(true);
  }, [isLocked]);

  const handleNewFolder = useCallback(() => {
    if (isLocked) return;
    setNewFolderOpen(true);
  }, [isLocked]);

  const handleDisconnect = useCallback(() => {
    if (isLocked) return;
    goHome();
    setActiveConnection(null);
  }, [isLocked, goHome, setActiveConnection]);

  // ── Update checker ────────────────────────────────────────
  useUpdateChecker();

  // ── Keyboard shortcuts ─────────────────────────────────────

  useKeyboardShortcuts({
    onRefresh: handleRefresh,
    onBack: () => {
      if (!isLocked && history.length > 0) goBack();
    },
    onUpload: handleUpload,
    onClose: () => {
      if (isLocked) return;
      if (view !== "main") {
        setView("main");
        setEditingConnectionId(null);
      }
    },
    onDelete: () => {
      if (isLocked) return;
      // Delete coming soon
    },
  });

  // ── Edit / Delete connection handlers ───────────────────────

  const handleEditConnection = useCallback((id: string) => {
    if (isLocked) return;
    setEditingConnectionId(id);
    setView("editConnection");
  }, [isLocked]);

  const handleDeleteConnection = useCallback((id: string) => {
    if (isLocked) return;
    setEditingConnectionId(id);
    setView("deleteConnection");
  }, [isLocked]);

  // Handlers to open the connection form page
  const openAddConnection = useCallback(() => {
    if (isLocked) return;
    setEditingConnectionId(null);
    setView("addConnection");
  }, [isLocked]);

  const closeConnectionForm = useCallback(() => {
    setView("main");
    setEditingConnectionId(null);
  }, []);

  const handleUnlock = useCallback(async (password: string) => {
    const vault = await unlock(password);
    replaceConnections(vault.connections, vault.activeConnectionId);
  }, [unlock, replaceConnections]);

  const handleResetLockedConnections = useCallback(() => {
    resetMasterPasswordAndConnections();
    clearConnections();
    useNavigationStore.getState().goHome();
    queryClient.clear();
    setView("main");
    setEditingConnectionId(null);
  }, [resetMasterPasswordAndConnections, clearConnections, queryClient]);

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

      {isLocked ? (
        <UnlockScreen
          onUnlock={handleUnlock}
          onResetConnections={handleResetLockedConnections}
        />
      ) : !hasConnections && view === "main" ? (
        <WelcomeScreen onAddConnection={openAddConnection} />
      ) : (
      /* ── Main content row ─────────────────────────────── */
      <div className="flex flex-1 overflow-hidden bg-[var(--s3-sidebar-bg)]">
        {/* Left panel — always visible */}
        <Sidebar
          onAddConnection={openAddConnection}
          onEditConnection={handleEditConnection}
          onDeleteConnection={handleDeleteConnection}
          onOpenSettings={() => setView("settings")}
          onSelectConnection={() => setView("main")}
        />

        {/* Right panel */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[var(--s3-sidebar-bg)] rounded-tl-xl">
          {view === "addConnection" || view === "editConnection" ? (
            <ConnectionFormPage
              key={editingConnectionId ?? "add"}
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
                  <main className="flex-1 overflow-hidden bg-[var(--s3-window-bg)]" onContextMenu={(e) => e.preventDefault()}>
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
      )}
    </div>
  );
}

// ─── Welcome screen moved to src/components/explorer/WelcomeScreen.tsx ──

/** Shown when connections exist but no bucket is selected */
// EmptyState moved to src/components/explorer/EmptyState.tsx

// ─── Public App component ────────────────────────────────────

export default function App() {
  return (
    <>
      <AppLayout />
      <TransferPanel />
      <UpdateModal />
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        theme="light"
      />
    </>
  );
}
