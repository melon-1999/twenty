# 01 — Existing Twenty Feature / Pricing / Gating Systems

What Twenty has **before** any modular-CRM change. Source: targeted code investigation. All paths under `packages/`. This is the source of truth the architecture reuses.

## 1. Feature flags — per-workspace boolean (experiment/Lab)

- **Entity** `twenty-server/src/engine/core-modules/feature-flag/feature-flag.entity.ts` — `core.featureFlag`, columns `key: FeatureFlagKey`, `value: boolean`, `workspaceId`; **unique `(key, workspaceId)`** → one boolean per (flag, workspace). Absent row = off.
- **Keys** `twenty-shared/src/types/FeatureFlagKey.ts` — 13 keys. Only **5 are public/Lab** (user-toggleable): `IS_AI_CHAT_PAGE_ENABLED`, `IS_CALENDAR_WEEK_VIEW_ENABLED`, `IS_JUNCTION_RELATIONS_ENABLED`, `IS_LIST_VIEW_ENABLED`, `IS_SETTINGS_DISCOVERY_HERO_ENABLED` (`feature-flag/constants/public-feature-flag.const.ts`). The rest are internal migration/dev flags.
- **Service/cache** `feature-flag.service.ts` (`isFeatureEnabled`, `enableFeatureFlags`, `upsertWorkspaceFeatureFlag`); cache `workspace-feature-flags-map-cache.service.ts` (`featureFlagsMap`, `@WorkspaceCache`).
- **Backend guard** `engine/guards/feature-flag.guard.ts` — `@RequireFeatureFlag(key)`.
- **Frontend** `twenty-front/src/modules/workspace/hooks/useIsFeatureEnabled.ts` reads `currentWorkspace.featureFlags`. Lab page `settings/lab/` toggles public flags (mutation guarded by `SettingsPermissionGuard(WORKSPACE)`). Catalog delivered via `clientConfig.publicFeatureFlags`.
- **Defaults** new workspace seeds only `DEFAULT_FEATURE_FLAGS = [IS_REST_METADATA_API_NEW_FORMAT_DIRECT]`; **all product/Lab flags default OFF**.
- **Semantics:** experiments / rollout / opt-in Lab. No plan mapping, no dependencies, no catalog of product modules.

## 2. Billing entitlements — per-workspace boolean (commercial, Enterprise-licensed)

- **Keys** `billing/enums/billing-entitlement-key.enum.ts` — exactly 4: `SSO`, `CUSTOM_DOMAIN`, `RLS`, `AUDIT_LOGS`.
- **Entity** `billing/entities/billing-entitlement.entity.ts` — `core.billingEntitlement`, unique `(key, workspaceId)`, `value: boolean`, Stripe-synced via `billing-webhook/services/billing-webhook-entitlement.service.ts` (Stripe entitlement summary events).
- **Plans/products** `BillingPlanKey` = `PRO`, `ENTERPRISE`; `BillingProductKey` = `BASE_PRODUCT`, `RESOURCE_CREDIT`. Prices/products **synced from Stripe** (no hardcoded pricing). Plan stored in `subscription.metadata.plan`.
- **Resolution/enforcement** `billing.service.ts` `hasEntitlement(workspaceId, key)`: **if `!isBillingEnabled()` returns `true`** (self-hosted bypass) else DB lookup. Enforcement is **imperative** in feature services (SSO `sso.service.ts`, custom domain `custom-domain-manager.service.ts`, RLS webhook side-effect). **No `BillingGuard`/`@BillingProtect`.** Billing mutations guarded by `SettingsPermissionGuard(BILLING)`.
- **Enterprise** `core-modules/enterprise/` (`EnterprisePlanService.isValid()` via `ENTERPRISE_KEY`/validity token) — **instance-scoped licensing**, seats counted per distinct user across the instance. `EnterpriseFeaturesEnabledGuard`.
- **Frontend** `currentWorkspace.billingEntitlements [{key,value}]`; consumed inline (e.g. `SettingsLogs.tsx` AUDIT_LOGS, RLS in role form). Plan hooks `settings/billing/hooks/useCurrentBillingFlags.ts` (`isProPlan`/`isEnterprisePlan`).
- **LICENSE:** all billing/enterprise/SSO/RLS/audit-log code is `/* @license Enterprise */` (commercial). **Must be consumed, never modified, by AGPL core.**

## 3. Applications — per-workspace bundle (packaging; core CRM is an app)

- **Entity** `application/application.entity.ts` — `core.application`, `universalIdentifier` unique per workspace, `canBeUninstalled`, `autoUpgrade`, `defaultRoleId`; `OneToMany` to `objects/fields/agents/logicFunctions/frontComponents/commandMenuItems/applicationVariables` — all `onDelete: CASCADE`.
- **Ownership** `SyncableEntity` (base of every syncable metadata entity) has `applicationId` (ManyToOne, CASCADE). **Every object/field/view/nav-item/role/permission-flag belongs to exactly one application.**
- **Core CRM = the "Standard" application** (`TWENTY_STANDARD_APPLICATION`, universalIdentifier `20202020-…cee20`), seeded per workspace with `canBeUninstalled: false`. Custom objects → the "Custom" app.
- **Manifest** (`twenty-shared/src/application/manifestType.ts`) lets an app register: objects, fields, indexes, views, viewFields, pageLayouts, navigationMenuItems, commandMenuItems, frontComponents, logicFunctions, agents, skills, roles, permissionFlags, connectionProviders, translations.
- **Lifecycle** install (`application-install.service.ts`) / sync (`application-sync.service.ts`, metadata diff → workspace migration) / uninstall (destructive, guarded by `canBeUninstalled`). **No `isEnabled`/soft-disable column.** `PermissionFlagType.APPLICATIONS`/`MARKETPLACE_APPS` gate who installs.

