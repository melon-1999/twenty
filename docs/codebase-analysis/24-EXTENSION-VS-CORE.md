# 24 — Extension vs Core Modification

Twenty has a first-class app/SDK extension system. The key decision: **build an app** (npm package, installed per workspace, zero core changes) vs **fork core** (`twenty-server`/`twenty-front`). See [12](12-APPS-SDK-EXTENSIBILITY.md).

## Decision table

| Goal | Twenty App / SDK | Core modification | Both possible |
|------|:---:|:---:|:---:|
| Add custom objects / fields / relations / indexes | ✅ | ✅ | ✅ (app preferred) |
| Add a **new field data type / composite type** | ❌ | ✅ | |
| Add views / page layouts / view fields | ✅ | ✅ | ✅ |
| Add navigation + command-menu entries | ✅ | ✅ | ✅ |
| Add custom UI panel / settings tab (sandboxed) | ✅ | ✅ (host primitive) | ✅ |
| Add a **new front-component host primitive** | ❌ | ✅ | |
| Add server-side logic (HTTP/cron/db-event/webhook/tool/workflow-action) | ✅ (logic function) | ✅ | ✅ |
| Add a **new logic-function driver / trigger type** | ❌ | ✅ | |
| Add AI agents / skills | ✅ | ✅ | ✅ |
| Add a **new AI provider** | ❌ | ✅ | |
| Add an AI tool | ✅ (logic-function tool) | ✅ (ToolProvider) | ✅ |
| Add RBAC roles / permission flags | ✅ | ✅ | ✅ |
| Add OAuth/3rd-party connection providers | ✅ | ✅ | ✅ |
| Add app KV state / background jobs (app-scoped) | ✅ | — | |
| Add a **core queue / worker infra** | ❌ | ✅ | |
| External integration reading/writing CRM data | ✅ (`twenty-client-sdk`) | ✅ | ✅ |
| Translations / marketplace metadata | ✅ | ✅ | |
| Change **core object schema / GraphQL resolvers / auth / SSO / billing** | ❌ | ✅ | |
| Add a **new manifest entity kind / change sync semantics** | ❌ | ✅ | |
| Add a **new code-interpreter driver / sandbox script** | ❌ | ✅ | |

## Why this split exists

The metadata engine makes **data, views, permissions, and server logic** first-class configurable entities that sync into a workspace. So anything expressible as metadata + sandboxed code + logic functions is an app concern. Anything that changes **what the platform can express** — the field-type system, the front-component host registry, the execution drivers, the manifest schema, the sync engine, core auth/billing — is baked into the server/front code and requires a fork.

## When to avoid forking

Fork only when you must change platform capabilities. For per-customer customization (custom objects, dashboards, automations, integrations, custom UI, AI agents), **build an app** — it survives Twenty upgrades, ships as a versioned npm package, and installs per workspace without touching core. Forking core means you own merge conflicts against a fast-moving, metadata-heavy codebase (see [25](25-RISKS-AND-COMPLEXITY.md)) forever.

## App capability quick reference (`twenty-sdk/define`)

`defineApplication`, `defineObject`, `defineField`, `defineIndex`, `defineView`, `defineViewField`, `definePageLayout`/`definePageLayoutTab`, `defineFrontComponent`/`defineSettingsFrontComponent`, `defineLogicFunction` (+ install/uninstall hooks), `defineAgent`, `defineSkill`, `defineRole`/`defineApplicationRole`, `definePermissionFlag`, `defineNavigationMenuItem`, `defineCommandMenuItem`, `defineConnectionProvider`. Runtime (inside a logic function): `getConnection`, `runAgent`, `enqueueJob`, `kv`, `Response`.
