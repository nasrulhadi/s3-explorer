import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { S3Connection, S3ConnectionFormData } from "../types";

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
}

export type ConnectionStore = ConnectionState & ConnectionActions;

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

        return id;
      },

      updateConnection: (id, data) => {
        set((state) => ({
          connections: state.connections.map((conn) =>
            conn.id === id ? { ...conn, ...data } : conn,
          ),
        }));
      },

      removeConnection: (id) => {
        set((state) => ({
          connections: state.connections.filter((conn) => conn.id !== id),
          // If the removed connection was active, deselect it
          activeConnectionId:
            state.activeConnectionId === id ? null : state.activeConnectionId,
        }));
      },

      setActiveConnection: (id) => {
        // Validate that the ID exists (or is null) before setting
        if (id === null || get().connections.some((c) => c.id === id)) {
          set({ activeConnectionId: id });
        }
      },
    }),
    {
      name: "s3-explorer-connections",
      // Only persist connections list and active ID; not the actions
      partialize: (state) => ({
        connections: state.connections,
        activeConnectionId: state.activeConnectionId,
      }),
    },
  ),
);