## 4. Permissions / roles — per-user (not per-workspace capability)

- **`PermissionFlagType`** `twenty-shared/src/constants/PermissionFlagType.ts` — 24 flags: settings (API_KEYS_AND_WEBHOOKS, WORKSPACE, WORKSPACE_MEMBERS, ROLES, DATA_MODEL, SECURITY, WORKFLOWS, IMPERSONATE, SSO_BYPASS, APPLICATIONS, MARKETPLACE_APPS, LAYOUTS, BILLING, AI_SETTINGS) + tool (AI, VIEWS, UPLOAD_FILE, DOWNLOAD_FILE, SEND_EMAIL_TOOL, CREATE_CALENDAR_EVENT_TOOL, HTTP_REQUEST_TOOL, CODE_INTERPRETER_TOOL, IMPORT_CSV, EXPORT_CSV, CONNECTED_ACCOUNTS, PROFILE_INFORMATION).
- **Levels:** permission flags + object-level (`ObjectPermissionEntity`) + field-level (`FieldPermissionEntity`) + row-level (RLS predicates, Enterprise). Roles assignable to users/agents/API keys.
- **Frontend** `currentUserWorkspace.permissionFlags/objectsPermissions`; `useHasPermissionFlag`, `useObjectPermissions`. **Backend** `SettingsPermissionGuard(flag)`; ORM `permissions.utils.ts`.
- **Scope: per-user via role.** Wrong axis for "workspace has module X"; correct for "user may use X".

## 5. Object metadata activation — per-workspace, data-preserving, object-granular

- `ObjectMetadata.isActive` (default false), `isSystem`, `isUIEditable`, `isUICreatable`; ownership via `applicationId`.
- **Frontend nav** `object-metadata/hooks/useFilteredObjectMetadataItems.ts`: `activeNonSystemObjectMetadataItems = isActive && !isSystem`, further filtered by `canReadObjectRecords`. Deactivating an object **removes it from nav, quick-create and the command menu** (all read this set), **without deleting data**.
- **Command menu / record actions** are metadata-driven `CommandMenuItem` records (`isActive`, `availabilityType` [FALLBACK/GLOBAL/GLOBAL_OBJECT_CONTEXT/RECORD_SELECTION], `availabilityObjectMetadataId`, `conditionalAvailabilityExpression` [expr-eval-fork]). Filter pipeline `command-menu-item/contexts/CommandMenuContextProviderContent.tsx` chains `doesCommandMenuItemMatch*` predicates + `evaluateConditionalAvailabilityExpression` — designed to accept another `.filter()`.
- **Routes** generic/metadata-driven (`useCreateWorkspaceAppRouter.tsx`: single `/objects/:objectNamePlural` resolved against active metadata) — not per-object.

## 6. Deployment config — instance-scoped (cloud vs self-hosted)

- `twenty-config/config-variables.ts` product-relevant `IS_*` (all **instance-global**): `IS_BILLING_ENABLED` (default false), `IS_MULTIWORKSPACE_ENABLED` (false), `MESSAGING_PROVIDER_GMAIL/MICROSOFT_ENABLED`, `CALENDAR_PROVIDER_GOOGLE/MICROSOFT_ENABLED`, `IS_IMAP_SMTP_CALDAV_ENABLED`, `IS_MAPS_AND_ADDRESS_AUTOCOMPLETE_ENABLED`, `IS_ONBOARDING_AI_CHAT_ENABLED`, `AUTH_*_ENABLED`, `LOGIC_FUNCTION_TYPE`, `CODE_INTERPRETER_TYPE`, `AI_PROVIDERS`, etc.
- **`clientConfig`** (`client-config/`): ~40 fields → fanned into ~37 Jotai atoms (`client-config/states/*`): `billingState`, `isMultiWorkspaceEnabledState`, `isGoogleMessagingEnabledState`, `isImapSmtpCaldavEnabledState`, `aiModelsState`, `labPublicFeatureFlagsState`, `canManageFeatureFlagsState`, etc.
- **Cloud** (billing+multiworkspace on) vs **self-hosted free** (both off; enterprise features need `ENTERPRISE_KEY`).

## 7. Precedents for a per-workspace "enabled list"

- **`workspace.enabledAiModelIds: string[]`** (+ `useRecommendedModels`) on `WorkspaceEntity` — the **strongest precedent**: a per-workspace array of enabled IDs, exposed on `currentWorkspace`, read by `useWorkspaceAiModelAvailability`. A per-workspace enabled-capabilities list would follow this exact pattern.
- Workspace boolean columns (`isGoogleAuthEnabled`, `isPasswordAuthEnabled`, `isPublicInviteLinkEnabled`, `isCustomDomainEnabled`, `isInternalMessagesImportEnabled`, `allowImpersonation`, …) — narrow per-workspace toggles.
- **`KeyValuePairEntity`** (`core.keyValuePair`, jsonb, scoped by `(key, workspaceId)` / user / application) — generic per-workspace settings store; candidate for module toggles without a migration.

## Conclusion

Twenty already provides: two per-workspace boolean-capability systems (feature flags, billing entitlements), a per-workspace data-preserving object-hide lever (`isActive` + metadata-driven nav/actions), an app-bundle ownership boundary, a full per-user permission model, and instance-scoped deployment config. **What is missing** is a coordinating *product-capability* layer with a human-meaningful catalog, dependencies, and unified availability/enabled/authorized resolution. See [02-ARCHITECTURE.md](02-ARCHITECTURE.md).
