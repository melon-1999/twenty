# 12 — Apps, SDK & Extensibility

## 1. The "Application" concept

A Twenty **App** is a **standalone npm package** (not part of the server codebase) that extends a running instance. It is a **bundle of declarative metadata entities plus code**, enumerated by the `Manifest` type (`packages/twenty-shared/src/application/manifestType.ts`):

`application` (identity/marketplace), `objects`/`fields`/`indexes` (data model), `views`/`viewFields`/`pageLayouts`/`pageLayoutTabs` (UI), `navigationMenuItems`/`commandMenuItems`, `frontComponents` (custom React UI), `logicFunctions` (serverless code), `agents`/`skills` (AI), `roles`/`permissionFlags` (RBAC), `connectionProviders` (OAuth), `publicAssets`, `translations`.

`ApplicationManifest` (`applicationType.ts`) carries `displayName`, `defaultRoleUniversalIdentifier`, `applicationVariables`/`serverVariables`, install/uninstall hooks (`postInstallLogicFunction`, `preInstallLogicFunction`, `uninstallLogicFunction`), `settingsFrontComponent`, integrity fields (`packageJsonChecksum`, `requiredServerVersionRange`).

**Definition = pure TypeScript** (no YAML). Entry `src/application-config.ts` calling `defineApplication({...})`; every entity in its own file exporting a `define*()` call. **Universal identifiers** (`src/constants/universal-identifiers.ts`) are stable UUIDs that survive renames/version bumps, letting the sync diff engine map local definitions to server metadata.

**Installation**: the CLI builds → manifest + code → tarball → uploads to the server's registration endpoint → the server **syncs the manifest into a workspace** (creating/updating flat metadata + running metadata migrations). Backend `twenty-server/src/engine/core-modules/application/` — `application-install/`, `application-manifest/application-sync.service.ts` + `application-manifest-apply.service.ts` + `application-manifest-migration.service.ts`, upload receiver `application-registration/`. Apps install **per workspace**.

## 2. twenty-sdk (SDK + CLI)

`packages/twenty-sdk` (npm `twenty-sdk`) is **both the SDK and the working CLI** (`bin twenty → dist/cli.cjs`). Subpath exports: `./define`, `./front-component`, `./logic-function`, `./billing`, `./utils`, `./cli`, `./front-component-renderer`.

**Definition API** `twenty-sdk/define` (`src/sdk/define/index.ts`): `defineApplication`, `defineObject`, `defineField`, `defineIndex`, `defineView`, `defineViewField`, `definePageLayout`/`definePageLayoutTab`, `defineFrontComponent`/`defineSettingsFrontComponent`, `defineLogicFunction` (+ pre/post-install/uninstall variants), `defineAgent`, `defineSkill`, `defineRole`/`defineApplicationRole`, `definePermissionFlag`, `defineNavigationMenuItem`, `defineCommandMenuItem`, `defineConnectionProvider`. Each is a **build-time validation factory** returning a `ValidationResult`. Objects declare inline `fields[]`; fields support scalar + composite types + relations.

**Logic-function runtime SDK** `twenty-sdk/logic-function`: what runs *inside* a deployed function — `getConnection`/`listConnections`/`findConnectionForRequest` (OAuth), `runAgent` (invoke an AI agent), `enqueueJob`, `kv` (per-app key/value store), `Response` (HTTP), typed trigger payloads (`CronPayload`, `RoutePayload`, `DatabaseEventPayload`). These reach the workspace **via GraphQL** (`post-graphql-request.util.ts`), not the DB directly.

## 3. twenty-client-sdk (API client for integrations)

`packages/twenty-client-sdk` — three client surfaces + a generator:
- `./core` → `CoreApiClient` (typed GraphQL over workspace records).
- `./metadata` → `MetadataApiClient` (object/field metadata).
- `./rest` → `RestApiClient` (thin REST wrapper; understands app-route prefix `/s/`).
- `./generate` → codegen (`generateCoreClientFromSchema`/`generateMetadataClient`) using a vendored fork of **genql** to turn a workspace's GraphQL schema string into fully typed TS. The typed client is **generated per workspace/schema** so custom objects/fields become first-class typed queries.

## 4. Front components (sandboxed custom UI)

