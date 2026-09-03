# Web Forms / Lead Capture — Slice B Design

Date: 2026-09-03
Status: approved
Builds on: `2026-09-03-opportunity-web-forms-design.md` (Slice A, merged at main `46bf487fdb`)

## Goal

Complete the hosted web-forms feature by capturing the two remaining fields (company, message)
and deduplicating contacts. A submission now optionally creates or links a Company, deduplicates
the Person by email, and attaches the free-text message as a Note. Plus two polish items: an
iframe embed snippet in settings, and a proper 429 response when throttled.

Captcha is explicitly out of scope (honeypot + IP throttle from Slice A remain the defenses).

## Scope

In:
- Public form page renders + submits **Firma** (company) and **Nachricht** (message) inputs.
- Submission service: Person dedup by email; Company create-or-link by name; Note + NoteTargets.
- Settings: copyable iframe embed snippet next to the public URL.
- Controller: map `ThrottlerException` to HTTP 429.

Out (not this slice):
- Captcha (frontend widget + server validate).
- Cross-record transaction / rollback (still best-effort, as Slice A).
- Updating an existing (deduped) Person's fields — a matched Person is reused as-is, never overwritten.

## Data flow (submission)

All inside the existing single `globalWorkspaceOrmManager.executeInWorkspaceContext(fn,
buildSystemAuthContext(workspaceId))`, repos via `getRepository(workspaceId, Entity,
{ shouldBypassPermissionChecks: true })`, `createdBy` = the existing WEBHOOK actor, `position` =
`repo.maximum('position', undefined) ?? 0` then `+1`. Order:

1. **Company (only if `company` non-empty):** `companyRepository.findOne({ where: { name:
   ILike(company) } })` (exact string, case-insensitive — no `%` wildcards). If found, reuse its
   `id` (oldest wins if the ORM returns one; `findOne` returns a single row). Else
   `insert({ id: v4(), name: company, position: max+1, createdBy })`. The resulting `companyId`
   (or `undefined`) is carried into the Person and Opportunity inserts.

2. **Person (dedup by email):** `personRepository.findOne({ where: { emails: { primaryEmail:
   email.toLowerCase() } } })`. If found, reuse its `id` and do NOT modify it (its existing
   company/phone/jobTitle are left intact — we do not overwrite). If not found, insert a new
   Person via `buildWebFormPersonInsert(input)` plus `companyId` (when a company was resolved),
   `position`, `createdBy`.

3. **Opportunity:** unchanged from Slice A (`name` from template, `stage`, `pointOfContactId` =
   the person id from step 2, `position`, `createdBy`) plus `companyId` when resolved.

4. **Note (only if `message` non-empty):** `noteRepository.insert({ id: v4(), title:
   \`Nachricht von \${firstName} \${lastName}\`.trim() (fallback "Web-Formular Nachricht" when both
   names empty), bodyV2: buildWebFormNoteBody(message), position: max+1, createdBy })`, then two
   NoteTarget rows: `{ id: v4(), noteId, targetOpportunityId }` and `{ id: v4(), noteId,
   targetPersonId }`.

`buildWebFormNoteBody(message: string): { markdown: string; blocknote: string }` is a pure util
producing the RICH_TEXT composite: `markdown` = the plain message; `blocknote` = a
JSON.stringify of a single BlockNote paragraph block wrapping the message text (mirroring the
note seeder shape: one paragraph block with default props and a single text content node).

## Public page

`PublicWebFormPage` gains two inputs after Jobtitel:
- **Firma** — a text input (`company` state).
- **Nachricht** — a `<textarea>` (`message` state).

Both optional. The POST body becomes `{ firstName, lastName, email, phone, jobTitle, company,
message, _hp }`. No new required-field validation (email stays the only required field).

## Controller

`submitForm` body type extends with optional `company?: string` and `message?: string` (trimmed
before passing to the service). The service `submit` input gains `company` and `message`.

429 mapping: wrap the throttle + create flow so that `catch (error) { if (error instanceof
ThrottlerException) throttlerToRestApiExceptionHandler(error); throw error; }` — the util throws
an `HttpException(…, TOO_MANY_REQUESTS)`. Honeypot short-circuit and email validation stay before
the throttle/create as in Slice A.

## Settings — iframe snippet

In `SettingsObjectOpportunityWebForms`, next to the existing public-URL "Kopieren" button, add an
"iframe kopieren" button that copies `<iframe src="{publicUrl}" width="100%" height="600"
style="border:0"></iframe>` (publicUrl = the same `${origin}/forms/${workspaceId}/${formId}`),
with a success snackbar. Display is optional; a small read-only snippet line is enough.

## Field mapping summary

- `company` → Company.name (create-or-link by name) → Person.companyId + Opportunity.companyId.
- `message` → Note.bodyV2 (markdown + blocknote) + NoteTarget(opportunity) + NoteTarget(person).
- `email` → Person dedup key (findOne on emails.primaryEmail).

## Testing

- `buildWebFormNoteBody` — unit tests (markdown equals input; blocknote is valid JSON containing
  the text; empty/whitespace handled — though the caller only invokes it for non-empty message).
- Submission-service dedup + company + note branches — verified live end-to-end against the dev DB
  (Slice A precedent: no service-level unit test; orchestration mirrors CreatePersonService).
- Live-verify: submit with company + message → Person (new), Company (new) linked to Person +
  Opportunity, Note + 2 NoteTargets; submit again same email + same company → same Person reused,
  same Company reused, new Opportunity + new Note; iframe snippet copies; throttle returns 429.

## Non-goals / known limitations
- No cross-record transaction (a later insert failing leaves earlier rows; best-effort).
- Deduped Person is reused as-is (no field enrichment/overwrite).
- Company match is exact-name case-insensitive; different spellings create separate companies.
- No captcha.
