# 06 — Feature Flags vs Capabilities

Why feature flags and product capabilities are **separate systems**, and what we reuse.

## Feature flags today (recap from [01](01-EXISTING-TWENTY-FEATURE-SYSTEMS.md))

- `FeatureFlagKey` per-workspace booleans (`core.featureFlag`). 13 keys; only 5 are user-facing "Lab" opt-ins. The rest are internal migration/dev/rollout flags (`IS_WORKFLOW_VERSION_IN_CORE_ENABLED`, `IS_UNIQUE_INDEXES_ENABLED`, `IS_REST_METADATA_API_NEW_FORMAT_DIRECT`, …).
- Semantics: **experiments, rollout, beta, dev toggles.** No dependencies, no plan mapping, no human-meaningful catalog, default OFF, toggled in Settings → Lab or the admin panel.

## Why not repurpose them for modules

- **Semantic mismatch:** flags are temporary/experimental; capabilities are permanent product areas. Conflating them muddies both (a "module" would sit next to `IS_UNIQUE_INDEXES_ENABLED`).
- **No catalog/deps/availability:** flags are flat booleans; capabilities need categories, dependencies, and commercial availability.
- **Different lifecycle:** a flag is expected to be removed when a rollout completes; a capability persists.
- **Different audience/UX:** Lab = "try experimental stuff"; Features = "configure my product".

## What we reuse from the feature-flag system

- **Storage pattern:** `(key, workspaceId)` unique boolean → `WorkspaceCapabilityEntity` copies it.
- **Cache pattern:** `featureFlagsMap` `@WorkspaceCache` → `capabilitiesMap`.
- **Guard pattern:** `FeatureFlagGuard`/`@RequireFeatureFlag` → `@RequireCapability`.
- **Hook pattern:** `useIsFeatureEnabled` → `useIsCapabilityEnabled`.
- **Delivery pattern:** on `currentWorkspace` → `enabledCapabilities`.

So capabilities are "feature flags done for permanent product modules" — same mechanics, different semantics, separate store and UI.

## Coexistence

- Feature flags stay exactly as they are (Lab + internal).
- Some current Lab flags are de-facto capabilities (List View, Calendar week view, AI chat page). **Optional future step:** graduate a stabilized Lab feature into the capability catalog and retire its flag. Not required for the initial layer; noted as a migration path.
- A capability's *implementation* may still internally read a feature flag during its own rollout — the two can nest without merging.

## Rule of thumb

> If it's an **experiment/rollout/beta/dev** toggle → feature flag. If it's a **permanent product module** a user would recognize and pay for → capability.
