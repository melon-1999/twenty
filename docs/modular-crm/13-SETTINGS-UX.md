# 13 — Settings UX

A simple admin surface for workspace owners to enable/disable capabilities. Naming: **Settings → Features** (avoid the word "modules"/"capabilities" for end users — §20).

## Placement & access

- New settings section "Features", gated `useHasPermissionFlag(PermissionFlagType.WORKSPACE)` (workspace admin) — same boundary as the Lab flag mutation. Added to `useSettingsNavigationItems` with `isHidden: !hasWorkspacePermission`.
- Route under `/settings/features`, wrapped in `SettingsProtectedRouteWrapper settingsPermission={WORKSPACE}`.

## Layout (grouped by catalog category)

```
CRM
  ✓ Contacts        Always on
  ✓ Companies       Always on
  ✓ Deals           Always on
  ✓ Activities      Always on
  ☑ Dashboards      Reports & charts over your records

Communication
  ☑ Email           Sync Gmail/Outlook, see emails on records      (available)
  ☐ Calendar        Sync your calendar and meetings                (available)

Automation
  ☐ Automations     Trigger actions when things change

AI
  ☐ AI Assistant    Chat and let AI do data entry
```

- **Core** capabilities render as "Always on" (toggle shown, locked) — never disable (§25).
- **Available** capabilities render an enabled toggle.
- **Unavailable** (missing entitlement/config) render disabled with an explanation ("Requires email provider setup by your admin" / "Available on the X plan") + upgrade link where commercial — reuse `SettingsEnterpriseFeatureGateCard` pattern for commercial gates.
- Reuse the existing `SettingsOptionCardContentToggle` component (used by the Lab page) for visual consistency.

## Per-capability info shown (§20)

- name, short description (plain language, no "metadata engine" jargon)
- status (on / off / unavailable + reason)
- dependencies ("Needs Deals")
- **consequences of disabling** ("Your product data is kept and hidden; re-enable anytime") — reinforce data preservation (§24)

## Interaction

- Toggling calls `setEnabled` (mutation guarded by `WORKSPACE`).
- Dependency prompts (from [10](10-DEPENDENCIES.md)): enabling → "also enable Deals?"; disabling a depended-on capability → "also disable Products?" with confirm/cancel.
- Optimistic update of `currentWorkspace.enabledCapabilities` on success (like the Lab toggle updates `featureFlags`).

## What we do NOT show

- No internal keys, no `isActive`, no application/manifest terms, no capability catalog internals. End users see product names + toggles only. (Power-user/admin detail can live in the admin panel later.)

## Presets (optional, later — §36)

A future "Quick setup" could offer presets (Freelancer / Sales / Agency) that set a bundle of toggles. Not built now; the toggle grid is the MVP.
