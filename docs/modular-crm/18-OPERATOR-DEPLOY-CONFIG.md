# Operator Guide — Per-Deployment Module Configuration

This guide is for the **operator** (the vendor deploying Twenty per customer). It explains how to decide, per deployment, which optional product modules a customer has — set once at deploy time via environment variables, immutable by the customer.

See the model rationale in [`docs/superpowers/specs/2026-08-11-deploy-config-module-provisioning-design.md`](../superpowers/specs/2026-08-11-deploy-config-module-provisioning-design.md).

## The flags

Five optional modules are each gated by one boolean environment variable. All default to `true` — an unconfigured deployment behaves exactly as stock Twenty. Set a flag to `false` to remove that module from the deployment.

| Env var | Module | When `false` |
|---|---|---|
| `IS_DASHBOARDS_MODULE_ENABLED` | Dashboards | Dashboards object hidden from nav; dashboard/chart endpoints denied |
| `IS_EMAIL_MODULE_ENABLED` | Email (connected inbox) | Emails settings section hidden; message-channel/folder/send endpoints denied |
| `IS_CALENDAR_MODULE_ENABLED` | Calendar (connected calendar) | Calendars settings section hidden; calendar-channel/event endpoints denied |
| `IS_AUTOMATIONS_MODULE_ENABLED` | Automations (Workflows) | Workflow object hidden from nav; workflow endpoints + workflow AI tools denied |
| `IS_AI_ASSISTANT_MODULE_ENABLED` | AI Assistant (chat/agent) | AI settings + Ask-AI panel hidden; agent chat/run endpoints denied |

Properties (all five):

- **`isEnvOnly`** — settable ONLY via the environment. There is no admin-panel or database override, so the customer cannot change or view it. This is the customer-immutable guarantee.
- **Default `true`** — omit the var entirely to keep the module enabled (stock behavior).
- **Boolean** — accepted values `true` / `false`.

## How it is enforced (Level A)

When a flag is `false`, on this deployment:

- **Server denies the module's discrete endpoints** — the relevant GraphQL resolvers throw `Module "<MODULE>" is not available on this deployment` (`FORBIDDEN`). This is the real boundary; it does not depend on the frontend.
- **Frontend hides the module** — nav items, settings routes, object-nav entries, and trigger surfaces are removed, so the customer never sees the feature.

**Accepted limitation:** raw record CRUD via the generic dynamic GraphQL resolver, background sync/cron jobs, and a few shared plumbing endpoints (e.g. connected-account/OAuth shared between Email and Calendar, the generic `rest/ai` text-generation endpoint) are not individually gated. This is intentional and safe: the deployment is operator-controlled, and when a module is off no data/workflows exist for those paths to act on. It is not a customer-reachable way to use a disabled module through the UI.

The flags are independent — disabling Email does not affect Calendar, disabling AI Assistant does not affect Automations, etc.

## Setting flags per customer (Docker Compose)

The production compose file (`packages/twenty-docker/docker-compose.yml`) passes configuration into the containers through each service's `environment:` block. The module flags must reach the container environment (they are `isEnvOnly`, read from `process.env`), so add them to the `environment:` block of **both** the `server` and `worker` services.

Give each customer their own `.env` (or their own compose override) and set only the flags you want to turn off. Example — a customer that gets Dashboards + Email + Calendar, but NOT Automations or AI Assistant:

`.env` for that customer:

```
# Modules this customer does NOT get (omit a flag to keep it enabled)
IS_AUTOMATIONS_MODULE_ENABLED=false
IS_AI_ASSISTANT_MODULE_ENABLED=false
```

Then reference them in the `server` and `worker` `environment:` blocks of `docker-compose.yml` (mirroring how other vars like `SERVER_URL` are wired):

```yaml
services:
  server:
    environment:
      # ... existing vars ...
      IS_DASHBOARDS_MODULE_ENABLED: ${IS_DASHBOARDS_MODULE_ENABLED:-true}
      IS_EMAIL_MODULE_ENABLED: ${IS_EMAIL_MODULE_ENABLED:-true}
      IS_CALENDAR_MODULE_ENABLED: ${IS_CALENDAR_MODULE_ENABLED:-true}
      IS_AUTOMATIONS_MODULE_ENABLED: ${IS_AUTOMATIONS_MODULE_ENABLED:-true}
      IS_AI_ASSISTANT_MODULE_ENABLED: ${IS_AI_ASSISTANT_MODULE_ENABLED:-true}

  worker:
    environment:
      # ... existing vars ...
      IS_DASHBOARDS_MODULE_ENABLED: ${IS_DASHBOARDS_MODULE_ENABLED:-true}
      IS_EMAIL_MODULE_ENABLED: ${IS_EMAIL_MODULE_ENABLED:-true}
      IS_CALENDAR_MODULE_ENABLED: ${IS_CALENDAR_MODULE_ENABLED:-true}
      IS_AUTOMATIONS_MODULE_ENABLED: ${IS_AUTOMATIONS_MODULE_ENABLED:-true}
      IS_AI_ASSISTANT_MODULE_ENABLED: ${IS_AI_ASSISTANT_MODULE_ENABLED:-true}
```

The `:-true` default keeps each module enabled when its var is absent from the customer's `.env`. Setting the flags on the `server` service is what gates the API and the frontend (via clientConfig); setting them on `worker` too keeps background jobs consistent.

Restart the stack for changes to take effect:

```bash
docker compose up -d
```

Changing a flag requires a restart — it is deploy-time config, not a runtime toggle.

## Verifying a deployment

- **Frontend:** the disabled module's nav/settings/object entry is absent. `GET /client-config` on the server returns the flag values (e.g. `isEmailModuleEnabled: false`) — this is what the frontend reads to hide surfaces.
- **Backend:** calling a disabled module's guarded resolver returns a `FORBIDDEN` error with message `Module "<MODULE>" is not available on this deployment` (requires an authenticated request; use the running app or an authenticated GraphQL client).
- **Boot:** the server boots identically with any combination of flags; there is no schema or migration impact.

## Notes

- **`.env.example`** (`packages/twenty-server/.env.example` and `packages/twenty-docker/.env.example`) lists all five flags, commented, as documentation.
- **Re-enabling** a module is lossless — set the flag back to `true` (or remove it) and restart; no data was destroyed while it was off.
- These flags are **availability** (what the deployment offers), a separate axis from per-workspace feature flags, billing entitlements, and user permissions. The per-workspace capability toggle (`WorkspaceCapabilityEntity` + `updateWorkspaceCapability`) is dormant/deprecated and is NOT the gate — deploy config is.
