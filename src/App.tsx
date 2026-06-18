import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Toaster } from "sonner";
import Sidebar from "./components/layout/Sidebar";
import Toolbar from "./components/layout/Toolbar";
import FileList from "./components/explorer/FileList";
import AddConnectionModal from "./components/modals/AddConnectionModal";
import { useNavigationStore } from "./store/navigationStore";
import "./App.css";

// ─── Inner layout (must be inside QueryClientProvider) ──────

function AppLayout() {
  const queryClient = useQueryClient();

  // Navigation state
  const connectionId = useNavigationStore((s) => s.connectionId);
  const bucket = useNavigationStore((s) => s.bucket);
  const prefix = useNavigationStore((s) => s.prefix);
  const history = useNavigationStore((s) => s.history);
  const goBack = useNavigationStore((s) => s.goBack);
  const setPrefix = useNavigationStore((s) => s.setPrefix);

  // Search / filter state (shared between Toolbar and FileList)
  const [filterQuery, setFilterQuery] = useState("");

  // Add Connection modal state
  const [showAddConnection, setShowAddConnection] = useState(false);

  // Refresh: invalidate current folder query
  const handleRefresh = useCallback(() => {
    if (!connectionId || !bucket) return;
    queryClient.invalidateQueries({
      queryKey: ["s3", "objects", connectionId, bucket, prefix],
    });
  }, [queryClient, connectionId, bucket, prefix]);

  // Breadcrumb navigation: clicking a segment or Home
  const handleNavigate = useCallback(
    (targetPrefix: string) => {
      if (targetPrefix === "") {
        // Go back to bucket root (not goHome which resets everything)
        setPrefix("");
      } else {
        setPrefix(targetPrefix);
      }
    },
    [setPrefix],
  );

  // Search filter
  const handleSearchChange = useCallback((query: string) => {
    setFilterQuery(query);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      {/* ── Left panel ──────────────────────────────────── */}
      <Sidebar onAddConnection={() => setShowAddConnection(true)} />

      {/* ── Right panel ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Toolbar
          connectionId={connectionId}
          bucket={bucket}
          prefix={prefix}
          history={history}
          onBack={goBack}
          onNavigate={handleNavigate}
          onRefresh={handleRefresh}
          onUpload={() => console.debug("Upload modal TBD")}
          onNewFolder={() => console.debug("NewFolder modal TBD")}
          onSearchChange={handleSearchChange}
        />

        {/* ── Content area ─────────────────────────────── */}
        <main className="flex-1 overflow-hidden p-4">
          {!connectionId || !bucket ? (
            <EmptyState />
          ) : (
            <FileList filterQuery={filterQuery} />
          )}
        </main>
      </div>

      {/* ── Modals ────────────────────────────────────────── */}
      {showAddConnection && (
        <AddConnectionModal onClose={() => setShowAddConnection(false)} />
      )}
    </div>
  );
}

/** Shown when no connection/bucket is selected */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
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
    </div>
  );
}

// ─── Public App component ────────────────────────────────────

export default function App() {
  return (
    <>
      <AppLayout />
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        theme="light"
      />
    </>
  );
}
