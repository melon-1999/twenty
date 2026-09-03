# Web Forms / Lead Capture — Design

Date: 2026-09-03
Status: approved (Slice A in scope for this cycle; Slice B deferred to a follow-up cycle)

## Goal

Let a workspace publish hosted web forms that turn public submissions into pipeline
records automatically. A visitor fills a form on a shareable URL (or embedded iframe);
each submission creates a contact and a deal (plus company and a note in Slice B), so
leads flow into the pipeline instead of being entered by hand.

No new metadata object and no migration: form definitions are stored as workspace config
(KeyValuePair), mirroring the existing monthly-goal / probability config pattern.

## Scope

### Slice A (this cycle)
- Config storage for a list of forms (KeyValuePair `WEB_FORMS`).
- Authenticated settings resolver (read + write the forms array).
- Settings UI under the Opportunity object: list forms, create / edit / delete, copy the
  public form URL.
- Public REST controller (`PublicEndpointGuard`): fetch a form's public shape, and submit.
- Submission creates **Person + Opportunity** only.
- Public form-render page on an unauthenticated route.
- Spam protection: hidden honeypot field + IP throttle.

### Slice B (deferred, separate spec/plan cycle)
- Company field: create-or-link company by name (dedup), link to Person + Opportunity.
- Message field: create a Note linked to the deal.
- Person dedup by email; Company dedup by name.
- Optional captcha (reuse existing captcha module; no-op unless `CAPTCHA_DRIVER` set).
- iframe embed snippet in settings (copyable `<iframe>` code) + polish.

Field set: the full form is first name, last name, email (required), phone, job title,
company, message, identical for every form. Slice A renders and persists only the core
fields (first name, last name, email, phone, job title) plus the Opportunity, to avoid
collecting data it would silently drop. The company and message inputs are added in Slice B
together with the records they create.

## Data model / config

Config stored via `KeyValuePairService` under key `WEB_FORMS`, `userId: null`,
`type: CONFIG_VARIABLE`, value:

```
{ forms: WebForm[] }

WebForm = {
  id: string            // uuid, generated on create
  title: string
  description: string    // shown above the form
  enabled: boolean
  stage: string          // target Opportunity stage value, default 'NEW'
  dealNameTemplate: string  // e.g. "Web-Lead: {firstName} {lastName}"
  thankYouText: string
}
```

`dealNameTemplate` placeholders resolved server-side: `{firstName}`, `{lastName}`,
`{email}`. Unknown placeholders left as-is. Empty resulting name falls back to a default
("Web-Lead").

## Server

### Config resolver (authenticated) — Slice A
Mirror `OpportunityMonthlyGoalConfig` triplet:
- `WebFormConfigService` (KeyValuePairService get/set of the `{ forms }` value; `get`
  returns `{ forms: [] }` when unset).
- `@MetadataResolver` `WebFormConfigResolver`:
  - query `webForms` → `GraphQLJSON`, guard `NoPermissionGuard`.
  - mutation `updateWebForms(input.value)` → `GraphQLJSON`, guard
    `SettingsPermissionGuard(PermissionFlagType.DATA_MODEL)`.
  - class-level `WorkspaceAuthGuard` + `ResolverValidationPipe`.
- Module registered in `core-engine.module.ts` next to the other config modules.

The resolver stores the whole `forms` array (create/edit/delete are computed on the
frontend, persisted as a full-array replace) — same blank-save-safety concern as
monthly-goal (guard the settings UI so an un-loaded state cannot wipe the array).

### Public controller — Slice A
New `WebFormPublicController`, guarded only by `PublicEndpointGuard` + `NoPermissionGuard`
(same shape as `WorkflowTriggerController`), trusting `workspaceId` in the path:

- `GET /forms/:workspaceId/:formId`
  - Verify workspace exists (`workspaceRepository.existsBy`).
  - Load `WEB_FORMS` config for that workspace, find the form by id.
  - If missing or `enabled === false` → 404.
  - Return public shape only: `{ title, description, thankYouText }` (never the stage,
    template, or other forms).

