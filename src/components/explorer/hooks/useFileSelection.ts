import { useState, useCallback } from "react";
import type { S3Item } from "../../../types";

/**
 * File list selection + keyboard navigation hook.
 *
 * Keeps selection state, focus index, and keyboard handler local
 * so FileList.tsx stays lean.
 */
export function useFileSelection(
  displayedItems: S3Item[],
  openItem: (item: S3Item) => void,
) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [focusIndex, setFocusIndex] = useState<number>(-1);

  const toggleSelect = useCallback((item: S3Item) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(item.key)) next.delete(item.key);
      else next.add(item.key);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedKeys(new Set());
    setFocusIndex(-1);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (displayedItems.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusIndex((i) => Math.min(i + 1, displayedItems.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (focusIndex >= 0 && focusIndex < displayedItems.length) {
            openItem(displayedItems[focusIndex]);
          }
          break;
      }
    },
    [displayedItems, focusIndex, openItem],
  );

  return {
    selectedKeys,
    focusIndex,
    toggleSelect,
    clearSelection,
    handleKeyDown,
    setSelectedKeys,
    setFocusIndex,
  };
}
