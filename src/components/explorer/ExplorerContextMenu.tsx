import { useMemo } from "react";
import * as ContextMenu from "@radix-ui/react-context-menu";
import {
  Copy,
  ClipboardPaste,
  Upload,
  FolderPlus,
  RefreshCw,
  Pencil,
  Trash2,
  Download,
  Link,
  Info,
  Archive,
} from "lucide-react";
import { MENU_CONTENT, MENU_ITEM, MENU_SEPARATOR, MENU_SHORTCUT } from "../../lib/menuStyles";
import type { S3Item } from "../../types";

interface ExplorerContextMenuProps {
  /** Items displayed in the current folder */
  displayedItems: S3Item[];
  /** Currently selected item keys */
  selectedKeys: Set<string>;
  /** Current context menu target (which item was right-clicked, or empty area) */
  contextTarget: { type: "item" | "empty"; item?: S3Item };
  /** Number of items in the clipboard */
  clipboardCount: number;

  // ── Handlers ──
  onCopy: () => void;
  onPaste: () => void;
  onUpload: () => void;
  onNewFolder: () => void;
  onRefresh: () => void;
  onRename: (item: S3Item) => void;
  onDelete: (item: S3Item) => void;
  onBulkDelete: (items: S3Item[]) => void;
  onDownloadItem: (item: S3Item) => void;
  onDownloadZip: (items: S3Item[]) => void;
  onGetUrl: (item: S3Item) => void;
  onGetInfo: (item: S3Item) => void;
}