Custom UI = **front components**: React components via `defineFrontComponent({universalIdentifier, name, component})`. Rendering is **heavily sandboxed** (Shopify Remote DOM), two isolation layers (`packages/twenty-front-component-renderer`):
1. Host renders `FrontComponentRenderer.tsx`, mounting a **sandboxed `<iframe>`**.
2. Inside the iframe a **Web Worker** executes the app's component code. Host↔iframe via `postMessage`; host↔worker via `MessageChannel`.
3. The worker builds a **Remote DOM tree** reconciled on the host against a **fixed component registry** (`host/generated/host-component-registry`) — only whitelisted HTML tags + `twenty-ui` primitives.
4. DOM polyfills only — app code has no real `document`/`window`.
5. **Network gated** — fetches restricted to allowed origins (component URL, apiUrl, functionsBaseUrl).

Consequence: front components can't touch `document`/`window`, must import UI from `twenty-ui`, and fetch data through `twenty-client-sdk/core`. Host APIs (navigation, snackbars, side panels, selected-record ids) proxied through `twenty-sdk/front-component`.

## 5. Serverless logic functions & custom endpoints

`defineLogicFunction({universalIdentifier, name, timeoutSeconds, handler, <trigger>})`. `LogicFunctionManifest` (`twenty-shared/src/application/logicFunctionManifestType.ts`) supports **six triggers**: `httpRouteTriggerSettings` (custom HTTP endpoint), `serverRouteTriggerSettings` (webhook-style resolver, single auth point, URL carries only the resolver UID), `cronTriggerSettings`, `databaseEventTriggerSettings`, `toolTriggerSettings` (expose as AI agent tool), `workflowActionTriggerSettings`.

Backend `twenty-server/src/engine/core-modules/logic-function/`: driver factory selects `lambda.driver.ts` (AWS Lambda, prod isolation), `local.driver.ts` (child-process, self-host/dev), or `disabled.driver.ts`. User code compiled/wrapped by bundled `constants/builder`/`executor` with a common dependency layer + SDK layer. Triggers dispatched by `logic-function-trigger/` (route/cron/database-event). Custom HTTP endpoints exposed via `server-route-trigger/server-route-trigger.controller.ts` (public `/s/…`, matching client-SDK `/s/` prefix).

**Code-interpreter** is separate (Python for AI/office docs, e2b/local drivers) — see [09-AI-SYSTEM.md](09-AI-SYSTEM.md).

## 6. Example apps

`packages/twenty-apps`: `examples/` (hello-world, document-generator, postcard), `public/` (slack, discord, linear, exa, fireflies, people-data-labs, …), `internal/`, `fixtures/`.
- **hello-world** — minimal reference: custom object + field + view + front component (queries a company via `CoreApiClient`) + logic functions (HTTP-triggered `hello-world.ts`, install hooks) + agent + skill + role + nav item + page layout + install test.
- **document-generator** — AI + document flow: `defineAgent` with a `generate-document` tool, objects, page layouts, command-menu action, `RoutePayload` HTTP function.
- **slack** (public) — full breadth: ~16 logic functions (route/event/tool triggers), OAuth `connection-providers/`, agent, roles, objects, indexes, front components.

## 7. Extend without forking vs requires core fork

**Extensible via apps/SDK (zero core changes):** new objects/fields/relations/indexes, views/page-layouts, nav + command-menu entries, custom UI panels & settings tabs (sandboxed), server-side logic (HTTP/cron/db-event/webhook/tool/workflow-action), AI agents & skills, RBAC (roles/permission flags), OAuth connection providers, app KV state + background jobs, install/uninstall hooks, external integrations via `twenty-client-sdk`, translations & marketplace metadata. All ship as a self-contained npm package, published to npm or a private server registry, installed per-workspace.

**Requires forking core (`twenty-server`/`twenty-front`):** new field data types / composite types (type system is server-side), new front-component host primitives (fixed `host-component-registry`), new trigger types / logic-function drivers, new code-interpreter drivers/sandbox scripts, new manifest entity kinds / sync semantics, core object schema / GraphQL resolvers / auth / SSO / billing, new host runtime APIs for front components.

**Rule of thumb:** data, views, sandboxed UI, server logic, AI, permissions, connections → build an app with `twenty-sdk` + `twenty-client-sdk`. Change the *platform's capabilities themselves* → fork core. Full table in [24-EXTENSION-VS-CORE.md](24-EXTENSION-VS-CORE.md).

**Anchor files:** `twenty-sdk/src/sdk/define/index.ts`, `twenty-sdk/src/cli/cli.ts`, `twenty-shared/src/application/{manifestType,applicationType,logicFunctionManifestType}.ts`, `twenty-client-sdk/src/{core,metadata,rest,generate}/index.ts`, `twenty-front-component-renderer/src/host/components/FrontComponentRenderer.tsx`, `twenty-server/src/engine/core-modules/application/`, `.../logic-function/`, `twenty-apps/examples/hello-world/`.
