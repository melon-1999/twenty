# 22 — Feature Flows

Real end-to-end traces through the stack. Server paths under `packages/twenty-server/src`, front under `packages/twenty-front/src`.

## A. Creating a CRM record

```mermaid
sequenceDiagram
  participant UI as RecordTable / create hook
  participant Store as record-store (Jotai)
  participant Apollo as Apollo core client
  participant MW as Middlewares (auth + ALS)
  participant DE as DirectExecution
  participant QR as Common query runner
  participant ORM as twenty-orm
  participant Ev as EntityEventsToDbListener
  UI->>Store: optimistic upsert
  UI->>Apollo: createOne<Object> (mutation from generateCreateOneRecordMutation)
  Apollo->>MW: POST /graphql (Bearer)
  MW->>DE: workspace-scoped request
  DE->>QR: create-one resolver factory → CommonCreateOneQueryRunner
  QR->>ORM: WorkspaceRepository.insert (schema workspace_<id>, permission check)
  ORM->>Ev: emit ObjectRecordCreateEvent (batch)
  Ev-->>Ev: enqueue webhook + workflow-trigger + audit jobs
  ORM-->>UI: created record → cache + record store
```
Front files: `object-record/hooks/useCreateOneRecord.ts` → `generateCreateOneRecordMutation` (`object-metadata/utils/`). Server: create-one resolver factory → `common-query-runners` → `twenty-orm`. Writes emit events → `entity-events-to-db.listener.ts` → jobs.

## B. Creating a custom field (metadata → schema → API → UI)

```mermaid
flowchart TD
  A["Settings > Data model UI\ncreate field"] --> B["POST /metadata createOneField\n(ObjectMetadataResolver / FieldMetadataResolver, SettingsPermissionGuard DATA_MODEL)"]
  B --> C["FieldMetadataService.createOne → FlatFieldMetadata"]
  C --> D["WorkspaceMigrationValidateBuildAndRun\n+ side-effect expansion (unique index, view field, search vector)"]
  D --> E["Migration runner (one tx):\nINSERT fieldMetadata row (core)\n+ ALTER TABLE workspace_<id>.<object> ADD COLUMN"]
  E --> F["commit → incrementMetadataVersion\n+ invalidate ORMEntityMetadatas / graphQLResolverNameMap / flat maps"]
  F --> G["next /graphql: schema + resolvers regenerated\n(field now selectable)"]
  G --> H["frontend polls metadataVersion → metadata store refetch\n→ enriched metadata → new column/field component renders"]
```
Key files: `metadata-modules/field-metadata/`, `metadata-modules/metadata-side-effect/`, `workspace-manager/workspace-migration/` (see [07](07-METADATA-ENGINE.md)), front `object-metadata/states/objectMetadataItemsWithFieldsSelector.ts` + `useColumnDefinitionsFromObjectMetadata.ts`.

## C. Running a workflow

```mermaid
flowchart LR
  T["Trigger: DB event / cron / webhook / manual"] --> J["WorkflowTriggerJob (workflowQueue)\nverify ACTIVE published version"]
  J --> R["WorkflowRunnerWorkspaceService.run\n(throttle → create WorkflowRun → RunWorkflowJob)"]
  R --> X["RunWorkflowJob: build code steps, RUNNING,\nexecute trigger.nextStepIds"]
  X --> S["WorkflowExecutor: per action via factory,\nresolve inputs from context, write stepInfos under @WithLock,\nfollow nextStepIds / branch / loop, re-chunk >20 steps"]
  S --> E["endWorkflowRun → COMPLETED/FAILED/STOPPED\nstate.stepInfos + stepLogs; SSE updates run diagram"]
```
DB-event path: a record write (flow A) → `entity-events-to-db.listener.ts` enqueues `CallDatabaseEventTriggerJobsJob` on `triggerQueue`, and `workflow-database-event-trigger.listener.ts` matches watched fields + record filter → `WorkflowTriggerJob`. Full detail in [08](08-WORKFLOWS.md).

## D. AI chat interaction

```mermaid
flowchart LR
  U["sendChatMessage (agent-chat.resolver, PermissionFlagType.AI)"] --> V["validate model + credits →\nAgentChatStreamingService: persist msg, enqueue aiStreamQueue"]
  V --> W["StreamAgentChatJob → ChatExecutionService.streamChat\n(build tools + system prompt + resolve model)"]
  W --> P["external LLM via SdkProviderFactory"]
  P --> L["streamText loop: model calls learn_tools/execute_tool/load_skill/CRUD\n→ ToolExecutorService.dispatch → record-crud/static/logic-function"]
  L --> C["chunks tee'd: DB checkpoints + Redis events"]
  C --> F["onAgentChatEvent SSE → useAgentChatSubscription →\nreadUIMessageStream → chat UI"]
```
CRUD tools execute under the acting role's `RolePermissionConfig` (same enforcement as flow A). Full detail in [09](09-AI-SYSTEM.md).

## E. Email sync (background)

```mermaid
flowchart LR
  O["Connect Gmail/Microsoft (APIs OAuth)"] --> A["create connected account + message channel\n+ enqueue first sync"]
  A --> Cron["MessagingMessageListFetchCronJob (cronQueue, */5)\n→ MessagingMessageListFetchJob (messagingQueue)"]
  Cron --> Imp["MessagingMessagesImportJob:\nprovider dispatch (Gmail/Graph/IMAP) → persist messages/threads"]
  Imp --> Push["Push subscription (users.watch / Graph)\n→ inbound webhook marks channel for re-sync"]
```
Requires the worker. Full detail in [14](14-INTEGRATIONS.md) + [15](15-BACKGROUND-JOBS.md).

## F. Login (password) → workspace access

```mermaid
flowchart LR
  A["getLoginTokenFromCredentials\n(validateLoginWithPassword)"] --> B["login token"]
  B --> C["client /verify → getAuthTokensFromLoginToken\n→ AuthService.verify"]
  C --> D["access token (workspace-scoped) + refresh token (AppToken)\n+ cookie session"]
  D --> E["front: useLoadCurrentUser populates\ncurrentUser/currentWorkspace/currentUserWorkspace (permissions)"]
```
2FA (if enabled) inserts an OTP step before token exchange. SSO/OAuth follows `signInUpWithSocialSSO`. Full detail in [10](10-AUTH-PERMISSIONS.md).
