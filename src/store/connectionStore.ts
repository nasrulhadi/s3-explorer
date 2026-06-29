import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { S3Connection, S3ConnectionFormData } from "../types";
import { hasSecureVault, updateSecureVault } from "../lib/secureVault";

// Generate a simple unique ID (crypto.randomUUID is available in modern browsers & Node 19+)
function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface ConnectionState {
  /** Daftar semua koneksi S3 yang tersimpan */
  connections: S3Connection[];
  /** ID koneksi yang sedang aktif dipilih user */
  activeConnectionId: string | null;
}

interface ConnectionActions {
  /** Tambah koneksi baru dari form data, return ID yang dibuat */
  addConnection: (data: S3ConnectionFormData) => string;
  /** Update koneksi existing (partial update) */
  updateConnection: (id: string, data: Partial<S3ConnectionFormData>) => void;
  /** Hapus koneksi berdasarkan ID */
  removeConnection: (id: string) => void;
  /** Set koneksi aktif; pass null untuk deselect */
  setActiveConnection: (id: string | null) => void;
  /** Replace store state after decrypting secure vault */
  replaceConnections: (connections: S3Connection[], activeConnectionId: string | null) => void;
  /** Clear all in-memory and persisted connection state */
  clearConnections: () => void;
  /** Import connections — merge by ID, skip duplicates, return summary */
  importConnections: (imported: S3Connection[]) => {
    added: number;
    updated: number;
    skipped: number;
  };
}

export type ConnectionStore = ConnectionState & ConnectionActions;

function syncSecureVault(state: ConnectionState) {
  void updateSecureVault({
    connections: state.connections,
    activeConnectionId: state.activeConnectionId,
  }).catch((error) => {
    console.error("Failed to update secure connection vault", error);
  });
}

export const useConnectionStore = create<ConnectionStore>()(
  persist(
    (set, get) => ({
      // ── State ──────────────────────────────────────────────
      connections: [],
      activeConnectionId: null,

      // ── Actions ────────────────────────────────────────────

      addConnection: (data) => {
        const id = generateId();
        const newConnection: S3Connection = {
          ...data,
          id,
          createdAt: Date.now(),
        };

        set((state) => ({
          connections: [...state.connections, newConnection],
        }));
        syncSecureVault(get());

        return id;
      },

      updateConnection: (id, data) => {
        set((state) => ({
          connections: state.connections.map((conn) =>
            conn.id === id ? { ...conn, ...data } : conn,
          ),
        }));
        syncSecureVault(get());
      },

      removeConnection: (id) => {
        set((state) => ({
          connections: state.connections.filter((conn) => conn.id !== id),
          // If the removed connection was active, deselect it
          activeConnectionId:
            state.activeConnectionId === id ? null : state.activeConnectionId,
        }));
        syncSecureVault(get());
      },

      setActiveConnection: (id) => {
        // Validate that the ID exists (or is null) before setting
        if (id === null || get().connections.some((c) => c.id === id)) {
          set({ activeConnectionId: id });
          syncSecureVault(get());
        }
      },

      replaceConnections: (connections, activeConnectionId) => {
        set({ connections, activeConnectionId });
      },

      clearConnections: () => {
        set({ connections: [], activeConnectionId: null });
        syncSecureVault(get());
      },

      importConnections: (imported) => {
        const state = get();
        let added = 0;
        let updated = 0;
        let skipped = 0;

        const merged = [...state.connections];

        for (const imp of imported) {
          // Check if same ID exists → update
          const existingById = merged.find((c) => c.id === imp.id);
          if (existingById) {
            Object.assign(existingById, imp);
            updated++;
            continue;
          }

          // Check for duplicate by name + provider + endpoint
          const duplicate = merged.find(
            (c) =>
              c.name === imp.name &&
              c.provider === imp.provider &&
              (c.endpoint ?? "") === (imp.endpoint ?? "")
          );
          if (duplicate) {
            skipped++;
            continue;
          }

          // New connection
          merged.push(imp);
          added++;
        }

        set({ connections: merged });
        syncSecureVault(get());
        return { added, updated, skipped };
      },
    }),
    {
      name: "s3-explorer-connections",
      // Only persist connections list and active ID; not the actions
      partialize: (state) => (
        hasSecureVault()
          ? { connections: [], activeConnectionId: null }
          : {
              connections: state.connections,
              activeConnectionId: state.activeConnectionId,
            }
      ),
      merge: (persisted, current) => {
        if (hasSecureVault()) return current;
        return { ...current, ...(persisted as Partial<ConnectionState>) };
      },
    },
  ),
);
