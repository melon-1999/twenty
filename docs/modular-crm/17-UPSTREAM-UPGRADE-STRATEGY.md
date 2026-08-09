# 17 — Upstream / Upgrade Strategy

Minimize changes to Twenty core (§26). Prefer additive; track unavoidable edits; never touch `@license Enterprise` files.

## Additive (new files — no upstream conflict risk)

- `twenty-shared`: `ProductCapabilityKey` enum + capability types.
- `twenty-server`: `product-capability/` module — catalog constant, `ProductCapabilityCatalogService`, `WorkspaceCapabilityEntity`, `WorkspaceCapabilityService`, `capabilitiesMap` cache provider, `@RequireCapability` guard, resolver/mutations, migration command.
- `twenty-front`: `useIsCapabilityEnabled` hook, `enabledCapabilities` state wiring, Settings → Features page + components.

## Small edits to existing files (track carefully)

| File | Edit | Risk |
|---|---|---|
| `WorkspaceEntity` / workspace resolver | add `enabledCapabilities` resolve-field (mirror `enabledAiModelIds`) | low |
| workspace cache key list | add `capabilitiesMap` key | low |
| `currentWorkspace` GraphQL fragment (front) | add `enabledCapabilities` | low |
| `useSettingsNavigationItems.tsx` | add `useIsCapabilityEnabled` to relevant `isHidden` | low (localized) |
| `SettingsProtectedRouteWrapper.tsx` | add optional `requiredCapability` prop | low (additive prop) |
| `SettingsRoutes.tsx` | wrap capability route groups | low |
| `CommandMenuContextProviderContent.tsx` | add one `doesCommandMenuItemMatchCapability` predicate | medium (hot path; mirror existing predicates) |
| workspace creation service | call `initializeForWorkspace` | low |
| new-workspace object seeding | ensure object-backed defaults align | low |

All edits are additive-in-place (new prop, new filter, new field) — they don't rewrite existing logic, keeping merge conflicts minimal.

## Never touched (Enterprise-licensed — legal + upstream)

`billing/`, `enterprise/`, `sso/`, RLS, audit-logs, and any `/* @license Enterprise */` file. We only **consume** `BillingService.hasEntitlement` from AGPL code (a public method call), never modify these files.

## Reuse-first checklist (before editing any upstream file — §26)

Ask: can this go through the existing feature system / plan system / app framework / metadata (`isActive`) / a hook / a wrapper / config / DI / a service abstraction instead? For this design the answers are mostly "yes" (metadata `isActive`, existing guards/hooks patterns), which is why the upstream surface is small.

## Upgrade risk rating

- **Low overall.** New module is self-contained; the ~9 in-place edits are localized, additive, and mirror existing patterns. The one medium item (command-menu predicate) sits on a hot path but follows the established `doesCommandMenuItemMatch*` shape the pipeline is built to extend.
- **Biggest single dependency risk:** reliance on `ObjectMetadata.isActive` semantics ([16](16-TESTING.md) go/no-go test). If Twenty changes how `isActive` gates schema/nav upstream, object-backed capabilities are affected — mitigate by keeping the effect behind `WorkspaceCapabilityService` so the mechanism can be swapped without touching capability definitions.

## Keeping in sync with upstream Twenty

- Track the small edited-file set explicitly (this table) so rebases focus there.
- Prefer contributing the generic capability layer upstream if feasible (it's a broadly useful feature), reducing long-term fork divergence.
