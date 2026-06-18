import { useEffect } from "react";

// ─── Helpers ────────────────────────────────────────────────

/** Returns true when the active element is a text input / textarea / contenteditable */
function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    target.isContentEditable ||
    target.closest('[role="textbox"]') !== null
  );
}

// ─── Types ──────────────────────────────────────────────────

interface KeyboardShortcutHandlers {
  /** F5 or Ctrl+R */
  onRefresh: () => void;
  /** Backspace (when not in an input) */
  onBack: () => void;
  /** Ctrl+U */
  onUpload: () => void;
  /** Escape */
  onClose: () => void;
  /** Delete key */
  onDelete?: () => void;
}

// ─── Hook ───────────────────────────────────────────────────

/**
 * Global keyboard shortcuts for the S3 Explorer app.
 *
 * Shortcuts are ignored when the user is typing in an input field,
 * textarea, or any contenteditable element.
 *
 * | Key             | Action                |
 * | --------------- | --------------------- |
 * | `F5`            | Refresh current view  |
 * | `Ctrl+R`        | Refresh current view  |
 * | `Backspace`     | Navigate back         |
 * | `Ctrl+U`        | Open upload dialog    |
 * | `Delete`        | Delete selected items |
 * | `Escape`        | Close modal / deselect|
 */
export function useKeyboardShortcuts({
  onRefresh,
  onBack,
  onUpload,
  onClose,
  onDelete,
}: KeyboardShortcutHandlers) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const editable = isEditable(e.target);

      // ── F5: Refresh ────────────────────────────────────
      if (e.key === "F5") {
        e.preventDefault();
        onRefresh();
        return;
      }

      // ── Ctrl+R: Refresh ────────────────────────────────
      if ((e.ctrlKey || e.metaKey) && e.key === "r") {
        e.preventDefault();
        onRefresh();
        return;
      }

      // ── Ctrl+U: Upload ─────────────────────────────────
      if ((e.ctrlKey || e.metaKey) && e.key === "u") {
        e.preventDefault();
        onUpload();
        return;
      }

      // Skip remaining shortcuts if user is typing in a text field
      if (editable) return;

      // ── Backspace: Go Back ─────────────────────────────
      if (e.key === "Backspace") {
        e.preventDefault();
        onBack();
        return;
      }

      // ── Delete: Delete selected ────────────────────────
      if (e.key === "Delete" && onDelete) {
        e.preventDefault();
        onDelete();
        return;
      }

      // ── Escape: Close modal / deselect ─────────────────
      if (e.key === "Escape") {
        onClose();
        return;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onRefresh, onBack, onUpload, onClose, onDelete]);
}
