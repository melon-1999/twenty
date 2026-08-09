# 08 — Frontend Integration

Goal (§16): a disabled capability meaningfully disappears — nav, routes, settings, command menu, actions — not greyed out. Reuse Twenty's existing metadata-driven surfaces; add the minimum.

## The one hook

`useIsCapabilityEnabled(ProductCapabilityKey)` — reads `currentWorkspaceState.enabledCapabilities`, pure client lookup (mirror of `useIsFeatureEnabled`). All frontend gating goes through it, so checks stay centralized (§13).

## Object-backed capabilities — mostly free

Enabling/disabling toggles `ObjectMetadata.isActive`, which **already** removes the object from:
- **Main nav object list** — `object-metadata/hooks/useFilteredObjectMetadataItems.ts` (`isActive && !isSystem`).
- **Quick-create / add-to-nav picker** — `getAvailableObjectMetadataForNewSidebarItem.ts` (`isActive`).
- **Command menu / record actions** — items resolve against active object metadata; `CommandMenuItem` records with `availabilityObjectMetadataId` on an inactive object drop out.
- **Search, filters, record routes** — resolve against active metadata; `/objects/:objectNamePlural` won't resolve an inactive object.

So Dashboards/Products/Reports/custom objects need **no new frontend code** — just the `isActive` toggle.

## Non-object capabilities — one predicate each

Email, Calendar, Automations, AI have settings pages, routes, and sometimes command actions but no single object. Add `useIsCapabilityEnabled` at the existing gate points:

- **Settings nav** — `settings/hooks/useSettingsNavigationItems.tsx` already computes `isHidden` per item mixing `useIsFeatureEnabled`/`useHasPermissionFlag`/clientConfig. Add `&& useIsCapabilityEnabled(key)` to the relevant items (Accounts/Emails/Calendars → Email/Calendar; Workflows → Automations; AI → AI Assistant). One line each.
- **Settings routes** — `SettingsProtectedRouteWrapper` already supports `settingsPermission` + optional `requiredFeatureFlag`. Add an optional `requiredCapability` prop; on fail `<Navigate>` (same pattern). Wrap the capability's route group.
- **App routes** (e.g. AI chat page) — gate the lazy route element with `useIsCapabilityEnabled` (as `AiChatPage` already gates on `IS_AI_CHAT_PAGE_ENABLED`) → render an unavailable/redirect state ([17-route-protection]).
- **Command menu** — the pipeline in `command-menu-item/contexts/CommandMenuContextProviderContent.tsx` is built to accept another `.filter()` predicate. Add a `doesCommandMenuItemMatchCapability` predicate (map an item's object/engine key → capability) OR encode a capability term in the item's `conditionalAvailabilityExpression`. Prefer the pipeline predicate for capabilities not tied to a single object.
- **Record actions / side panel** — same `CommandMenuItem` filter; inherits the added predicate.
- **Dashboards/widgets, onboarding, keyboard shortcuts** — gate the specific surface with the hook where a capability owns it.

## Surfaces summary

| Surface | Existing mechanism | Change for capabilities |
|---|---|---|
| Main nav objects | `useFilteredObjectMetadataItems` (`isActive`) | none (object-backed) |
| Quick-create picker | `getAvailableObjectMetadataForNewSidebarItem` (`isActive`) | none |
| Command menu / actions | `CommandMenuContextProviderContent` filter chain | +1 predicate (non-object caps) |
| Settings nav | `useSettingsNavigationItems` inline `isHidden` | +`useIsCapabilityEnabled` on relevant items |
| Settings routes | `SettingsProtectedRouteWrapper` | +`requiredCapability` prop |
| App routes | lazy element + existing flag checks | +hook gate + redirect |
| Object routes/search/filters | metadata resolution | none (object-backed) |

## Why this is minimal

The bulk of "disappearing" is delivered by `isActive` (which Twenty already wires everywhere) plus one hook used at a handful of existing, already-conditional gate points. No new nav framework, no per-component rewrites.
