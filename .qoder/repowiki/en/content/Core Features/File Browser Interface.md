# File Browser Interface

<cite>
**Referenced Files in This Document**
- [App.tsx](file://src/App.tsx)
- [Sidebar.tsx](file://src/components/layout/Sidebar.tsx)
- [Toolbar.tsx](file://src/components/layout/Toolbar.tsx)
- [FileList.tsx](file://src/components/explorer/FileList.tsx)
- [FileRow.tsx](file://src/components/explorer/FileRow.tsx)
- [FolderRow.tsx](file://src/components/explorer/FolderRow.tsx)
- [ContextMenu.tsx](file://src/components/explorer/ContextMenu.tsx)
- [navigationStore.ts](file://src/store/navigationStore.ts)
- [connectionStore.ts](file://src/store/connectionStore.ts)
- [useKeyboardShortcuts.ts](file://src/hooks/useKeyboardShortcuts.ts)
- [useS3.ts](file://src/hooks/useS3.ts)
- [s3Client.ts](file://src/lib/s3Client.ts)
- [utils.ts](file://src/lib/utils.ts)
- [index.ts](file://src/types/index.ts)
</cite>

## Update Summary
**Changes Made**
- Enhanced FileList component with integrated context menu system using Radix UI
- Added comprehensive keyboard shortcut integration with global shortcut handling
- Improved navigation workflows with enhanced focus management and keyboard navigation
- Added new context menu actions for file and folder operations
- Integrated toast notifications for user feedback on all operations
- Enhanced accessibility with proper focus states and keyboard navigation

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Enhanced FileList Component](#enhanced-filelist-component)
7. [Context Menu System](#context-menu-system)
8. [Keyboard Shortcut Integration](#keyboard-shortcut-integration)
9. [Dependency Analysis](#dependency-analysis)
10. [Performance Considerations](#performance-considerations)
11. [Troubleshooting Guide](#troubleshooting-guide)
12. [Conclusion](#conclusion)
13. [Appendices](#appendices)

## Introduction
This document describes the file browser interface of S3 Explorer, focusing on hierarchical navigation, breadcrumbs, sidebar, file listing, icons, and state management. The interface has been enhanced with an integrated context menu system, comprehensive keyboard shortcut support, and improved navigation workflows. It explains how the active connection determines displayed content, how navigation state is managed, and how UI components integrate with stores and the S3 service layer. Accessibility and responsive design considerations are included, along with common workflows and customization options.

## Project Structure
The file browser interface spans several UI components and state management modules:
- Application shell orchestrates layout, toolbar, sidebar, and content area
- Sidebar lists connections and buckets, enabling selection
- Toolbar renders breadcrumbs, navigation controls, and search
- FileList displays items in a virtualized grid with sorting, selection, and context menus
- FileRow and FolderRow render individual items with icons and metadata
- ContextMenu provides integrated right-click actions for files and folders
- Keyboard shortcuts provide global navigation and operation support
- Stores manage connection and navigation state
- Hooks and clients bridge UI to S3 APIs

```mermaid
graph TB
App["App.tsx<br/>Application Shell"] --> Sidebar["Sidebar.tsx<br/>Connections & Buckets"]
App --> Toolbar["Toolbar.tsx<br/>Breadcrumbs & Controls"]
App --> FileList["FileList.tsx<br/>Items Grid"]
FileList --> FileRow["FileRow.tsx<br/>File Row Renderer"]
FileList --> FolderRow["FolderRow.tsx<br/>Folder Row Renderer"]
FileList --> ContextMenu["ContextMenu.tsx<br/>Integrated Context Menu"]
App --> KeyboardShortcuts["useKeyboardShortcuts.ts<br/>Global Keyboard Shortcuts"]
Sidebar --> ConnectionStore["connectionStore.ts<br/>Active Connection"]
Toolbar --> NavigationStore["navigationStore.ts<br/>Connection/Bucket/Prefix/History"]
FileList --> NavigationStore
App --> NavigationStore
FileList --> UseS3["useS3.ts<br/>TanStack Query Hooks"]
UseS3 --> S3Client["s3Client.ts<br/>AWS S3 Client Factory"]
UseS3 --> Utils["utils.ts<br/>Formatting & Icons"]
NavigationStore --> Types["types/index.ts<br/>Interfaces & Types"]
ConnectionStore --> Types
FileList --> Types
Sidebar --> Types
Toolbar --> Types
```

**Diagram sources**
- [App.tsx:13-94](file://src/App.tsx#L13-L94)
- [Sidebar.tsx:117-183](file://src/components/layout/Sidebar.tsx#L117-L183)
- [Toolbar.tsx:30-87](file://src/components/layout/Toolbar.tsx#L30-L87)
- [FileList.tsx:1-401](file://src/components/explorer/FileList.tsx#L1-L401)
- [FileRow.tsx:34-84](file://src/components/explorer/FileRow.tsx#L34-L84)
- [FolderRow.tsx:18-67](file://src/components/explorer/FolderRow.tsx#L18-L67)
- [ContextMenu.tsx:37-272](file://src/components/explorer/ContextMenu.tsx#L37-L272)
- [useKeyboardShortcuts.ts:49-109](file://src/hooks/useKeyboardShortcuts.ts#L49-L109)
- [navigationStore.ts:36-85](file://src/store/navigationStore.ts#L36-L85)
- [connectionStore.ts:30-87](file://src/store/connectionStore.ts#L30-L87)
- [useS3.ts:62-409](file://src/hooks/useS3.ts#L62-L409)
- [s3Client.ts:60-82](file://src/lib/s3Client.ts#L60-L82)
- [utils.ts:13-197](file://src/lib/utils.ts#L13-L197)
- [index.ts:66-166](file://src/types/index.ts#L66-L166)

**Section sources**
- [App.tsx:13-94](file://src/App.tsx#L13-L94)
- [Sidebar.tsx:117-183](file://src/components/layout/Sidebar.tsx#L117-L183)
- [Toolbar.tsx:30-87](file://src/components/layout/Toolbar.tsx#L30-L87)
- [FileList.tsx:1-401](file://src/components/explorer/FileList.tsx#L1-L401)
- [navigationStore.ts:36-85](file://src/store/navigationStore.ts#L36-L85)
- [connectionStore.ts:30-87](file://src/store/connectionStore.ts#L30-L87)
- [useS3.ts:62-409](file://src/hooks/useS3.ts#L62-L409)
- [s3Client.ts:60-82](file://src/lib/s3Client.ts#L60-L82)
- [utils.ts:13-197](file://src/lib/utils.ts#L13-L197)
- [index.ts:66-166](file://src/types/index.ts#L66-L166)

## Core Components
- Application Shell (App.tsx): Renders layout, passes navigation props to Toolbar, and conditionally renders FileList or EmptyState based on active connection and bucket.
- Sidebar (Sidebar.tsx): Lists connections and expands to show buckets; triggers navigation actions.
- Toolbar (Toolbar.tsx): Provides Back/Home controls, breadcrumbs, refresh, upload/new folder placeholders, and search input with debounced updates.
- FileList (FileList.tsx): Virtualized grid displaying folders and files, supports sorting, selection, keyboard navigation, context menus, and integrated right-click actions.
- FileRow (FileRow.tsx): Renders file rows with dynamic icons and metadata, supporting selection and focus states.
- FolderRow (FolderRow.tsx): Renders folder rows with double-click navigation and keyboard support.
- ContextMenu (ContextMenu.tsx): Integrated right-click menu providing file and folder operations with Radix UI.
- KeyboardShortcuts (useKeyboardShortcuts.ts): Global keyboard shortcut handler for refresh, back, upload, close, and delete operations.
- Stores:
  - navigationStore.ts: Manages connectionId, bucket, prefix, and history for back navigation.
  - connectionStore.ts: Manages S3 connections and active connection selection.
- Hooks and Utilities:
  - useS3.ts: TanStack Query hooks for listing buckets and objects, plus mutations for uploads, downloads, deletes, and metadata.
  - s3Client.ts: Creates S3Client instances per provider with endpoint resolution and path-style addressing.
  - utils.ts: Formatting helpers and file icon mapping.

**Section sources**
- [App.tsx:13-94](file://src/App.tsx#L13-L94)
- [Sidebar.tsx:117-183](file://src/components/layout/Sidebar.tsx#L117-L183)
- [Toolbar.tsx:30-87](file://src/components/layout/Toolbar.tsx#L30-L87)
- [FileList.tsx:1-401](file://src/components/explorer/FileList.tsx#L1-L401)
- [FileRow.tsx:34-84](file://src/components/explorer/FileRow.tsx#L34-L84)
- [FolderRow.tsx:18-67](file://src/components/explorer/FolderRow.tsx#L18-L67)
- [ContextMenu.tsx:37-272](file://src/components/explorer/ContextMenu.tsx#L37-L272)
- [useKeyboardShortcuts.ts:49-109](file://src/hooks/useKeyboardShortcuts.ts#L49-L109)
- [navigationStore.ts:36-85](file://src/store/navigationStore.ts#L36-L85)
- [connectionStore.ts:30-87](file://src/store/connectionStore.ts#L30-L87)
- [useS3.ts:62-409](file://src/hooks/useS3.ts#L62-L409)
- [s3Client.ts:60-82](file://src/lib/s3Client.ts#L60-L82)
- [utils.ts:13-197](file://src/lib/utils.ts#L13-L197)

## Architecture Overview
The file browser follows a unidirectional data flow with enhanced integration:
- UI components read from Zustand stores and TanStack Query queries.
- Actions mutate state (navigation, connection) or trigger S3 operations.
- Queries invalidate and refetch when navigation or refresh occurs.
- Icons and formatting are computed via utility functions.
- Context menus provide integrated right-click actions for all operations.
- Keyboard shortcuts provide global navigation and operation support.

```mermaid
sequenceDiagram
participant U as "User"
participant S as "Sidebar.tsx"
participant NS as "navigationStore.ts"
participant C as "connectionStore.ts"
participant T as "Toolbar.tsx"
participant KS as "useKeyboardShortcuts.ts"
participant FL as "FileList.tsx"
participant CM as "ContextMenu.tsx"
participant US3 as "useS3.ts"
participant SC as "s3Client.ts"
U->>S : Select connection/bucket
S->>C : setActiveConnection()/setBucket()
S->>NS : setBucket(connectionId, bucket)
NS-->>T : Subscribe to connectionId/bucket/prefix/history
NS-->>FL : Subscribe to prefix/history
KS->>FL : Keyboard shortcuts (F5, Backspace, Ctrl+U)
FL->>CM : Context menu integration
T->>NS : onBack/goBack()
NS-->>FL : prefix updated
FL->>US3 : listObjects(connectionId, bucket, prefix)
US3->>SC : createS3Client()
US3-->>FL : items (folders/files)
FL-->>U : Render virtualized grid with context menus
```

**Diagram sources**
- [Sidebar.tsx:117-183](file://src/components/layout/Sidebar.tsx#L117-L183)
- [navigationStore.ts:36-85](file://src/store/navigationStore.ts#L36-L85)
- [connectionStore.ts:30-87](file://src/store/connectionStore.ts#L30-L87)
- [Toolbar.tsx:30-87](file://src/components/layout/Toolbar.tsx#L30-L87)
- [useKeyboardShortcuts.ts:49-109](file://src/hooks/useKeyboardShortcuts.ts#L49-L109)
- [FileList.tsx:1-401](file://src/components/explorer/FileList.tsx#L1-L401)
- [ContextMenu.tsx:37-272](file://src/components/explorer/ContextMenu.tsx#L37-L272)
- [useS3.ts:62-409](file://src/hooks/useS3.ts#L62-L409)
- [s3Client.ts:60-82](file://src/lib/s3Client.ts#L60-L82)

## Detailed Component Analysis

### Hierarchical Navigation and Path Handling
- Navigation state consists of connectionId, bucket, prefix (current folder path), and history for back navigation.
- Changing bucket resets prefix to root and pushes the previous prefix to history.
- Navigating deeper pushes the current prefix onto history before updating prefix.
- Back navigation pops from history to restore previous prefix.

```mermaid
flowchart TD
Start(["User selects bucket"]) --> SetBucket["setBucket(connectionId, bucket)<br/>Reset prefix to ''<br/>Push old prefix to history"]
SetBucket --> NavigateDeeper["User opens folder"]
NavigateDeeper --> PushHistory["pushHistory(currentPrefix)"]
PushHistory --> UpdatePrefix["setPrefix(newPrefix)"]
UpdatePrefix --> Back["User clicks Back"]
Back --> PopHistory["goBack()<br/>Pop from history"]
PopHistory --> UpdatePrefix
```

**Diagram sources**
- [navigationStore.ts:42-78](file://src/store/navigationStore.ts#L42-L78)

**Section sources**
- [navigationStore.ts:42-78](file://src/store/navigationStore.ts#L42-L78)
- [App.tsx:42-53](file://src/App.tsx#L42-L53)

### Breadcrumb Navigation
- Breadcrumb segments are derived from the current prefix by splitting on "/" and accumulating path segments.
- Each segment carries its full prefix up to that point, enabling direct navigation to any ancestor.
- The Toolbar renders the breadcrumb and disables actions when no bucket is selected.

```mermaid
sequenceDiagram
participant T as "Toolbar.tsx"
participant NS as "navigationStore.ts"
T->>NS : Read prefix
NS-->>T : prefix="/a/b/c/"
T->>T : Split by "/" -> ["a","b","c"]
T->>T : Accumulate prefixes -> ["/a/","/a/b/","/a/b/c/"]
T-->>UI : Render clickable segments
UI->>T : Click segment
T->>NS : onNavigate(targetPrefix)
NS-->>FL : prefix updated
```

**Diagram sources**
- [Toolbar.tsx:52-67](file://src/components/layout/Toolbar.tsx#L52-L67)
- [App.tsx:42-53](file://src/App.tsx#L42-L53)
- [navigationStore.ts:54-61](file://src/store/navigationStore.ts#L54-L61)

**Section sources**
- [Toolbar.tsx:52-67](file://src/components/layout/Toolbar.tsx#L52-L67)
- [App.tsx:42-53](file://src/App.tsx#L42-L53)

### Sidebar Components: Connections and Buckets
- Sidebar lists saved connections and toggles expansion to show buckets for the selected connection.
- Clicking a connection sets it as active and toggles expanded state.
- Clicking a bucket invokes navigation to that bucket (root prefix) and clears history.

```mermaid
classDiagram
class Sidebar {
+props onAddConnection
-expandedId : string|null
+handleConnectionClick(id)
+render()
}
class ConnectionItem {
+connection : S3Connection
+isActive : boolean
+isExpanded : boolean
+onSelect()
}
class BucketList {
+connectionId : string
+render()
}
Sidebar --> ConnectionItem : "renders"
Sidebar --> BucketList : "conditionally renders"
```

**Diagram sources**
- [Sidebar.tsx:117-183](file://src/components/layout/Sidebar.tsx#L117-L183)
- [connectionStore.ts:30-87](file://src/store/connectionStore.ts#L30-L87)
- [navigationStore.ts:42-52](file://src/store/navigationStore.ts#L42-L52)

**Section sources**
- [Sidebar.tsx:117-183](file://src/components/layout/Sidebar.tsx#L117-L183)
- [connectionStore.ts:30-87](file://src/store/connectionStore.ts#L30-L87)
- [navigationStore.ts:42-52](file://src/store/navigationStore.ts#L42-L52)

### File Listing Interface: Virtualization, Sorting, Selection
- FileList uses virtualization to efficiently render large folder contents.
- Supports sorting by name, size, lastModified, and storageClass with toggle indicators.
- Implements keyboard navigation and selection state for multiple items.
- Displays skeleton loaders during initial load and empty states for no results or filters.
- Integrates context menus for all items with Radix UI.

```mermaid
flowchart TD
Init(["Mount FileList"]) --> Query["useS3.listObjects(connectionId,bucket,prefix)"]
Query --> Loading{"isLoading?"}
Loading --> |Yes| Skeleton["Render SkeletonRows"]
Loading --> |No| Items["items received"]
Items --> Empty{"items.length == 0?"}
Empty --> |Yes| Filtered{"filterQuery?"}
Filtered --> |Yes| NoMatch["Show 'No items match'"]
Filtered --> |No| EmptyFolder["Show 'Folder empty'"]
Empty --> |No| Render["Virtualize rows"]
Render --> Sort["ColumnHeader sortable"]
Render --> Select["Keyboard/mouse selection"]
Render --> ContextMenu["Radix UI Context Menu"]
```

**Diagram sources**
- [FileList.tsx:1-401](file://src/components/explorer/FileList.tsx#L1-L401)
- [useS3.ts:91-144](file://src/hooks/useS3.ts#L91-L144)

**Section sources**
- [FileList.tsx:1-401](file://src/components/explorer/FileList.tsx#L1-L401)
- [useS3.ts:91-144](file://src/hooks/useS3.ts#L91-L144)

### Icon System and Visual Representation
- FileRow dynamically selects icons based on file extension using a mapping utility.
- Folders are represented as virtual folders derived from CommonPrefixes; files include metadata like size and lastModified.
- Icons are resolved at runtime and rendered consistently across rows.
- Both FileRow and FolderRow support selection and focus states for accessibility.

```mermaid
classDiagram
class FileRow {
+item : S3Item
+getFileIcon(name) string
+render()
}
class FolderRow {
+item : S3Item
+onOpen(item) void
+render()
}
class Utils {
+getFileIcon(fileName) : string
+formatFileSize(bytes) : string
+formatDate(date) : string
}
FileRow --> Utils : "uses getFileIcon()"
FolderRow --> Utils : "uses formatDate()"
```

**Diagram sources**
- [FileRow.tsx:34-84](file://src/components/explorer/FileRow.tsx#L34-L84)
- [FolderRow.tsx:18-67](file://src/components/explorer/FolderRow.tsx#L18-L67)
- [utils.ts:144-150](file://src/lib/utils.ts#L144-L150)

**Section sources**
- [FileRow.tsx:34-84](file://src/components/explorer/FileRow.tsx#L34-L84)
- [FolderRow.tsx:18-67](file://src/components/explorer/FolderRow.tsx#L18-L67)
- [utils.ts:144-150](file://src/lib/utils.ts#L144-L150)

### Relationship Between Active Connection and Displayed Content
- The active connection drives S3 client creation and determines which buckets are listed.
- Selecting a bucket initializes navigation to root prefix and clears history.
- Without an active connection or bucket, the UI shows an EmptyState prompting selection.

```mermaid
sequenceDiagram
participant C as "connectionStore.ts"
participant S as "Sidebar.tsx"
participant NS as "navigationStore.ts"
participant US3 as "useS3.ts"
participant UI as "App.tsx/FileList.tsx"
S->>C : setActiveConnection(id)
C-->>S : activeConnectionId updated
S->>US3 : listBuckets(enabled by activeConnectionId)
S->>NS : setBucket(connectionId, bucket)
NS-->>UI : connectionId/bucket/prefix updated
UI->>US3 : listObjects(enabled by bucket/prefix)
US3-->>UI : items rendered
```

**Diagram sources**
- [connectionStore.ts:30-87](file://src/store/connectionStore.ts#L30-L87)
- [Sidebar.tsx:117-183](file://src/components/layout/Sidebar.tsx#L117-L183)
- [navigationStore.ts:42-52](file://src/store/navigationStore.ts#L42-L52)
- [useS3.ts:69-85](file://src/hooks/useS3.ts#L69-L85)
- [App.tsx:82-89](file://src/App.tsx#L82-L89)

**Section sources**
- [connectionStore.ts:30-87](file://src/store/connectionStore.ts#L30-L87)
- [Sidebar.tsx:117-183](file://src/components/layout/Sidebar.tsx#L117-L183)
- [navigationStore.ts:42-52](file://src/store/navigationStore.ts#L42-L52)
- [useS3.ts:69-85](file://src/hooks/useS3.ts#L69-L85)
- [App.tsx:82-89](file://src/App.tsx#L82-L89)

### User Interaction Patterns
- Browsing: Click breadcrumb segments or folder rows to navigate deeper; use Back to return.
- Filtering: Type in the Toolbar search box; input is debounced and forwarded to FileList.
- Organizing: Sorting is controlled via column headers; selection enables batch operations (placeholder handlers).
- Refresh: Invalidate current folder query to reload items.
- Context Menus: Right-click on any item to access integrated operations.
- Keyboard Navigation: Use arrow keys, Enter, and Backspace for seamless navigation.

```mermaid
sequenceDiagram
participant U as "User"
participant T as "Toolbar.tsx"
participant KS as "useKeyboardShortcuts.ts"
participant NS as "navigationStore.ts"
participant FL as "FileList.tsx"
participant CM as "ContextMenu.tsx"
participant QC as "TanStack Query"
U->>T : Type in search box
T->>T : Debounce 300ms
T->>FL : onSearchChange(query)
FL->>QC : Invalidate ["s3","objects",connectionId,bucket,prefix]
QC-->>FL : Refetch items
U->>KS : Press F5/Ctrl+R
KS->>FL : onRefresh()
FL->>QC : Invalidate current query
QC-->>FL : Refetch items
U->>FL : Right-click item
FL->>CM : Show context menu
U->>CM : Select operation
CM->>QC : Execute mutation
QC-->>FL : Invalidate and refetch
```

**Diagram sources**
- [Toolbar.tsx:44-50](file://src/components/layout/Toolbar.tsx#L44-L50)
- [App.tsx:55-58](file://src/App.tsx#L55-L58)
- [useKeyboardShortcuts.ts:49-109](file://src/hooks/useKeyboardShortcuts.ts#L49-L109)
- [navigationStore.ts:63-74](file://src/store/navigationStore.ts#L63-L74)
- [FileList.tsx:158-180](file://src/components/explorer/FileList.tsx#L158-L180)
- [ContextMenu.tsx:37-272](file://src/components/explorer/ContextMenu.tsx#L37-L272)
- [useS3.ts:37-40](file://src/hooks/useS3.ts#L37-L40)

**Section sources**
- [Toolbar.tsx:44-50](file://src/components/layout/Toolbar.tsx#L44-L50)
- [App.tsx:55-58](file://src/App.tsx#L55-L58)
- [useKeyboardShortcuts.ts:49-109](file://src/hooks/useKeyboardShortcuts.ts#L49-L109)
- [navigationStore.ts:63-74](file://src/store/navigationStore.ts#L63-L74)
- [FileList.tsx:158-180](file://src/components/explorer/FileList.tsx#L158-L180)
- [ContextMenu.tsx:37-272](file://src/components/explorer/ContextMenu.tsx#L37-L272)
- [useS3.ts:37-40](file://src/hooks/useS3.ts#L37-L40)

### Integration Between UI and State Management
- App.tsx subscribes to navigation state and passes callbacks to Toolbar and FileList.
- FileList subscribes to navigation state and uses TanStack Query for data fetching.
- Sidebar updates connection and navigation state, which cascades to Toolbar and FileList.
- Keyboard shortcuts integrate globally with the application state.

```mermaid
graph LR
App["App.tsx"] --> NS["navigationStore.ts"]
App --> CS["connectionStore.ts"]
App --> Toolbar["Toolbar.tsx"]
App --> FileList["FileList.tsx"]
App --> KeyboardShortcuts["useKeyboardShortcuts.ts"]
Toolbar --> NS
FileList --> NS
FileList --> US3["useS3.ts"]
Sidebar["Sidebar.tsx"] --> CS
Sidebar --> NS
KeyboardShortcuts --> NS
```

**Diagram sources**
- [App.tsx:13-94](file://src/App.tsx#L13-L94)
- [navigationStore.ts:36-85](file://src/store/navigationStore.ts#L36-L85)
- [connectionStore.ts:30-87](file://src/store/connectionStore.ts#L30-L87)
- [Toolbar.tsx:30-87](file://src/components/layout/Toolbar.tsx#L30-L87)
- [FileList.tsx:1-401](file://src/components/explorer/FileList.tsx#L1-L401)
- [useKeyboardShortcuts.ts:49-109](file://src/hooks/useKeyboardShortcuts.ts#L49-L109)
- [Sidebar.tsx:117-183](file://src/components/layout/Sidebar.tsx#L117-L183)

**Section sources**
- [App.tsx:13-94](file://src/App.tsx#L13-L94)
- [navigationStore.ts:36-85](file://src/store/navigationStore.ts#L36-L85)
- [connectionStore.ts:30-87](file://src/store/connectionStore.ts#L30-L87)
- [Toolbar.tsx:30-87](file://src/components/layout/Toolbar.tsx#L30-L87)
- [FileList.tsx:1-401](file://src/components/explorer/FileList.tsx#L1-L401)
- [useKeyboardShortcuts.ts:49-109](file://src/hooks/useKeyboardShortcuts.ts#L49-L109)
- [Sidebar.tsx:117-183](file://src/components/layout/Sidebar.tsx#L117-L183)

### Responsive Design and Accessibility
- Layout uses flexbox with overflow-hidden containers to adapt to viewport.
- FileList grid uses a fixed row height and responsive columns; virtualization ensures smooth scrolling on large datasets.
- Keyboard navigation is supported in FileList; rows are focusable and selectable with proper focus indicators.
- Context menus use Radix UI for accessible dropdown interactions.
- Icons and labels are accessible; interactive elements include hover/focus states.
- Toast notifications provide accessible feedback for all operations.

**Section sources**
- [App.tsx:61-93](file://src/App.tsx#L61-L93)
- [FileList.tsx:260-339](file://src/components/explorer/FileList.tsx#L260-L339)
- [FileRow.tsx:48-84](file://src/components/explorer/FileRow.tsx#L48-L84)
- [FolderRow.tsx:38-67](file://src/components/explorer/FolderRow.tsx#L38-L67)

### Common Navigation Workflows
- Open a bucket: Select connection, expand to show buckets, choose a bucket.
- Navigate deeper: Click a folder row to update prefix; breadcrumb reflects current location.
- Move up: Click parent breadcrumb segment or use Back button.
- Refresh current folder: Click Refresh to invalidate and reload items.
- Search within folder: Type in Toolbar search; results update after debounce.
- Access context menu: Right-click any item for integrated operations.
- Keyboard navigation: Use arrow keys, Enter, Backspace, and Ctrl+U for efficient navigation.

**Section sources**
- [Sidebar.tsx:87-107](file://src/components/layout/Sidebar.tsx#L87-L107)
- [Toolbar.tsx:52-67](file://src/components/layout/Toolbar.tsx#L52-L67)
- [App.tsx:35-40](file://src/App.tsx#L35-L40)
- [FileList.tsx:234-258](file://src/components/explorer/FileList.tsx#L234-L258)
- [useKeyboardShortcuts.ts:49-109](file://src/hooks/useKeyboardShortcuts.ts#L49-L109)

### Interface Customization Options
- Providers: S3-compatible providers (AWS, MinIO, R2, B2, custom) with endpoint resolution and path-style addressing.
- Icons: Extensible icon mapping by file extension; new extensions can be added to the mapping.
- Sorting: Configurable sort fields and directions; UI updates sort indicators accordingly.
- Empty states: Distinct messages for empty folders versus filtered results.
- Context menu actions: Integrated operations for all file and folder types.
- Keyboard shortcuts: Global shortcuts for refresh, back, upload, close, and delete operations.

**Section sources**
- [s3Client.ts:12-49](file://src/lib/s3Client.ts#L12-L49)
- [utils.ts:46-134](file://src/lib/utils.ts#L46-L134)
- [FileList.tsx:268-273](file://src/components/explorer/FileList.tsx#L268-L273)
- [FileList.tsx:234-258](file://src/components/explorer/FileList.tsx#L234-L258)
- [ContextMenu.tsx:203-272](file://src/components/explorer/ContextMenu.tsx#L203-L272)
- [useKeyboardShortcuts.ts:49-109](file://src/hooks/useKeyboardShortcuts.ts#L49-L109)

## Enhanced FileList Component

### Integrated Context Menu System
The FileList component now features an integrated context menu system that wraps each row with Radix UI's ContextMenu component. This provides seamless right-click access to all operations without interrupting the virtualized rendering.

**Updated** Enhanced with ItemContextMenu wrapper for integrated right-click actions

```mermaid
flowchart TD
FileList["FileList.tsx"] --> ItemContextMenu["ItemContextMenu.tsx Wrapper"]
ItemContextMenu --> FileRow["FileRow.tsx"]
ItemContextMenu --> FolderRow["FolderRow.tsx"]
FileRow --> ContextMenuRoot["Radix UI ContextMenu.Root"]
FolderRow --> ContextMenuRoot
ContextMenuRoot --> ContextMenuPortal["ContextMenu.Portal"]
ContextMenuPortal --> ContextMenuContent["ContextMenu.Content"]
ContextMenuContent --> FileActions["File Operations"]
ContextMenuContent --> FolderActions["Folder Operations"]
```

**Diagram sources**
- [FileList.tsx:289-319](file://src/components/explorer/FileList.tsx#L289-L319)
- [ContextMenu.tsx:203-272](file://src/components/explorer/ContextMenu.tsx#L203-L272)

**Section sources**
- [FileList.tsx:289-319](file://src/components/explorer/FileList.tsx#L289-L319)
- [ContextMenu.tsx:37-272](file://src/components/explorer/ContextMenu.tsx#L37-L272)

### Enhanced Keyboard Navigation
The FileList component now includes comprehensive keyboard navigation support with focus management and selection handling.

**Updated** Added keyboard navigation with arrow keys, Enter, and Backspace support

```mermaid
flowchart TD
KeyboardEvent["Keyboard Event"] --> CheckItems{"displayedItems.length > 0?"}
CheckItems --> |No| Return["Return early"]
CheckItems --> |Yes| Switch["Switch statement"]
Switch --> ArrowDown["ArrowDown: Move focus down"]
Switch --> ArrowUp["ArrowUp: Move focus up"]
Switch --> Enter["Enter: Open focused item"]
ArrowDown --> PreventDefault["preventDefault()"]
ArrowUp --> PreventDefault
Enter --> PreventDefault
PreventDefault --> UpdateFocus["Update focusIndex"]
UpdateFocus --> OpenItem["openItem(displayedItems[focusIndex])"]
```

**Diagram sources**
- [FileList.tsx:158-180](file://src/components/explorer/FileList.tsx#L158-L180)

**Section sources**
- [FileList.tsx:158-180](file://src/components/explorer/FileList.tsx#L158-L180)

### Improved Focus Management
Both FileRow and FolderRow components now support focus states with proper accessibility attributes and visual indicators.

**Updated** Added focus management with ring-2 ring-inset ring-blue-400 styling

**Section sources**
- [FileRow.tsx:48-84](file://src/components/explorer/FileRow.tsx#L48-L84)
- [FolderRow.tsx:38-67](file://src/components/explorer/FolderRow.tsx#L38-L67)

## Context Menu System

### Integrated Operations
The context menu system provides integrated operations for both files and folders through Radix UI's accessible context menu implementation.

**Updated** Comprehensive context menu with file and folder specific operations

```mermaid
flowchart TD
ContextMenu["ItemContextMenu.tsx"] --> Trigger["ContextMenu.Trigger"]
Trigger --> Children["Children (FileRow/FolderRow)"]
ContextMenu --> Portal["ContextMenu.Portal"]
Portal --> Content["ContextMenu.Content"]
Content --> FileMenu["File Menu"]
Content --> FolderMenu["Folder Menu"]
FileMenu --> Download["Download"]
FileMenu --> CopyUrl["Copy Presigned URL"]
FileMenu --> Rename["Rename"]
FileMenu --> Delete["Delete"]
FileMenu --> GetInfo["Get Info"]
FolderMenu --> DownloadZip["Download as ZIP (Soon)"]
FolderMenu --> DeleteFolder["Delete Folder"]
FolderMenu --> GetInfoFolder["Get Info"]
```

**Diagram sources**
- [ContextMenu.tsx:203-272](file://src/components/explorer/ContextMenu.tsx#L203-L272)

**Section sources**
- [ContextMenu.tsx:37-272](file://src/components/explorer/ContextMenu.tsx#L37-L272)

### Toast Notifications
All context menu operations now provide comprehensive toast notifications using Sonner for user feedback.

**Updated** Integrated toast notifications for all operations with loading, success, and error states

**Section sources**
- [ContextMenu.tsx:60-183](file://src/components/explorer/ContextMenu.tsx#L60-L183)

## Keyboard Shortcut Integration

### Global Shortcut Handler
The application now includes a global keyboard shortcut handler that manages shortcuts across the entire application.

**Updated** Added useKeyboardShortcuts hook for global keyboard shortcut management

```mermaid
flowchart TD
useKeyboardShortcuts["useKeyboardShortcuts.ts"] --> EventListener["addEventListener('keydown')"]
EventListener --> CheckEditable{"isEditable(target)?"}
CheckEditable --> |Yes| Return["Return (ignore input)"]
CheckEditable --> |No| CheckKey["Check key combination"]
CheckKey --> F5["F5: Refresh"]
CheckKey --> CtrlR["Ctrl+R: Refresh"]
CheckKey --> CtrlU["Ctrl+U: Upload"]
CheckKey --> Backspace["Backspace: Go Back"]
CheckKey --> Delete["Delete: Delete selected"]
CheckKey --> Escape["Escape: Close modal/deselect"]
F5 --> PreventDefault["preventDefault()"]
CtrlR --> PreventDefault
CtrlU --> PreventDefault
Backspace --> PreventDefault
Delete --> PreventDefault
Escape --> PreventDefault
PreventDefault --> CallHandler["Call handler function"]
```

**Diagram sources**
- [useKeyboardShortcuts.ts:56-107](file://src/hooks/useKeyboardShortcuts.ts#L56-L107)

**Section sources**
- [useKeyboardShortcuts.ts:49-109](file://src/hooks/useKeyboardShortcuts.ts#L49-L109)

### Application Integration
The keyboard shortcuts are integrated throughout the application with proper callback handling.

**Updated** Keyboard shortcuts integrated in App.tsx with proper handler functions

**Section sources**
- [App.tsx:76-92](file://src/App.tsx#L76-L92)

## Dependency Analysis
- UI components depend on Zustand stores for state and TanStack Query for data.
- useS3 depends on connectionStore to resolve credentials and on s3Client to construct clients per provider.
- File rendering depends on utils for icon and formatting functions.
- Context menus use Radix UI for accessible dropdown interactions.
- Keyboard shortcuts provide global navigation support.
- Types define shared interfaces for navigation, items, and transfers.

```mermaid
graph TB
UI["UI Components"] --> ZS["Zustand Stores"]
UI --> TQ["TanStack Query"]
UI --> RadixUI["Radix UI ContextMenu"]
UI --> Sonner["Sonner Toasts"]
UI --> KeyboardShortcuts["useKeyboardShortcuts.ts"]
TQ --> US3["useS3.ts"]
US3 --> CS["connectionStore.ts"]
US3 --> SC["s3Client.ts"]
UI --> UT["utils.ts"]
ZS --> TY["types/index.ts"]
TQ --> TY
US3 --> TY
UI --> TY
RadixUI --> TY
```

**Diagram sources**
- [App.tsx:13-94](file://src/App.tsx#L13-L94)
- [navigationStore.ts:36-85](file://src/store/navigationStore.ts#L36-L85)
- [connectionStore.ts:30-87](file://src/store/connectionStore.ts#L30-L87)
- [useS3.ts:62-409](file://src/hooks/useS3.ts#L62-L409)
- [s3Client.ts:60-82](file://src/lib/s3Client.ts#L60-L82)
- [utils.ts:13-197](file://src/lib/utils.ts#L13-L197)
- [index.ts:66-166](file://src/types/index.ts#L66-L166)
- [ContextMenu.tsx:1-272](file://src/components/explorer/ContextMenu.tsx#L1-L272)
- [useKeyboardShortcuts.ts:1-109](file://src/hooks/useKeyboardShortcuts.ts#L1-L109)

**Section sources**
- [App.tsx:13-94](file://src/App.tsx#L13-L94)
- [navigationStore.ts:36-85](file://src/store/navigationStore.ts#L36-L85)
- [connectionStore.ts:30-87](file://src/store/connectionStore.ts#L30-L87)
- [useS3.ts:62-409](file://src/hooks/useS3.ts#L62-L409)
- [s3Client.ts:60-82](file://src/lib/s3Client.ts#L60-L82)
- [utils.ts:13-197](file://src/lib/utils.ts#L13-L197)
- [index.ts:66-166](file://src/types/index.ts#L66-L166)
- [ContextMenu.tsx:1-272](file://src/components/explorer/ContextMenu.tsx#L1-L272)
- [useKeyboardShortcuts.ts:1-109](file://src/hooks/useKeyboardShortcuts.ts#L1-L109)

## Performance Considerations
- Virtualization: FileList uses virtualization to render only visible rows, minimizing DOM and improving scroll performance.
- Query invalidation: Refresh and navigation invalidate current folder queries to avoid stale data while preventing unnecessary re-fetches.
- Debounced search: Toolbar debounced input to reduce frequent re-renders and network calls.
- Endpoint configuration: Non-AWS providers use path-style addressing to prevent bucket endpoint rewriting overhead.
- Context menu optimization: Radix UI context menus are portal-based to minimize DOM traversal overhead.
- Keyboard shortcut handling: Global shortcuts use event delegation to minimize memory footprint.

**Section sources**
- [FileList.tsx:1-401](file://src/components/explorer/FileList.tsx#L1-L401)
- [Toolbar.tsx:44-50](file://src/components/layout/Toolbar.tsx#L44-L50)
- [useS3.ts:37-40](file://src/hooks/useS3.ts#L37-L40)
- [s3Client.ts:71-79](file://src/lib/s3Client.ts#L71-L79)
- [ContextMenu.tsx:203-272](file://src/components/explorer/ContextMenu.tsx#L203-L272)
- [useKeyboardShortcuts.ts:56-107](file://src/hooks/useKeyboardShortcuts.ts#L56-L107)

## Troubleshooting Guide
- No buckets displayed: Verify active connection is set and provider endpoint is valid; check for errors in bucket listing.
- Cannot navigate to subfolders: Ensure prefix updates propagate to navigation store and queries re-run.
- Empty folder state: Confirm delimiter and prefix handling; verify that folder placeholders end with "/".
- Download failures: Check signed URL generation and HTTP status; large files should use native download mechanisms.
- Icon mismatches: Extend the extension-to-icon mapping in utils for new file types.
- Context menu not working: Verify Radix UI ContextMenu installation and proper portal mounting.
- Keyboard shortcuts not responding: Check that shortcuts are not being blocked by input fields and that event listeners are properly attached.
- Focus issues: Ensure rows have proper tabIndex values and focus management is handled correctly.

**Section sources**
- [Sidebar.tsx:52-83](file://src/components/layout/Sidebar.tsx#L52-L83)
- [useS3.ts:91-144](file://src/hooks/useS3.ts#L91-L144)
- [utils.ts:144-150](file://src/lib/utils.ts#L144-L150)
- [ContextMenu.tsx:203-272](file://src/components/explorer/ContextMenu.tsx#L203-L272)
- [useKeyboardShortcuts.ts:56-107](file://src/hooks/useKeyboardShortcuts.ts#L56-L107)

## Conclusion
The file browser has been significantly enhanced with an integrated context menu system, comprehensive keyboard shortcut support, and improved navigation workflows. The FileList component now provides seamless right-click access to all operations through Radix UI, while the global keyboard shortcut handler enables efficient navigation across the entire application. The enhanced focus management and accessibility features ensure a robust user experience. The integration between UI components, state management, and S3 operations maintains the clean separation of concerns while delivering a modern, responsive interface.

## Appendices
- Types and interfaces define the contract for navigation, items, and transfers.
- Example operations: list buckets, list objects, upload, download, delete, create folder, rename, and get info.
- Context menu operations include download, copy URL, rename, delete, and get info for both files and folders.
- Keyboard shortcuts cover refresh, back navigation, upload, close, and delete operations.

**Section sources**
- [index.ts:66-166](file://src/types/index.ts#L66-L166)
- [useS3.ts:69-409](file://src/hooks/useS3.ts#L69-L409)
- [ContextMenu.tsx:203-272](file://src/components/explorer/ContextMenu.tsx#L203-L272)
- [useKeyboardShortcuts.ts:49-109](file://src/hooks/useKeyboardShortcuts.ts#L49-L109)