export default function ExplorerContextMenu({
  displayedItems,
  selectedKeys,
  contextTarget,
  clipboardCount,
  onCopy,
  onPaste,
  onUpload,
  onNewFolder,
  onRefresh,
  onRename,
  onDelete,
  onBulkDelete,
  onDownloadItem,
  onDownloadZip,
  onGetUrl,
  onGetInfo,
}: ExplorerContextMenuProps) {
  const menuItems = useMemo(() => {
    let items: S3Item[];
    if (contextTarget.type === "item" && contextTarget.item) {
      if (selectedKeys.has(contextTarget.item.key)) {
        items = displayedItems.filter((i) => selectedKeys.has(i.key));
      } else {
        items = [contextTarget.item];
      }
    } else {
      items = displayedItems.filter((i) => selectedKeys.has(i.key));
    }

    const count = items.length;
    const isSingle = count === 1;
    const hasFile = items.some((i) => i.type === "file");
    const hasFolder = items.some((i) => i.type === "folder");
    const isSingleFile = isSingle && items[0]?.type === "file";
    const isSingleFolder = isSingle && items[0]?.type === "folder";
    const isMixed = hasFile && hasFolder;

    return {
      isItem: contextTarget.type === "item" && count === 1,
      isItemMulti: contextTarget.type === "item" && count > 1,
      isSingleFile,
      isSingleFolder,
      isMixed,
      count,
      items,
    };
  }, [selectedKeys, displayedItems, contextTarget]);

  return (
    <ContextMenu.Portal>
      <ContextMenu.Content className={MENU_CONTENT}>
        {menuItems.isItemMulti ? (
          <>
            <ContextMenu.Item className={MENU_ITEM} disabled={selectedKeys.size === 0} onSelect={onCopy}>
              <Copy size={15} /> Copy <span className={MENU_SHORTCUT}>{menuItems.count}</span>
            </ContextMenu.Item>
            <ContextMenu.Item className={MENU_ITEM} disabled={clipboardCount === 0} onSelect={onPaste}>
              <ClipboardPaste size={15} /> Paste
            </ContextMenu.Item>
            <ContextMenu.Item className={MENU_ITEM} onSelect={() => onBulkDelete(menuItems.items)}>
              <Trash2 size={15} /> Delete <span className={MENU_SHORTCUT}>{menuItems.count}</span>
            </ContextMenu.Item>
            {!menuItems.isMixed && (
              <>
                <ContextMenu.Separator className={MENU_SEPARATOR} />
                <ContextMenu.Item className={MENU_ITEM} onSelect={() => onDownloadZip(menuItems.items)}>
                  <Archive size={15} /> Download as ZIP
                </ContextMenu.Item>
              </>
            )}
          </>
        ) : menuItems.isItem ? (
          menuItems.isSingleFile ? (
            <>
              <ContextMenu.Item className={MENU_ITEM} onSelect={onCopy}>
                <Copy size={15} /> Copy
              </ContextMenu.Item>
              <ContextMenu.Item className={MENU_ITEM} disabled={clipboardCount === 0} onSelect={onPaste}>
                <ClipboardPaste size={15} /> Paste
              </ContextMenu.Item>
              <ContextMenu.Item className={MENU_ITEM} onSelect={() => onRename(menuItems.items[0])}>
                <Pencil size={15} /> Rename
              </ContextMenu.Item>
              <ContextMenu.Item className={MENU_ITEM} onSelect={() => onDelete(menuItems.items[0])}>
                <Trash2 size={15} /> Delete
              </ContextMenu.Item>
              <ContextMenu.Separator className={MENU_SEPARATOR} />
              <ContextMenu.Item className={MENU_ITEM} onSelect={() => onDownloadItem(menuItems.items[0])}>
                <Download size={15} /> Download
              </ContextMenu.Item>
              <ContextMenu.Item className={MENU_ITEM} onSelect={() => onGetUrl(menuItems.items[0])}>
                <Link size={15} /> Get URL
              </ContextMenu.Item>
              <ContextMenu.Separator className={MENU_SEPARATOR} />
              <ContextMenu.Item className={MENU_ITEM} onSelect={() => onGetInfo(menuItems.items[0])}>
                <Info size={15} /> Get Info
              </ContextMenu.Item>
            </>
          ) : (
            <>
              <ContextMenu.Item className={MENU_ITEM} onSelect={onCopy}>
                <Copy size={15} /> Copy
              </ContextMenu.Item>
              <ContextMenu.Item className={MENU_ITEM} disabled={clipboardCount === 0} onSelect={onPaste}>
                <ClipboardPaste size={15} /> Paste
              </ContextMenu.Item>
              <ContextMenu.Item className={MENU_ITEM} onSelect={() => onRename(menuItems.items[0])}>
                <Pencil size={15} /> Rename
              </ContextMenu.Item>
              <ContextMenu.Item className={MENU_ITEM} onSelect={() => onDelete(menuItems.items[0])}>
                <Trash2 size={15} /> Delete
              </ContextMenu.Item>
              <ContextMenu.Separator className={MENU_SEPARATOR} />
              <ContextMenu.Item className={MENU_ITEM} onSelect={() => onDownloadZip(menuItems.items)}>
                <Archive size={15} /> Download as ZIP
              </ContextMenu.Item>
              <ContextMenu.Separator className={MENU_SEPARATOR} />
              <ContextMenu.Item className={MENU_ITEM} onSelect={() => onGetInfo(menuItems.items[0])}>
                <Info size={15} /> Get Info
              </ContextMenu.Item>
            </>
          )
        ) : (
          <>
            <ContextMenu.Item className={MENU_ITEM} disabled={selectedKeys.size === 0} onSelect={onCopy}>
              <Copy size={15} /> Copy <span className={MENU_SHORTCUT}>{selectedKeys.size > 0 ? `${selectedKeys.size}` : ""}</span>
            </ContextMenu.Item>
            <ContextMenu.Item className={MENU_ITEM} disabled={clipboardCount === 0} onSelect={onPaste}>
              <ClipboardPaste size={15} /> Paste
            </ContextMenu.Item>
            <ContextMenu.Separator className={MENU_SEPARATOR} />
            <ContextMenu.Item className={MENU_ITEM} onSelect={onUpload}>
              <Upload size={15} /> Upload <span className={MENU_SHORTCUT}>Ctrl+U</span>
            </ContextMenu.Item>
            <ContextMenu.Item className={MENU_ITEM} onSelect={onNewFolder}>
              <FolderPlus size={15} /> New Folder <span className={MENU_SHORTCUT}>Ctrl+N</span>
            </ContextMenu.Item>
            <ContextMenu.Separator className={MENU_SEPARATOR} />
            <ContextMenu.Item className={MENU_ITEM} onSelect={onRefresh}>
              <RefreshCw size={15} /> Reload <span className={MENU_SHORTCUT}>F5</span>
            </ContextMenu.Item>
          </>
        )}
      </ContextMenu.Content>
    </ContextMenu.Portal>
  );
}
