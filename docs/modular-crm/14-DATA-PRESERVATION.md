# 14 — Data Preservation

Product principle (§24): **disabling a capability must not delete its data.** Re-enabling restores access to prior data.

## Guarantee

`WorkspaceCapabilityService.setEnabled(ws, key, false)` **never** deletes rows, drops tables, or runs a destructive migration. It only hides.

## How it holds for each capability type

- **Object-backed** (Dashboards, future Products/Reports, custom objects): disabling sets `ObjectMetadata.isActive=false`. The object's **table and rows remain** in the workspace schema; only visibility/schema-exposure changes. Re-enabling sets `isActive=true` → the object and all its records reappear. *(Verify: deactivation must not drop the table nor run a data-destructive migration — [16](16-TESTING.md) test; if Twenty's deactivate path is ever destructive, we must interpose a non-destructive hide instead.)*
- **Guarded / non-object** (Email, Calendar, Automations, AI): disabling flips the capability flag + hides UI + backend guard denies. **No data is touched** — synced messages, calendar events, workflows/runs, AI threads all remain in their tables. Re-enabling restores access.

## Explicit contrast with the app system

The **application uninstall** path is destructive (CASCADE deletes the app's objects and data). We deliberately do **not** use it for capability disable ([07](07-APPS-AND-MODULES.md)). Capability disable ≠ app uninstall.

## Re-enable semantics

- Object-backed: prior records are exactly as left (no re-sync needed).
- Email/Calendar: prior synced data intact; new sync resumes if the provider is still connected.
- Automations: existing workflow definitions + run history intact; triggers resume.
- AI: threads/history intact.

## Edge cases / documented deviations

- **Field/relation integrity:** disabling Deals (never happens — core) would orphan Products' relations; the dependency model ([10](10-DEPENDENCIES.md)) prevents disabling a depended-on capability, avoiding orphan states.
- **Storage cost:** hidden data still consumes storage — acceptable and expected; users can still export/delete via normal means if they choose.
- If any capability ever genuinely requires destructive teardown on disable, that must be an explicit, documented, user-confirmed exception — none is anticipated in the current catalog.

## User-facing messaging (§13)

The Settings UI states plainly: "Disabling hides this and its data. Nothing is deleted — re-enable anytime." This sets correct expectations and is the product promise behind the principle.
