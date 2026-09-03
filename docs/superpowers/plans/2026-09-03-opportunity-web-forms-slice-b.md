# Web Forms / Lead Capture (Slice B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the hosted web-forms submission to capture company and message, dedup the contact by email, attach the message as a Note, add an iframe embed snippet, and return 429 on throttle.

**Architecture:** All record creation stays inside the existing `WebFormSubmissionService.submit` single `executeInWorkspaceContext` block. Company is create-or-linked by name (`ILike`), Person is deduped by primary email (reused as-is when found), Note + two NoteTargets are inserted for a non-empty message. The public page gains Firma + Nachricht inputs; the controller passes them through and maps `ThrottlerException` to 429; settings gains a copyable iframe snippet.

**Tech Stack:** NestJS, TypeORM (twenty-orm workspace repositories, `ILike`), React/Linaria, Lingui, Jest.

## Global Constraints

- No signatures / Co-Authored-By / "Generated with Claude" anywhere.
- Never modify `/* @license Enterprise */` files.
- Named exports only; types over interfaces; no `any`; `isDefined` from `twenty-shared/utils`, `isNonEmptyString` from `@sniptt/guards` (the codebase convention — NOT `twenty-shared/utils`).
- Builds on Slice A (merged, main `46bf487fdb`). Public REST controller is mounted at `ApiPath.WebForms` (`/web-forms/...`); the SPA page is `/forms/:workspaceId/:formId`. Do NOT reintroduce a `/forms` server route.
- No captcha. No cross-record transaction (best-effort, as Slice A). A deduped Person is reused as-is, never overwritten.
- After a server change to the submission service/controller: restart the backend and confirm boot (`curl -s -o /dev/null -w "%{http_code}" -X POST localhost:3000/metadata -H 'Content-Type: application/json' -d '{"query":"{__typename}"}'` = 200) before committing.
- `typecheck` + `lint` must be 0 before each commit. Run `npx nx typecheck twenty-server` (not just jest) on server changes — jest + oxlint do NOT catch tsc lib/type errors.
- Dev workspace id `03655638-583c-49b0-82f0-b4583bffaa1e`, schema `workspace_78jtyayrql5p8djgplk9x6vy`. A live web form already exists: form id `8ef371ea-29a1-42a7-9cab-ee02d0b1e33e` (title "Website-Kontakt").

---

## File structure

- Create: `packages/twenty-server/src/modules/opportunity/utils/build-web-form-note-body.util.ts` (+ `__tests__`) — plaintext → RICH_TEXT `{ markdown, blocknote }`.
- Modify: `packages/twenty-server/src/modules/opportunity/services/web-form-submission.service.ts` — company/person-dedup/note.
- Modify: `packages/twenty-server/src/modules/opportunity/controllers/web-form-public.controller.ts` — company/message body + 429 mapping.
- Modify: `packages/twenty-front/src/pages/web-form/PublicWebFormPage.tsx` — Firma + Nachricht inputs.
- Modify: `packages/twenty-front/src/pages/settings/data-model/SettingsObjectOpportunityWebForms.tsx` — iframe snippet.
- Modify: `packages/twenty-front/src/locales/generated/de-DE.po` — de-DE for the new settings string(s).

No module changes: `GlobalWorkspaceOrmManager` is global; `getRepository` serves Company/Note/NoteTarget without new imports.

---

## Task 1: Note-body builder util (TDD)

**Files:**
- Create: `packages/twenty-server/src/modules/opportunity/utils/build-web-form-note-body.util.ts`
- Test: `packages/twenty-server/src/modules/opportunity/utils/__tests__/build-web-form-note-body.util.spec.ts`

**Interfaces:**
- Produces: `buildWebFormNoteBody(message: string): { markdown: string; blocknote: string }` — `markdown` is the message verbatim; `blocknote` is `JSON.stringify` of a one-paragraph BlockNote document containing the message text (mirrors the note seeder shape). The paragraph block id is a `v4()` uuid.

- [ ] **Step 1: Write the failing test**