- `POST /forms/:workspaceId/:formId/submit`
  - Body: `{ firstName, lastName, email, phone, jobTitle, _hp }` (Slice A core fields; `_hp`
    = honeypot).
  - Honeypot: if `_hp` non-empty → return 200 success (silently drop, do not create).
  - Throttle: `ThrottlerService.tokenBucketThrottleOrThrow` keyed by client IP; on
    exhaustion → 429.
  - Validate: email present and syntactically valid, else 400.
  - Resolve the form from config (must exist + enabled), else 404.
  - Build `buildSystemAuthContext(workspaceId)`.
  - Create records via `CreateRecordService.execute` with
    `rolePermissionConfig: { shouldBypassPermissionChecks: true }` and
    `createdBy` source appropriate for automation:
    1. Person: `name` = { firstName, lastName }, `emails` = primary email, `phones` =
       phone if present, `jobTitle` if present.
    2. Opportunity: `name` = resolved template, `stage` = form.stage, `pointOfContactId` =
       new person id. No amount.
  - Atomicity: if any create throws, the whole submission fails with 500 and no partial
    lead is reported as success. (Best-effort; true transactional rollback across
    CreateRecordService calls is out of scope — a failure after Person-create may leave an
    orphan Person. Acceptable for MVP; noted as a known limitation.)
  - Success → 200 `{ ok: true }`.

`WebFormSubmissionService` encapsulates the record-creation logic (unit-testable with a
mocked CreateRecordService); the controller handles honeypot/throttle/validation/HTTP.

### Modules
- `WebFormConfigModule` (config service + resolver) registered in `core-engine.module.ts`.
- `WebFormPublicModule` (controller + submission service) wired where the public
  controllers live (same module registration path as `WorkflowTriggerController`).

## Frontend

### Settings (authenticated) — Slice A
- `SettingsPath.ObjectWebForms = 'objects/:objectNamePlural/web-forms'`.
- Route in `SettingsRoutes.tsx` (before the catch-all), inside the object-detail group.
- List page `SettingsObjectOpportunityWebForms`: `SettingsPageLayout` breadcrumb, a table of
  forms (title, enabled, public URL), "Neues Formular" button, per-row edit + delete.
- Edit page (or inline editor): title, description, target stage (select from Opportunity
  stage options), deal-name template, thank-you text, enabled toggle. Save → `updateWebForms`
  with the full array.
- Public URL display: `<instanceOrigin>/forms/<workspaceId>/<formId>` with a copy button.
- Hooks `useWebForms` / `useUpdateWebForms` (plain `gql` on the default Apollo client,
  mirroring the monthly-goal hooks).
- Gated link in `ObjectSettings.tsx` (Opportunity only), next to Rotting / Probability /
  Goal: "Web-Formulare".
- Skeleton-gate the settings state so a blank-load save cannot wipe the forms array.

### Public form page (unauthenticated) — Slice A
- `AppPath.WebFormPage = '/forms/:workspaceId/:formId'`.
- Registered as an unauthenticated route in both the root and workspace routers, alongside
  the existing auth-flow routes (SignInUp / Invite), using a blank/auth-flow layout (no
  sidebar, no workspace chrome). This is the Invite token-in-URL precedent extended.
- On mount: `fetch` `GET /forms/:workspaceId/:formId`. On 404 → a simple "Formular nicht
  gefunden" state.
- Render: title, description, core inputs (Vorname, Nachname, E-Mail\*, Telefon, Jobtitel),
  a visually-hidden honeypot input, submit button.
- On submit: client-validate required email, `fetch` `POST .../submit`, on success show the
  form's thank-you text; on 429 a friendly "zu viele Anfragen" message; on other errors a
  generic failure message.
- Styling: minimal, centered card, works standalone and inside an iframe.

## Testing

- `WebFormSubmissionService`: unit tests with a mocked `CreateRecordService` — asserts the
  Person and Opportunity payloads (name composite, email, phone/jobTitle optional omission,
  template resolution incl. fallback, stage passthrough, pointOfContact wiring).
- Template resolver: unit tests for placeholder substitution + empty fallback.
- Config service: get-returns-empty-when-unset + set round-trip (mirror monthly-goal tests).
- Controller honeypot / throttle / validation branches: covered where practical (or
  documented as verified via live-verify, per the fork's precedent of no controller-level
  tests for the workflow-trigger analog).
- Live-verify end-to-end against the dev DB: create a form in settings, open the public
  URL, submit, confirm Person + Opportunity created with correct fields, honeypot rejects,
  disabled form 404s.

## Non-goals / known limitations
- No multi-currency / amount capture on the form (deal created without amount).
- No true cross-record transactional rollback (best-effort; orphan Person possible on a
  mid-submission failure).
- Company + Note + dedup + captcha + iframe snippet are Slice B.
- Public endpoint trusts `workspaceId` in the URL (same trust model as the existing public
  workflow-trigger controller); honeypot + IP throttle are the Slice A defenses.
