import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast, Toaster } from "sonner";
import TitleBar from "./components/layout/TitleBar";
import Sidebar from "./components/layout/Sidebar";
import Toolbar from "./components/layout/Toolbar";
import FileList from "./components/explorer/FileList";
import AddConnectionModal from "./components/modals/AddConnectionModal";
import TransferPanel from "./components/layout/TransferPanel";
import { useConnectionStore } from "./store/connectionStore";
import { useNavigationStore } from "./store/navigationStore";
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

  // Modal states
  const [showAddConnection, setShowAddConnection] = useState(false);

  // ── Callbacks ──────────────────────────────────────────────

  const handleRefresh = useCallback(() => {
    if (!connectionId || !bucket) return;
    queryClient.invalidateQueries({
      queryKey: ["s3", "objects", connectionId, bucket, prefix],
    });
    toast.info("Refreshing…");
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
      if (showAddConnection) {
        setShowAddConnection(false);
      }
    },
    onDelete: () => {
      toast.info("Delete", {
        description: "Delete selected items — coming soon.",
      });
    },
  });

  // ──────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-50">
      {/* ── Custom title bar ──────────────────────────────── */}
      <TitleBar />

      {/* ── Welcome screen (no connections at all) ───────── */}
      {!hasConnections ? (
        <WelcomeScreen onAddConnection={() => setShowAddConnection(true)} />
      ) : (
        <>
          {/* ── Main content row ─────────────────────────────── */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left panel */}
            <Sidebar onAddConnection={() => setShowAddConnection(true)} />

            {/* Right panel */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
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
              <main className="flex-1 overflow-hidden p-4">
                {!connectionId || !bucket ? (
                  <EmptyState />
                ) : (
                  <FileList filterQuery={filterQuery} />
                )}
              </main>
            </div>
          </div>
        </>
      )}

      {/* ── Modals ────────────────────────────────────────── */}
      {showAddConnection && (
        <AddConnectionModal onClose={() => setShowAddConnection(false)} />
      )}
    </div>
  );
}

// ─── Welcome screen (no connections) ───────────────────────

function WelcomeScreen({ onAddConnection }: { onAddConnection: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
      {/* Cloud icon */}
      <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
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

      <h2 className="text-2xl font-semibold text-gray-800">
        Welcome to S3 Explorer
      </h2>
      <p className="mt-2 text-sm text-gray-500 max-w-sm">
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

      <p className="mt-4 text-xs text-gray-400">
        You can also press the{" "}
        <kbd className="px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-[10px] font-mono">
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
    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 px-8">
      <svg
        className="mb-4"
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
      </svg>
      <p className="text-lg font-medium text-gray-500">No bucket selected</p>
      <p className="mt-1 text-sm">
        Choose a connection from the sidebar and pick a bucket to get started.
      </p>
      <div className="mt-4 text-xs text-gray-400 space-y-1">
        <span className="block">
          <kbd className="px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-[10px] font-mono">F5</kbd>{" "}
          Refresh
        </span>
        <span className="block">
          <kbd className="px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-[10px] font-mono">Backspace</kbd>{" "}
          Go back
        </span>
        <span className="block">
          <kbd className="px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-[10px] font-mono">Ctrl+U</kbd>{" "}
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