```typescript
import { buildWebFormNoteBody } from 'src/modules/opportunity/utils/build-web-form-note-body.util';

describe('buildWebFormNoteBody', () => {
  it('puts the message verbatim in markdown', () => {
    expect(buildWebFormNoteBody('Hallo Welt').markdown).toBe('Hallo Welt');
  });

  it('wraps the message in a single blocknote paragraph', () => {
    const blocks = JSON.parse(buildWebFormNoteBody('Anfrage: Preise?').blocknote);

    expect(Array.isArray(blocks)).toBe(true);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('paragraph');
    expect(blocks[0].content[0].type).toBe('text');
    expect(blocks[0].content[0].text).toBe('Anfrage: Preise?');
    expect(typeof blocks[0].id).toBe('string');
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `cd packages/twenty-server && npx jest build-web-form-note-body --config=jest.config.mjs`
Expected: FAIL (module not found).

- [ ] **Step 3: Write the util**

```typescript
import { v4 } from 'uuid';

export const buildWebFormNoteBody = (
  message: string,
): { markdown: string; blocknote: string } => {
  const blocknote = JSON.stringify([
    {
      id: v4(),
      type: 'paragraph',
      props: {
        textColor: 'default',
        backgroundColor: 'default',
        textAlignment: 'left',
      },
      content: [{ type: 'text', text: message, styles: {} }],
      children: [],
    },
  ]);

  return { markdown: message, blocknote };
};
```

- [ ] **Step 4: Run tests**

Run: `cd packages/twenty-server && npx jest build-web-form-note-body --config=jest.config.mjs`
Expected: PASS (2/2).

- [ ] **Step 5: Commit**

```bash
git add packages/twenty-server/src/modules/opportunity/utils/build-web-form-note-body.util.ts packages/twenty-server/src/modules/opportunity/utils/__tests__/build-web-form-note-body.util.spec.ts
git commit -m "feat(server): web form note-body builder"
```

---

## Task 2: Extend the submission service (company + person dedup + note)

**Files:**
- Modify: `packages/twenty-server/src/modules/opportunity/services/web-form-submission.service.ts`

**Interfaces:**
- Consumes: `buildWebFormNoteBody` (Task 1); `buildWebFormPersonInsert` + `WebFormSubmissionInput` (Slice A); `resolveWebFormDealName` (Slice A); `CompanyWorkspaceEntity`, `NoteWorkspaceEntity`, `NoteTargetWorkspaceEntity`, `PersonWorkspaceEntity`, `OpportunityWorkspaceEntity`; `ILike` (typeorm).
- Produces: `WebFormSubmissionService.submit({ workspaceId, form, input, company, message })` — `company` and `message` are trimmed strings (may be empty). Company is create-or-linked by name when non-empty; Person is deduped by `emails.primaryEmail`; a Note + two NoteTargets are created when message is non-empty.

- [ ] **Step 1: Replace the service file with the extended version**

Full file (`web-form-submission.service.ts`):

```typescript
import { Injectable } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';
import { FieldActorSource } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { ILike } from 'typeorm';
import { v4 } from 'uuid';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { CompanyWorkspaceEntity } from 'src/modules/company/standard-objects/company.workspace-entity';
import { NoteWorkspaceEntity } from 'src/modules/note/standard-objects/note.workspace-entity';
import { NoteTargetWorkspaceEntity } from 'src/modules/note/standard-objects/note-target.workspace-entity';
import { OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { type WebForm } from 'src/modules/opportunity/types/web-form-key-value.type';
import { buildWebFormNoteBody } from 'src/modules/opportunity/utils/build-web-form-note-body.util';
import {
  buildWebFormPersonInsert,
  type WebFormSubmissionInput,
} from 'src/modules/opportunity/utils/build-web-form-person-insert.util';
import { resolveWebFormDealName } from 'src/modules/opportunity/utils/resolve-web-form-deal-name.util';
import { PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';

@Injectable()
export class WebFormSubmissionService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async submit({
    workspaceId,
    form,
    input,
    company,
    message,
  }: {
    workspaceId: string;
    form: WebForm;
    input: WebFormSubmissionInput;
    company: string;
    message: string;
  }): Promise<void> {
    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const personRepository =
        await this.globalWorkspaceOrmManager.getRepository(
          workspaceId,
          PersonWorkspaceEntity,
          { shouldBypassPermissionChecks: true },
        );
      const opportunityRepository =
        await this.globalWorkspaceOrmManager.getRepository(
          workspaceId,
          OpportunityWorkspaceEntity,
          { shouldBypassPermissionChecks: true },
        );
      const companyRepository =
        await this.globalWorkspaceOrmManager.getRepository(
          workspaceId,
          CompanyWorkspaceEntity,
          { shouldBypassPermissionChecks: true },
        );
      const noteRepository = await this.globalWorkspaceOrmManager.getRepository(
        workspaceId,
        NoteWorkspaceEntity,
        { shouldBypassPermissionChecks: true },
      );
      const noteTargetRepository =
        await this.globalWorkspaceOrmManager.getRepository(
          workspaceId,
          NoteTargetWorkspaceEntity,
          { shouldBypassPermissionChecks: true },
        );

      const createdBy = {
        source: FieldActorSource.WEBHOOK,
        workspaceMemberId: null,
        name: 'Web Form',
        context: {},
      };

      let companyId: string | undefined;

      if (isNonEmptyString(company)) {
        const existingCompany = await companyRepository.findOne({
          where: { name: ILike(company) },
          order: { createdAt: 'ASC' },
        });

        if (isDefined(existingCompany)) {
          companyId = existingCompany.id;
        } else {
          companyId = v4();
          const lastCompanyPosition =
            (await companyRepository.maximum('position', undefined)) ?? 0;

          await companyRepository.insert({
            id: companyId,
            name: company,
            position: lastCompanyPosition + 1,
            createdBy,
          });
        }
      }

      const existingPerson = await personRepository.findOne({
        where: { emails: { primaryEmail: input.email.toLowerCase() } },
      });

      let personId: string;

      if (isDefined(existingPerson)) {
        personId = existingPerson.id;
      } else {
        personId = v4();
        const lastPersonPosition =
          (await personRepository.maximum('position', undefined)) ?? 0;

        await personRepository.insert({
          id: personId,
          ...buildWebFormPersonInsert(input),
          ...(isDefined(companyId) ? { companyId } : {}),
          position: lastPersonPosition + 1,
          createdBy,
        });
      }

      const lastOpportunityPosition =
        (await opportunityRepository.maximum('position', undefined)) ?? 0;
      const opportunityId = v4();

      await opportunityRepository.insert({
        id: opportunityId,
        name: resolveWebFormDealName(form.dealNameTemplate, {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
        }),
        stage: form.stage,
        pointOfContactId: personId,
        ...(isDefined(companyId) ? { companyId } : {}),
        position: lastOpportunityPosition + 1,
        createdBy,
      });

      if (isNonEmptyString(message)) {
        const noteId = v4();
        const lastNotePosition =
          (await noteRepository.maximum('position', undefined)) ?? 0;
        const senderName = `${input.firstName} ${input.lastName}`.trim();
        const title = isNonEmptyString(senderName)
          ? `Nachricht von ${senderName}`
          : 'Web-Formular Nachricht';

        await noteRepository.insert({
          id: noteId,
          title,
          bodyV2: buildWebFormNoteBody(message),
          position: lastNotePosition + 1,
          createdBy,
        });

        await noteTargetRepository.insert([
          { id: v4(), noteId, targetOpportunityId: opportunityId },
          { id: v4(), noteId, targetPersonId: personId },
        ]);
      }
    }, authContext);
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `npx nx typecheck twenty-server`
Expected: 0 errors. (If `bodyV2` complains, the return of `buildWebFormNoteBody` — `{ markdown, blocknote }` — must match `RichTextMetadata`; it does. If a `CountryCode`-style strict-type error appears on any composite, report it.)

- [ ] **Step 3: Lint**

Run: `cd packages/twenty-server && npx oxlint src/modules/opportunity/services/web-form-submission.service.ts`
Expected: 0 errors.

- [ ] **Step 4: Restart backend + boot check**

Restart the backend (`npx nx start twenty-server`) and confirm:
`curl -s -o /dev/null -w "%{http_code}" -X POST localhost:3000/metadata -H 'Content-Type: application/json' -d '{"query":"{__typename}"}'` → 200.

- [ ] **Step 5: Commit**

```bash
git add packages/twenty-server/src/modules/opportunity/services/web-form-submission.service.ts
git commit -m "feat(server): web form company link + person dedup + note"
```

---

## Task 3: Controller — company/message body + 429 mapping

**Files:**
- Modify: `packages/twenty-server/src/modules/opportunity/controllers/web-form-public.controller.ts`

**Interfaces:**
- Consumes: `WebFormSubmissionService.submit` extended signature (Task 2); `ThrottlerException`; `throttlerToRestApiExceptionHandler`.

- [ ] **Step 1: Add imports**

Add to the imports (after the existing `ThrottlerService` import):
```typescript
import { ThrottlerException } from 'src/engine/core-modules/throttler/throttler.exception';
import { throttlerToRestApiExceptionHandler } from 'src/engine/core-modules/throttler/utils/throttler-to-rest-api-exception-handler.util';
```

- [ ] **Step 2: Extend the request body type**

In `submitForm`, change the `@Body() body: {...}` type to add company + message:
```typescript
    body: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      jobTitle?: string;
      company?: string;
      message?: string;
      _hp?: string;
    },
```

- [ ] **Step 3: Wrap the throttle call for a 429 response**

Replace the existing throttle call
```typescript
    await this.throttlerService.tokenBucketThrottleOrThrow(
      `web-form-submit:${request.ip}`,
      1,
      5,
      60_000,
    );
```
with:
```typescript
    try {
      await this.throttlerService.tokenBucketThrottleOrThrow(
        `web-form-submit:${request.ip}`,
        1,
        5,
        60_000,
      );
    } catch (error) {
      if (error instanceof ThrottlerException) {
        throttlerToRestApiExceptionHandler(error);
      }
      throw error;
    }
```

- [ ] **Step 4: Pass company + message to the service**

Change the `submit(...)` call to add company + message alongside `input`:
```typescript
    await this.webFormSubmissionService.submit({
      workspaceId,
      form,
      input: {
        firstName: (body.firstName ?? '').trim(),
        lastName: (body.lastName ?? '').trim(),
        email,
        phone: (body.phone ?? '').trim(),
        jobTitle: (body.jobTitle ?? '').trim(),
      },
      company: (body.company ?? '').trim(),
      message: (body.message ?? '').trim(),
    });
```

- [ ] **Step 5: Typecheck + lint + restart + boot**

Run: `npx nx typecheck twenty-server` → 0 errors. `cd packages/twenty-server && npx oxlint src/modules/opportunity/controllers/web-form-public.controller.ts` → 0. Restart backend, confirm metadata 200, and smoke the throttle→429: fire 7 quick POSTs and confirm at least one returns 429:
```bash
WS=03655638-583c-49b0-82f0-b4583bffaa1e; FORM=8ef371ea-29a1-42a7-9cab-ee02d0b1e33e
for i in $(seq 1 7); do curl -s -o /dev/null -w "%{http_code} " -X POST localhost:3000/web-forms/$WS/$FORM/submit -H 'Content-Type: application/json' -d '{"email":"throttle@test.io"}'; done; echo
```
Expected: several `201` then `429`. (This creates a few throwaway Person+Opportunity rows under throttle@test.io — note them for cleanup.)

- [ ] **Step 6: Commit**

```bash
git add packages/twenty-server/src/modules/opportunity/controllers/web-form-public.controller.ts
git commit -m "feat(server): web form company/message body + 429 on throttle"
```

---

## Task 4: Public page — Firma + Nachricht inputs

**Files:**
- Modify: `packages/twenty-front/src/pages/web-form/PublicWebFormPage.tsx`

**Interfaces:**
- Consumes: the POST endpoint now accepts `company` + `message`.

- [ ] **Step 1: Add state + inputs**

In `PublicWebFormPage`, add two `useState<string>('')` fields, `company` and `message`, next to the existing `firstName`/`lastName`/etc. state. After the Jobtitel input, render:
- a text input labelled "Firma" bound to `company`.
- a `<textarea>` labelled "Nachricht" bound to `message` (reuse the existing input styling; a styled `textarea` with the same border/padding is fine, give it e.g. `rows={4}`).

Match the existing field markup exactly (label + input pattern used for Vorname/Jobtitel). Keep the honeypot input and submit button unchanged.

- [ ] **Step 2: Include them in the POST body**

In the submit handler, add `company` and `message` to the JSON body alongside the existing fields:
```typescript
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          jobTitle,
          company,
          message,
          _hp: hp,
        }),
```
(Match the exact property names already used; only add `company` and `message`.)

- [ ] **Step 3: Typecheck**

Run: `npx nx typecheck twenty-front`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add packages/twenty-front/src/pages/web-form/PublicWebFormPage.tsx
git commit -m "feat(front): web form company + message inputs"
```

---

## Task 5: Settings — iframe embed snippet

**Files:**
- Modify: `packages/twenty-front/src/pages/settings/data-model/SettingsObjectOpportunityWebForms.tsx`

**Interfaces:**
- Consumes: the existing per-form public URL (`${REACT_APP_SERVER_BASE_URL}/forms/${workspaceId}/${form.id}`) and `useSnackBar`.

- [ ] **Step 1: Add the iframe snippet + copy button**

Next to the existing public-URL "Kopieren" button (per form), build the iframe snippet from the SAME public URL:
```typescript
const iframeSnippet = `<iframe src="${publicUrl}" width="100%" height="600" style="border:0"></iframe>`;
```
Render a read-only display of `iframeSnippet` (a small monospace line, truncated/overflow-hidden like the URL line) and an "iframe kopieren" button that calls `navigator.clipboard.writeText(iframeSnippet)` then `enqueueSuccessSnackBar({ message: t\`In Zwischenablage kopiert\` })` (reuse the existing snackbar hook already in the file). Use `t\`iframe kopieren\`` for the button label.

Match the existing copy-button pattern (same `Button` component, `variant`/`size`) used for the public URL.

- [ ] **Step 2: Typecheck + lint**

Run: `npx nx typecheck twenty-front` → 0 errors. `npx nx lint:diff-with-main twenty-front` (or oxlint the file) → 0.

- [ ] **Step 3: Commit**

```bash
git add packages/twenty-front/src/pages/settings/data-model/SettingsObjectOpportunityWebForms.tsx
git commit -m "feat(front): web form iframe embed snippet"
```

---

## Task 6: de-DE strings

**Files:**
- Modify: `packages/twenty-front/src/locales/generated/de-DE.po`

- [ ] **Step 1: Extract**

Run: `npx nx run twenty-front:lingui:extract`
Expected: new msgids for the settings strings added in Task 5 (`iframe kopieren`, `In Zwischenablage kopiert` — plus any already present are reused).

- [ ] **Step 2: Fill de-DE msgstr**

In `packages/twenty-front/src/locales/generated/de-DE.po`, fill the empty `msgstr` for the new web-forms settings msgids with the identity German string. Do not blank sibling entries. (The public page strings Firma/Nachricht are hardcoded German without `t` macros by design — no catalog entries for them.)

- [ ] **Step 3: Typecheck**

Run: `npx nx typecheck twenty-front && npx nx typecheck twenty-server`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add packages/twenty-front/src/locales
git commit -m "feat(front): web forms slice B de-DE strings"
```

---

## Live-verification (after Task 6, before finishing the branch)

Backend restarted; front + Docker up; the "Website-Kontakt" form exists (id `8ef371ea-...`).

1. Open the public page `http://localhost:3001/forms/03655638-583c-49b0-82f0-b4583bffaa1e/8ef371ea-29a1-42a7-9cab-ee02d0b1e33e`. Confirm Firma + Nachricht inputs render.
2. Submit with a NEW email, Firma "Acme GmbH", Nachricht "Bitte Angebot senden". Verify via Postgres MCP (read-only):
   - a Company "Acme GmbH" exists;
   - a Person exists with `companyId` = that company;
   - an Opportunity with `companyId` = that company + `pointOfContactId` = that person;
   - a Note titled "Nachricht von <first> <last>" with `bodyV2Markdown` = "Bitte Angebot senden", and two `noteTarget` rows (one `targetOpportunityId`, one `targetPersonId`).
3. Submit AGAIN with the SAME email + SAME Firma "Acme GmbH": confirm NO new Person (same id reused) and NO new Company (same id), but a new Opportunity + new Note.
4. Submit with empty Firma + empty Nachricht: confirm no Company and no Note created (Person + Opportunity only).
5. iframe snippet: in settings, click "iframe kopieren" → snackbar; confirm the copied text is `<iframe src="…/forms/…" …>`.
6. Throttle: fire >5 rapid submits → a `429` response.
7. Clean up the dev test rows created here (and the throttle@test.io rows from Task 3) or note them in the ledger.

---

## Self-review notes (author)
- Spec coverage: company create-or-link by name (T2), person dedup by email (T2), note + 2 targets (T1+T2), public inputs (T4), controller body + 429 (T3), iframe snippet (T5), de-DE (T6). All spec items mapped.
- `WebFormSubmissionInput` is unchanged (still the 5 person-core fields); company/message are separate `submit` params, so `buildWebFormPersonInsert` and its Slice A tests are untouched.
- Company `findOne` uses `order: { createdAt: 'ASC' }` for deterministic oldest-wins on duplicate names.
- Person dedup reuses the row as-is (no overwrite), per spec.
- Known limitations carried from spec: best-effort (no transaction); deduped Person not enriched; exact-name company match; no captcha.
- Server-change tasks (T2, T3) each restart the backend + boot-check before commit, and run `nx typecheck twenty-server` (Slice A's escaped tsc errors — replaceAll/CountryCode — came from relying on jest+oxlint only).
