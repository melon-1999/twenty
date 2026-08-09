# 07 — Apps & Modules

How installed **Applications** relate to **product capabilities**. They are separate concepts that share the metadata substrate.

## Applications today (recap)

- `ApplicationEntity` per workspace; every syncable metadata entity (object/field/view/nav/role/permission-flag/logic-function/front-component/command-menu-item) belongs to exactly one app via `SyncableEntity.applicationId` (CASCADE).
- **Core CRM is the "Standard" application** (seeded per workspace, `canBeUninstalled: false`); custom objects belong to the "Custom" app.
- Lifecycle: **install / uninstall only**. Uninstall is **destructive** (runs a to-empty migration → CASCADE deletes the app's objects and their data). **No soft enable/disable flag** on `ApplicationEntity`.
- `PermissionFlagType.APPLICATIONS`/`MARKETPLACE_APPS` gate who may install/manage apps.

## Why core capabilities are NOT modeled as installable apps

- Apps have **no non-destructive disable** — the only "off" is uninstall, which deletes data. That violates §24 (disabling must preserve data).
- Core CRM is one app (Standard) containing many objects; we need capability granularity *within* it (enable Deals, disable Dashboards) — the app boundary is too coarse.
- Install/uninstall runs a metadata migration — far heavier than a toggle for everyday product configuration.

## How they relate instead

- A **capability** is a catalog concept above the metadata. For object-backed capabilities, its effect is to toggle `ObjectMetadata.isActive` on objects **that already belong to the Standard app** — reusing app-owned metadata without using the app lifecycle. So we leverage the app-ownership model without forcing capabilities into install/uninstall.
- **Third-party installed apps remain a fully separate concept.** They add their own objects/UI/functions per workspace and are managed via the marketplace. They are not capabilities.

## Future bridge (optional, not now)

- An installed app could **declare capabilities it provides** in its manifest (a new optional field), and enabling/disabling those could map to activating/deactivating the app's objects (same `isActive` mechanism) — giving apps a non-destructive on/off without changing their install lifecycle. This is a clean future extension, explicitly out of scope for the initial layer.
- Conversely, a future "capability = pre-installed-but-toggleable app grouping" model would require adding a soft-disable to the app system; we rejected that as the *primary* design (heavier, still object-granular via migrations) but it remains a possible convergence if the app system later gains a soft-disable.

## Summary

| Concept | Boundary | Lifecycle | Data on "off" | Our use |
|---|---|---|---|---|
| Application (third-party) | app package | install / uninstall (destructive) | deleted (CASCADE) | separate; unchanged |
| Application (Standard/Custom) | core/custom metadata owner | seeded, non-uninstallable | n/a | source of the objects a capability toggles |
| Product capability | human-meaningful module | enable / disable (non-destructive) | **preserved** | the new layer |

See [09](09-BACKEND-ENFORCEMENT.md) for how object-backed capabilities enforce via `@RequireCapability` (`isActive` is UI-hide + data preservation only), and [14](14-DATA-PRESERVATION.md) for the data guarantee.
