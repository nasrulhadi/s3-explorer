# S3 Integration

<cite>
**Referenced Files in This Document**
- [useS3.ts](file://src/hooks/useS3.ts)
- [s3Client.ts](file://src/lib/s3Client.ts)
- [connectionStore.ts](file://src/store/connectionStore.ts)
- [navigationStore.ts](file://src/store/navigationStore.ts)
- [transferStore.ts](file://src/store/transferStore.ts)
- [utils.ts](file://src/lib/utils.ts)
- [index.ts](file://src/types/index.ts)
- [App.tsx](file://src/App.tsx)
- [package.json](file://package.json)
- [Cargo.toml](file://src-tauri/Cargo.toml)
- [lib.rs](file://src-tauri/src/lib.rs)
- [tauri.conf.json](file://src-tauri/tauri.conf.json)
</cite>

## Update Summary
**Changes Made**
- Added comprehensive documentation for the new custom HTTP handler leveraging Tauri's native HTTP plugin
- Updated architecture overview to include the HTTP handler bypass mechanism
- Enhanced troubleshooting guide with CORS-related issues
- Added Tauri-specific configuration requirements
- Updated dependency analysis to include Tauri HTTP plugin

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document explains the S3 integration architecture in S3 Explorer. It focuses on the S3 client factory pattern, provider-specific configurations for AWS, MinIO, Cloudflare R2, and Backblaze B2, the S3 client creation process, credential handling, endpoint configuration, and error handling strategies. The architecture now includes a custom HTTP handler that leverages Tauri's native HTTP plugin to bypass CORS restrictions for S3-compatible providers. It also documents the useS3 hook as the centralized S3 operations hub, covering supported operations (list buckets, list objects, upload, download, delete, rename, create folder, presigned URLs, head object), and provides guidance on configuring different providers, handling authentication, and implementing custom endpoints. Finally, it outlines performance considerations, retry mechanisms, and best practices for S3 operations.

## Project Structure
The S3 integration spans several modules with enhanced Tauri integration:
- Hooks: Centralized S3 operations exposed via a React hook powered by TanStack Query.
- Libraries: S3 client factory with custom HTTP handler and utility helpers.
- Stores: State management for connections, navigation, and transfers.
- Types: Strongly typed domain models for S3 connections, items, and operations.
- Tauri Integration: Native HTTP plugin configuration for CORS bypass.

```mermaid
graph TB
subgraph "Hooks"
H_useS3["useS3.ts"]
end
subgraph "Libraries"
L_s3Client["s3Client.ts"]
L_utils["utils.ts"]
end
subgraph "Stores"
S_connection["connectionStore.ts"]
S_navigation["navigationStore.ts"]
S_transfer["transferStore.ts"]
end
subgraph "Types"
T_index["types/index.ts"]
end
subgraph "Tauri Integration"
T_cargo["Cargo.toml"]
T_lib["lib.rs"]
T_conf["tauri.conf.json"]
end
subgraph "UI"
UI_App["App.tsx"]
end
H_useS3 --> L_s3Client
H_useS3 --> S_connection
H_useS3 --> L_utils
H_useS3 --> T_index
UI_App --> H_useS3
UI_App --> S_navigation
UI_App --> S_transfer
L_s3Client --> T_cargo
T_lib --> T_cargo
```

**Diagram sources**
- [useS3.ts:1-418](file://src/hooks/useS3.ts#L1-L418)
- [s3Client.ts:1-183](file://src/lib/s3Client.ts#L1-L183)
- [connectionStore.ts:1-88](file://src/store/connectionStore.ts#L1-L88)
- [navigationStore.ts:1-86](file://src/store/navigationStore.ts#L1-L86)
- [transferStore.ts:1-62](file://src/store/transferStore.ts#L1-L62)
- [utils.ts:1-197](file://src/lib/utils.ts#L1-L197)
- [index.ts:1-166](file://src/types/index.ts#L1-L166)
- [App.tsx:1-136](file://src/App.tsx#L1-L136)
- [Cargo.toml:20-26](file://src-tauri/Cargo.toml#L20-L26)
- [lib.rs:10-14](file://src-tauri/src/lib.rs#L10-L14)
- [tauri.conf.json:1-40](file://src-tauri/tauri.conf.json#L1-L40)

**Section sources**
- [useS3.ts:1-418](file://src/hooks/useS3.ts#L1-L418)
- [s3Client.ts:1-183](file://src/lib/s3Client.ts#L1-L183)
- [connectionStore.ts:1-88](file://src/store/connectionStore.ts#L1-L88)
- [navigationStore.ts:1-86](file://src/store/navigationStore.ts#L1-L86)
- [transferStore.ts:1-62](file://src/store/transferStore.ts#L1-L62)
- [utils.ts:1-197](file://src/lib/utils.ts#L1-L197)
- [index.ts:1-166](file://src/types/index.ts#L1-L166)
- [App.tsx:1-136](file://src/App.tsx#L1-L136)

## Core Components
- S3 Client Factory: Creates a configured S3Client instance from an S3Connection, handling provider-specific endpoints and path-style addressing with custom HTTP handler integration.
- Custom HTTP Handler: Routes AWS SDK HTTP requests through Tauri's native HTTP client (plugin-http/reqwest) instead of the browser's fetch, bypassing CORS restrictions for S3-compatible providers.
- useS3 Hook: Exposes TanStack Query-powered queries and mutations for S3 operations, including list buckets, list objects, upload, download, delete, rename, create folder, presigned URLs, and head object.
- Connection Store: Manages persisted S3 connections and active selection.
- Navigation Store: Tracks current connectionId, bucket, prefix, and navigation history.
- Transfer Store: Tracks uploads/downloads with status and progress.
- Utilities: Formatting helpers and S3 key/name utilities.

**Section sources**
- [s3Client.ts:16-84](file://src/lib/s3Client.ts#L16-L84)
- [s3Client.ts:157-182](file://src/lib/s3Client.ts#L157-L182)
- [useS3.ts:62-417](file://src/hooks/useS3.ts#L62-L417)
- [connectionStore.ts:30-87](file://src/store/connectionStore.ts#L30-L87)
- [navigationStore.ts:36-85](file://src/store/navigationStore.ts#L36-L85)
- [transferStore.ts:28-61](file://src/store/transferStore.ts#L28-L61)
- [utils.ts:13-27](file://src/lib/utils.ts#L13-L27)
- [utils.ts:178-196](file://src/lib/utils.ts#L178-L196)

## Architecture Overview
The S3 integration follows a layered architecture with enhanced Tauri integration:
- UI Layer: App renders the explorer and delegates to stores and hooks.
- Hook Layer: useS3 orchestrates S3 operations using TanStack Query.
- Client Layer: s3Client factory builds provider-aware S3 clients with custom HTTP handler.
- HTTP Handler Layer: Custom Tauri HTTP handler bypasses CORS restrictions for S3-compatible providers.
- State Layer: Stores manage connections, navigation, and transfers.
- Types Layer: Strong typing for all domain models.

```mermaid
sequenceDiagram
participant UI as "UI (App.tsx)"
participant Hook as "useS3.ts"
participant Factory as "s3Client.ts"
participant Handler as "Custom HTTP Handler"
participant Tauri as "Tauri HTTP Plugin"
participant S3 as "S3 Service"
UI->>Hook : "Invoke listObjects(connectionId, bucket, prefix)"
Hook->>Factory : "createS3Client(connection)"
Factory->>Handler : "Configure requestHandler"
Handler->>Tauri : "tauriFetch(url, options)"
Tauri->>S3 : "Native HTTP Request (bypasses CORS)"
S3-->>Tauri : "Response"
Tauri-->>Handler : "Response"
Handler-->>Factory : "Processed Response"
Factory-->>Hook : "S3Client instance"
Hook->>S3 : "ListObjectsV2Command(Bucket, Prefix, Delimiter)"
S3-->>Hook : "ListObjectsResult(items, isTruncated, continuationToken)"
Hook-->>UI : "UseQueryResult<ListObjectsResult>"
```

**Diagram sources**
- [App.tsx:13-94](file://src/App.tsx#L13-L94)
- [useS3.ts:99-152](file://src/hooks/useS3.ts#L99-L152)
- [s3Client.ts:157-182](file://src/lib/s3Client.ts#L157-L182)
- [s3Client.ts:16-84](file://src/lib/s3Client.ts#L16-L84)

## Detailed Component Analysis

### Custom HTTP Handler Implementation
The custom HTTP handler is a critical enhancement that enables S3 operations to work seamlessly across all providers by bypassing CORS restrictions:

- **CORS Bypass**: Routes AWS SDK HTTP requests through Tauri's native HTTP client (plugin-http/reqwest) instead of the browser's fetch, eliminating CORS blocking for S3-compatible providers like Cloudflare R2, Backblaze B2, and MinIO.
- **Request Building**: Mirrors the behavior of @smithy/fetch-http-handler's FetchHttpHandler, building URLs with proper query string encoding, authentication, and path construction.
- **Header Management**: Builds proper Headers object while skipping forbidden "host" header, ensuring compliance with fetch API requirements.
- **Response Processing**: Reads full response body as ArrayBuffer and converts to Uint8Array, building headers object in lowercase format expected by the SDK.
- **Error Handling**: Maintains compatibility with AWS SDK's expected response format, preserving status codes and headers.

```mermaid
flowchart TD
Start(["Custom HTTP Handler"]) --> BuildURL["Build URL with query params & auth"]
BuildURL --> BuildHeaders["Build Headers object (skip 'host')"]
BuildHeaders --> TauriFetch["tauriFetch(url, options)"]
TauriFetch --> ReadBody["Read full response body as ArrayBuffer"]
ReadBody --> ProcessHeaders["Process response headers to lowercase"]
ProcessHeaders --> ReturnResp["Return SDK-compatible response"]
```

**Diagram sources**
- [s3Client.ts:16-84](file://src/lib/s3Client.ts#L16-L84)

**Section sources**
- [s3Client.ts:7-15](file://src/lib/s3Client.ts#L7-L15)
- [s3Client.ts:16-84](file://src/lib/s3Client.ts#L16-L84)

### S3 Client Factory Pattern
The factory encapsulates provider-specific endpoint resolution and client configuration with HTTP handler integration:
- Endpoint Resolution: Based on provider, validates required fields and constructs endpoint URLs.
- Path-Style Addressing: Enables forcePathStyle for non-AWS providers to support MinIO and compatible services.
- Credentials: Injects accessKeyId and secretAccessKey from the connection.
- Region: Defaults to us-east-1 if not provided.
- HTTP Handler: Integrates custom Tauri HTTP handler to bypass CORS restrictions.

```mermaid
flowchart TD
Start(["createS3Client(connection)"]) --> Resolve["resolveEndpoint(connection)"]
Resolve --> HasEndpoint{"Has endpoint?"}
HasEndpoint --> |No| ConfigNoEP["Build config with region + credentials"]
HasEndpoint --> |Yes| ConfigWithEP["Build config with endpoint + credentials"]
ConfigNoEP --> AddHandler["Add custom HTTP handler"]
ConfigWithEP --> AddHandler
AddHandler --> MaybePath["If provider != aws, set forcePathStyle=true"]
MaybePath --> Return["Return new S3Client(config)"]
```

**Diagram sources**
- [s3Client.ts:157-182](file://src/lib/s3Client.ts#L157-L182)

**Section sources**
- [s3Client.ts:101-144](file://src/lib/s3Client.ts#L101-L144)
- [s3Client.ts:157-182](file://src/lib/s3Client.ts#L157-L182)

### Provider-Specific Configurations
- AWS: Uses SDK defaults; region drives endpoint resolution.
- MinIO: Requires endpoint URL; path-style addressing enforced.
- Cloudflare R2: Requires endpoint URL in the form https://{accountId}.r2.cloudflarestorage.com.
- Backblaze B2: Requires endpoint URL or region; if only region is provided, constructs endpoint as https://s3.{region}.backblazeb2.com.
- Custom: Requires endpoint URL.

Validation and error messages are thrown when required fields are missing.

**Section sources**
- [s3Client.ts:111-144](file://src/lib/s3Client.ts#L111-L144)

### Credential Handling
- Access Key ID and Secret Access Key are extracted from the S3Connection and passed to the S3Client constructor.
- No explicit credential refresh or rotation logic is implemented in the factory; rely on the underlying SDK's behavior.

**Section sources**
- [s3Client.ts:160-168](file://src/lib/s3Client.ts#L160-L168)
- [index.ts:38-48](file://src/types/index.ts#L38-L48)

### Endpoint Configuration
- For non-AWS providers, forcePathStyle is enabled to ensure path-style addressing.
- Endpoint is only set when explicitly provided by the connection.

**Section sources**
- [s3Client.ts:171-179](file://src/lib/s3Client.ts#L171-L179)

### Error Handling Strategies
- Validation errors are thrown early during endpoint resolution and folder creation.
- Operation-level errors are thrown when HTTP status codes indicate failure or when DeleteMarker is absent for delete operations.
- Download failures surface HTTP status and message.
- Head object returns metadata without downloading the body.

**Section sources**
- [s3Client.ts:118-122](file://src/lib/s3Client.ts#L118-L122)
- [s3Client.ts:125-127](file://src/lib/s3Client.ts#L125-L127)
- [s3Client.ts:129-133](file://src/lib/s3Client.ts#L129-L133)
- [s3Client.ts:136-138](file://src/lib/s3Client.ts#L136-L138)
- [useS3.ts:274-278](file://src/hooks/useS3.ts#L274-L278)
- [useS3.ts:171-175](file://src/hooks/useS3.ts#L171-L175)
- [useS3.ts:220-224](file://src/hooks/useS3.ts#L220-L224)
- [useS3.ts:248-253](file://src/hooks/useS3.ts#L248-L253)
- [useS3.ts:347-352](file://src/hooks/useS3.ts#L347-L352)

### useS3 Hook: Centralized S3 Operations Hub
The hook exposes TanStack Query queries and mutations for S3 operations:
- Queries
  - listBuckets(connectionId): Lists buckets for a given connection.
  - listObjects(connectionId, bucket, prefix): Lists objects and virtual folders under a prefix.
- Mutations
  - downloadFile(): Downloads via a presigned URL and triggers browser download.
  - uploadFile(): Uploads a file with automatic Content-Type detection.
  - deleteItem(): Deletes an object or folder placeholder.
  - createFolder(): Creates a virtual folder by placing an empty object ending with "/".
  - getPresignedUrl(): Generates a presigned GET URL for an object.
  - renameItem(): Renames an object by copying then deleting.
  - headObject(): Retrieves object metadata without downloading.

```mermaid
classDiagram
class useS3 {
+listBuckets(connectionId)
+listObjects(connectionId, bucket, prefix)
+downloadFile()
+uploadFile()
+deleteItem()
+createFolder()
+getPresignedUrl()
+renameItem()
+headObject()
}
class S3Client {
+send(command)
+requestHandler : CustomHTTPHandler
}
class CustomHTTPHandler {
+handle(request)
+destroy()
}
class S3Connection {
+id
+provider
+endpoint
+region
+accessKeyId
+secretAccessKey
}
useS3 --> S3Client : "creates via factory"
S3Client --> CustomHTTPHandler : "uses for HTTP requests"
useS3 --> S3Connection : "reads from store"
```

**Diagram sources**
- [useS3.ts:62-417](file://src/hooks/useS3.ts#L62-L417)
- [s3Client.ts:157-182](file://src/lib/s3Client.ts#L157-L182)
- [s3Client.ts:16-84](file://src/lib/s3Client.ts#L16-L84)
- [connectionStore.ts:30-87](file://src/store/connectionStore.ts#L30-L87)

**Section sources**
- [useS3.ts:69-85](file://src/hooks/useS3.ts#L69-L85)
- [useS3.ts:99-152](file://src/hooks/useS3.ts#L99-L152)
- [useS3.ts:160-197](file://src/hooks/useS3.ts#L160-L197)
- [useS3.ts:203-235](file://src/hooks/useS3.ts#L203-L235)
- [useS3.ts:240-264](file://src/hooks/useS3.ts#L240-L264)
- [useS3.ts:269-296](file://src/hooks/useS3.ts#L269-L296)
- [useS3.ts:301-320](file://src/hooks/useS3.ts#L301-L320)
- [useS3.ts:327-368](file://src/hooks/useS3.ts#L327-L368)
- [useS3.ts:374-399](file://src/hooks/useS3.ts#L374-L399)

### Data Models and Utilities
- S3Connection: Defines provider, endpoint, region, and credentials.
- S3Item: Represents files, folders, and buckets with metadata.
- Utilities: Formatting helpers and S3 key/name extraction.

```mermaid
erDiagram
S3_CONNECTION {
string id
string name
string provider
string endpoint
string region
string accessKeyId
string secretAccessKey
number createdAt
}
S3_ITEM {
string key
string name
string type
number size
datetime lastModified
string etag
string storageClass
}
```

**Diagram sources**
- [index.ts:38-62](file://src/types/index.ts#L38-L62)
- [index.ts:53-62](file://src/types/index.ts#L53-L62)

**Section sources**
- [index.ts:38-62](file://src/types/index.ts#L38-L62)
- [index.ts:53-62](file://src/types/index.ts#L53-L62)
- [utils.ts:13-27](file://src/lib/utils.ts#L13-L27)
- [utils.ts:178-196](file://src/lib/utils.ts#L178-L196)

## Dependency Analysis
External dependencies relevant to S3 integration with Tauri integration:
- @aws-sdk/client-s3: S3 client library.
- @aws-sdk/s3-request-presigner: Presigned URL generation.
- @tanstack/react-query: Query and mutation orchestration.
- zustand: Local state management for connections, navigation, and transfers.
- @tauri-apps/plugin-http: Tauri native HTTP plugin for CORS bypass.
- tauri-plugin-http: Rust backend for Tauri HTTP functionality.

```mermaid
graph LR
pkg["package.json"] --> aws_client["@aws-sdk/client-s3"]
pkg --> aws_presigner["@aws-sdk/s3-request-presigner"]
pkg --> react_query["@tanstack/react-query"]
pkg --> zustand["zustand"]
pkg --> tauri_http["@tauri-apps/plugin-http"]
cargo["Cargo.toml"] --> rust_http["tauri-plugin-http"]
useS3_ts["useS3.ts"] --> aws_client
useS3_ts --> aws_presigner
useS3_ts --> react_query
useS3_ts --> zustand
s3Client_ts["s3Client.ts"] --> aws_client
s3Client_ts --> tauri_http
s3Client_ts --> rust_http
lib_rs["lib.rs"] --> rust_http
```

**Diagram sources**
- [package.json:12-27](file://package.json#L12-L27)
- [Cargo.toml:20-26](file://src-tauri/Cargo.toml#L20-L26)
- [useS3.ts:1-16](file://src/hooks/useS3.ts#L1-L16)
- [s3Client.ts:1-3](file://src/lib/s3Client.ts#L1-L3)
- [lib.rs:10-14](file://src-tauri/src/lib.rs#L10-L14)

**Section sources**
- [package.json:12-27](file://package.json#L12-L27)
- [Cargo.toml:20-26](file://src-tauri/Cargo.toml#L20-L26)
- [useS3.ts:1-16](file://src/hooks/useS3.ts#L1-L16)
- [s3Client.ts:1-3](file://src/lib/s3Client.ts#L1-L3)
- [lib.rs:10-14](file://src-tauri/src/lib.rs#L10-L14)

## Performance Considerations
- Pagination: listObjects returns isTruncated and continuationToken for incremental loading.
- Virtual Folders: CommonPrefixes are treated as virtual folders to reduce object enumeration overhead.
- Presigned URLs: Prefer presigned URLs for downloads to offload traffic from the app.
- Path-Style Addressing: Enabling forcePathStyle ensures compatibility with MinIO and compatible services; consider endpoint latency and DNS resolution.
- Query Invalidation: Use query invalidation to refresh cached results after mutations.
- HTTP Handler Efficiency: Custom HTTP handler eliminates CORS overhead and provides consistent performance across all S3-compatible providers.

**Section sources**
- [useS3.ts:145-149](file://src/hooks/useS3.ts#L145-L149)
- [s3Client.ts:174-179](file://src/lib/s3Client.ts#L174-L179)
- [App.tsx:35-40](file://src/App.tsx#L35-L40)

## Troubleshooting Guide
Common issues and resolutions:
- Missing Endpoint for Non-AWS Providers: Ensure endpoint is provided for MinIO, R2, and B2; otherwise, factory throws an error.
- Missing Region for Backblaze B2: Provide region when endpoint is not supplied.
- Invalid Folder Name: Folder creation rejects empty names or names containing "/".
- HTTP Errors During Operations: Inspect thrown errors for HTTP status codes and messages; adjust permissions or endpoint configuration accordingly.
- Download Failures: Verify presigned URL validity and network connectivity.
- CORS Issues: The custom HTTP handler automatically bypasses CORS restrictions for S3-compatible providers.
- Tauri Plugin Not Found: Ensure tauri-plugin-http is properly installed and configured in Cargo.toml.
- Native HTTP Plugin Not Available: Verify that the Tauri HTTP plugin is enabled in lib.rs and tauri.conf.json.

**Section sources**
- [s3Client.ts:118-122](file://src/lib/s3Client.ts#L118-L122)
- [s3Client.ts:125-127](file://src/lib/s3Client.ts#L125-L127)
- [s3Client.ts:129-133](file://src/lib/s3Client.ts#L129-L133)
- [s3Client.ts:136-138](file://src/lib/s3Client.ts#L136-L138)
- [useS3.ts:274-278](file://src/hooks/useS3.ts#L274-L278)
- [useS3.ts:171-175](file://src/hooks/useS3.ts#L171-L175)
- [useS3.ts:220-224](file://src/hooks/useS3.ts#L220-L224)
- [useS3.ts:248-253](file://src/hooks/useS3.ts#L248-L253)
- [useS3.ts:347-352](file://src/hooks/useS3.ts#L347-L352)

## Conclusion
S3 Explorer's S3 integration centers around a robust client factory with a custom HTTP handler that leverages Tauri's native HTTP plugin to bypass CORS restrictions. The factory handles provider-specific endpoints and credentials, while the hook provides a unified API for listing and manipulating S3 resources. The custom HTTP handler ensures seamless operation across all S3-compatible providers including Cloudflare R2, Backblaze B2, and MinIO. The architecture leverages TanStack Query for caching and invalidation, Zustand for local state, and strong TypeScript types for safety. By following the guidelines below, developers can configure providers, implement custom endpoints, and optimize performance and reliability.

## Appendices

### How to Configure Different S3 Providers
- AWS
  - Leave endpoint unset; the SDK resolves the endpoint from region.
  - Provide accessKeyId and secretAccessKey.
- MinIO
  - Provide endpoint URL (e.g., http://localhost:9000).
  - Provide accessKeyId and secretAccessKey.
- Cloudflare R2
  - Provide endpoint URL in the form https://{accountId}.r2.cloudflarestorage.com.
  - Provide accessKeyId and secretAccessKey.
- Backblaze B2
  - Either provide endpoint URL or region; if only region is provided, the factory constructs the endpoint.
  - Provide accessKeyId and secretAccessKey.
- Custom
  - Provide endpoint URL.
  - Provide accessKeyId and secretAccessKey.

**Section sources**
- [s3Client.ts:111-144](file://src/lib/s3Client.ts#L111-L144)
- [index.ts:38-48](file://src/types/index.ts#L38-L48)

### Authentication Best Practices
- Store credentials securely; avoid embedding secrets in client-side code.
- Rotate credentials regularly and update connections accordingly.
- Use least-privilege policies for accessKeyId and secretAccessKey.

**Section sources**
- [s3Client.ts:160-168](file://src/lib/s3Client.ts#L160-L168)
- [index.ts:38-48](file://src/types/index.ts#L38-L48)

### Implementing Custom Endpoints
- For non-AWS providers, ensure endpoint is set and forcePathStyle is enabled.
- Validate endpoint reachability and DNS resolution.
- Test with a small subset of operations before scaling.

**Section sources**
- [s3Client.ts:171-179](file://src/lib/s3Client.ts#L171-L179)

### Retry Mechanisms
- The current implementation does not include built-in retries.
- Consider integrating retry policies at the TanStack Query level or wrapping commands with retry logic as needed.

**Section sources**
- [useS3.ts:1-16](file://src/hooks/useS3.ts#L1-L16)

### Tauri HTTP Handler Configuration
To enable the custom HTTP handler functionality:

1. **Install Dependencies**:
   ```bash
   npm install @tauri-apps/plugin-http
   ```

2. **Add to Cargo.toml**:
   ```toml
   [dependencies]
   tauri-plugin-http = "2"
   ```

3. **Enable Plugin in lib.rs**:
   ```rust
   #[cfg_attr(mobile, tauri::mobile_entry_point)]
   pub fn run() {
       tauri::Builder::default()
           .plugin(tauri_plugin_opener::init())
           .plugin(tauri_plugin_http::init())  // Enable HTTP plugin
           .invoke_handler(tauri::generate_handler![greet])
           .run(tauri::generate_context!())
           .expect("error while running tauri application");
   }
   ```

4. **Configure in tauri.conf.json**:
   ```json
   {
     "plugins": {
       "http": {
         "enabled": true
       }
     }
   }
   ```

**Section sources**
- [Cargo.toml:20-26](file://src-tauri/Cargo.toml#L20-L26)
- [lib.rs:10-14](file://src-tauri/src/lib.rs#L10-L14)
- [tauri.conf.json:1-40](file://src-tauri/tauri.conf.json#L1-L40)

### Example Workflows

#### Listing Objects Under a Prefix
```mermaid
sequenceDiagram
participant UI as "UI"
participant Hook as "useS3.listObjects"
participant Factory as "createS3Client"
participant Handler as "Custom HTTP Handler"
participant Tauri as "Tauri HTTP Plugin"
participant S3 as "S3 Service"
UI->>Hook : "listObjects(connectionId, bucket, prefix)"
Hook->>Factory : "createS3Client(connection)"
Factory->>Handler : "Configure requestHandler"
Handler->>Tauri : "tauriFetch(url, options)"
Tauri->>S3 : "Native HTTP Request"
S3-->>Tauri : "Response"
Tauri-->>Handler : "Response"
Handler-->>Factory : "Processed Response"
Factory-->>Hook : "S3Client"
Hook->>S3 : "ListObjectsV2Command(Bucket, Prefix, Delimiter)"
S3-->>Hook : "Items + Truncation"
Hook-->>UI : "ListObjectsResult"
```

**Diagram sources**
- [useS3.ts:99-152](file://src/hooks/useS3.ts#L99-L152)
- [s3Client.ts:157-182](file://src/lib/s3Client.ts#L157-L182)
- [s3Client.ts:16-84](file://src/lib/s3Client.ts#L16-L84)

#### Uploading a File
```mermaid
sequenceDiagram
participant UI as "UI"
participant Hook as "useS3.uploadFile"
participant Factory as "createS3Client"
participant Handler as "Custom HTTP Handler"
participant Tauri as "Tauri HTTP Plugin"
participant S3 as "S3 Service"
UI->>Hook : "uploadFile({ connectionId, bucket, prefix, file })"
Hook->>Factory : "createS3Client(connection)"
Factory->>Handler : "Configure requestHandler"
Handler->>Tauri : "tauriFetch(url, options)"
Tauri->>S3 : "Native HTTP Request"
S3-->>Tauri : "Response"
Tauri-->>Handler : "Response"
Handler-->>Factory : "Processed Response"
Factory-->>Hook : "S3Client"
Hook->>S3 : "PutObjectCommand(Bucket, Key, Body, ContentType)"
S3-->>Hook : "Response"
Hook-->>UI : "void"
```

**Diagram sources**
- [useS3.ts:203-235](file://src/hooks/useS3.ts#L203-L235)
- [s3Client.ts:157-182](file://src/lib/s3Client.ts#L157-L182)
- [s3Client.ts:16-84](file://src/lib/s3Client.ts#L16-L84)

#### Downloading a File via Presigned URL
```mermaid
sequenceDiagram
participant UI as "UI"
participant Hook as "useS3.downloadFile"
participant Factory as "createS3Client"
participant S3 as "S3 Service"
UI->>Hook : "downloadFile({ connectionId, bucket, key })"
Hook->>Factory : "createS3Client(connection)"
Factory-->>Hook : "S3Client"
Hook->>S3 : "getSignedUrl(GetObjectCommand)"
S3-->>Hook : "presigned URL"
Hook->>S3 : "fetch(URL)"
S3-->>Hook : "Blob"
Hook-->>UI : "Trigger browser download"
```

**Diagram sources**
- [useS3.ts:160-197](file://src/hooks/useS3.ts#L160-L197)
- [s3Client.ts:157-182](file://src/lib/s3Client.ts#L157-L182)