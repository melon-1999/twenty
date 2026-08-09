# 09 — Backend Enforcement

Rule (§18, §35): UI hiding is not security. Where a capability is a real access boundary, the backend enforces it. Reuse Twenty's existing enforcement layers.

## Enforcement path

```
Request → auth (workspace resolved, ALS) → availability (hasEntitlement/config)
       → capability enabled (capabilitiesMap) → user permission (roles/object perms) → business logic
```

## Object-backed capabilities — enforced by schema exclusion (free)

When a capability's objects are `isActive=false`, they are excluded from the **per-workspace GraphQL schema** (generated from active object metadata). Result: `findManyProducts`/`createProduct` etc. **do not exist** in that workspace's API — GraphQL, REST (both funnel through the same common query runners), and MCP all deny access by absence, not by a check. This is strong, uniform enforcement with no new code. *(Assumption to verify — [02](02-ARCHITECTURE.md) Risks; if false, fall back to a guard as below.)*

Object/field/row permissions (existing) continue to apply on top for active objects.

## Non-object capabilities — `@RequireCapability` guard

Email, Calendar, Automations, AI expose resolvers/controllers/jobs not tied to a single object. Add `@RequireCapability(ProductCapabilityKey)` (mirror `FeatureFlagGuard`):
- Reads `request.workspace.id`, resolves via cached `capabilitiesMap`, throws `ForbiddenException` if disabled.
- Apply to: the capability's GraphQL resolvers and REST controllers, **and** its background jobs / workflow actions / webhook handlers / integration entry points (the paths §18/§35 enumerate). E.g. Automations → workflow trigger/run jobs check the capability before executing; Email → messaging sync jobs and send resolvers.
- Compose with existing guards (`WorkspaceAuthGuard`, `SettingsPermissionGuard`) — capability guard sits alongside, not replacing, permission checks.

## All access paths covered (§35)

| Path | Enforcement |
|---|---|
| GraphQL (`/graphql`) | object-backed: schema absence; non-object: `@RequireCapability` on resolver |
| REST (`/rest`) | same common query runners → same result; controller guard for non-object |
| MCP (`/mcp`) | routes through record-crud/common runners → object absence; capability check for tools |
| Background jobs / workflows | `@RequireCapability` at the processor / action entry (don't rely on producer-side checks) |
| Webhooks / integrations | capability check in the inbound handler / the outbound job |
| Direct service calls | services call `WorkspaceCapabilityService.isEnabled` where they are a capability boundary |

## Availability vs enabled vs permission (don't conflate)

- **Availability** (commercial/deployment) may already be enforced by the existing feature service (e.g. `BillingService.hasEntitlement` for SSO). The capability guard checks **enabled**; it does not re-implement entitlement checks — it composes with them.
- **Permission** stays in roles/ORM. The capability guard is a *third* gate, not a replacement.

## Performance (§34)

`capabilitiesMap` is a `@WorkspaceCache` value resolved once per workspace and reused within the request (ALS workspace context), like `featureFlagsMap`. No per-check DB query. Toggling invalidates the map.

## Security review checklist (§35)

- [ ] Non-object capability resolvers/controllers carry `@RequireCapability`.
- [ ] Their jobs/workflow-actions/webhook handlers check the capability at execution (not only enqueue).
- [ ] Object-backed enforcement verified: inactive object absent from schema (test in [16](16-TESTING.md)).
- [ ] Cached `capabilitiesMap` invalidated on toggle (no stale-enable window).
- [ ] Capability guard composes with, never bypasses, permission guards.
