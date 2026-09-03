# Web Forms / Lead Capture (Slice A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a workspace publish hosted web forms whose public submissions create a Person + Opportunity in the pipeline automatically.

**Architecture:** Form definitions live in workspace config (KeyValuePair `WEB_FORMS`, mirroring the monthly-goal config triplet). An authenticated metadata resolver reads/writes the forms array from a settings page. A public REST controller (`PublicEndpointGuard`, trusting `workspaceId` in the path like `WorkflowTriggerController`) serves each form's public shape and accepts submissions; a submission service creates the Person + Opportunity directly via `GlobalWorkspaceOrmManager` under a system auth context (the proven `CreatePersonService` pattern). A public, unauthenticated frontend page renders the form and posts to the controller.

**Tech Stack:** NestJS, TypeORM (twenty-orm workspace repositories), GraphQL (metadata resolver + GraphQLJSON), React, Jotai, Linaria, Lingui (de-DE), Jest.

## Global Constraints

- No signatures / Co-Authored-By / "Generated with Claude" anywhere (commits, PRs, files).
- Never modify files marked `/* @license Enterprise */`.
- Code/commits/PRs in normal English. No code comments unless a short "why" is genuinely needed.
- Named exports only; types over interfaces; string literals over enums (except GraphQL enums); no `any`; use `isDefined`/`isNonEmptyString`/`isNonEmptyArray` from `twenty-shared/utils`.
- Slice A creates **Person + Opportunity only**. Company, Note, dedup, captcha, iframe snippet = Slice B (do not build).
- Slice A form renders + persists only the core fields: firstName, lastName, email (required), phone, jobTitle. Company + message inputs are Slice B.
- Field UIDs are irrelevant here (no new standard field, no migration, no twenty-shared standard-field constant).
- After any twenty-shared change: `npx nx build twenty-shared`, then `rm -rf packages/twenty-front/node_modules/.vite` before the frontend picks it up.
- After a new server resolver/module/controller: the backend must be restarted to register it.
- Lint: `lint:diff-with-main` often reports "No changed files" pre-commit; run oxlint/oxfmt directly on touched files if so. `typecheck` + `lint` must be 0 before each commit.

---

## File structure

Server (all under `packages/twenty-server/src/modules/opportunity/`, matching where the other opportunity config lives):
- `types/web-form-key-value.type.ts` — key constant + `WebForm` + `WebFormsConfig` + TypeMap.
- `services/web-form-config.service.ts` — get (returns `{ forms: [] }` when unset) + set.
- `dtos/update-web-forms.input.ts` — GraphQLJSON input.
- `resolvers/web-form-config.resolver.ts` — `webForms` query + `updateWebForms` mutation.
- `web-form-config.module.ts` — config service + resolver; exports service.
- `utils/resolve-web-form-deal-name.util.ts` (+ `__tests__`) — deal-name template resolution.
- `utils/build-web-form-person-insert.util.ts` (+ `__tests__`) — submission → `Partial<PersonWorkspaceEntity>`.
- `services/web-form-submission.service.ts` — orchestrates Person + Opportunity insert.
- `controllers/web-form-public.controller.ts` — public GET shape + POST submit.
- `web-form-public.module.ts` — controller + submission service; imports config module.
- Registration: `packages/twenty-server/src/engine/core-modules/core-engine.module.ts` (import + `imports` array) for both new modules.

Frontend:
- `packages/twenty-shared/src/types/SettingsPath.ts` — add `ObjectWebForms`.
- `packages/twenty-shared/src/types/AppPath.ts` — add `WebFormPage`.
- `packages/twenty-front/src/modules/settings/data-model/web-forms/graphql/queries/getWebForms.ts`
- `.../web-forms/graphql/mutations/updateWebForms.ts`
- `.../web-forms/hooks/useWebForms.ts`
- `.../web-forms/hooks/useUpdateWebForms.ts`
- `.../web-forms/types/WebForm.ts` — frontend `WebForm` type mirror.
- `packages/twenty-front/src/pages/settings/data-model/SettingsObjectOpportunityWebForms.tsx` — manage page.
- `packages/twenty-front/src/modules/app/components/SettingsRoutes.tsx` — route.
- `.../settings/data-model/object-details/components/tabs/ObjectSettings.tsx` — gated link.
- `packages/twenty-front/src/pages/web-form/PublicWebFormPage.tsx` — public form page.
- `packages/twenty-front/src/modules/app/hooks/useCreateRootAppRouter.tsx` + `useCreateWorkspaceAppRouter.tsx` — unauthenticated route.
- de-DE catalog: `packages/twenty-front/src/locales/generated/de-DE.po` (via `nx run twenty-front:lingui:extract` then fill msgstr).

---

## Task 1: Config type + service

**Files:**
- Create: `packages/twenty-server/src/modules/opportunity/types/web-form-key-value.type.ts`
- Create: `packages/twenty-server/src/modules/opportunity/services/web-form-config.service.ts`
- Test: `packages/twenty-server/src/modules/opportunity/services/__tests__/web-form-config.service.spec.ts`

**Interfaces:**
- Produces: `WEB_FORMS_KEY`, `type WebForm`, `type WebFormsConfig = { forms: WebForm[] }`, `type WebFormKeyValueTypeMap`; `WebFormConfigService` with `getWebForms(workspaceId): Promise<WebFormsConfig>` (never null — `{ forms: [] }` when unset) and `setWebForms(workspaceId, config: WebFormsConfig): Promise<WebFormsConfig>`.

- [ ] **Step 1: Write the type file**

```typescript
// web-form-key-value.type.ts
export const WEB_FORMS_KEY = 'WEB_FORMS';

export type WebForm = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  stage: string;
  dealNameTemplate: string;
  thankYouText: string;
};

export type WebFormsConfig = { forms: WebForm[] };

export type WebFormKeyValueTypeMap = {
  [WEB_FORMS_KEY]: WebFormsConfig;
};
```

- [ ] **Step 2: Write the failing service spec**

Mirror `opportunity-monthly-goal-config.service.spec.ts`. The KeyValuePairService is mocked; assert get-returns-empty-when-unset and set round-trip + the exact `get`/`set` args.

```typescript
// __tests__/web-form-config.service.spec.ts
import { Test, type TestingModule } from '@nestjs/testing';

import { KeyValuePairType } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { KeyValuePairService } from 'src/engine/core-modules/key-value-pair/key-value-pair.service';
import { WebFormConfigService } from 'src/modules/opportunity/services/web-form-config.service';
import {
  WEB_FORMS_KEY,
  type WebFormsConfig,
} from 'src/modules/opportunity/types/web-form-key-value.type';

describe('WebFormConfigService', () => {
  const workspaceId = 'ws-1';
  let service: WebFormConfigService;
  const get = jest.fn();
  const set = jest.fn();

  beforeEach(async () => {
    get.mockReset();
    set.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebFormConfigService,
        { provide: KeyValuePairService, useValue: { get, set } },
      ],
    }).compile();
    service = module.get(WebFormConfigService);
  });

  it('returns an empty forms array when nothing is stored', async () => {
    get.mockResolvedValue([]);

    await expect(service.getWebForms(workspaceId)).resolves.toEqual({
      forms: [],
    });
    expect(get).toHaveBeenCalledWith({
      userId: null,
      workspaceId,
      type: KeyValuePairType.CONFIG_VARIABLE,
      key: WEB_FORMS_KEY,
    });
  });

  it('returns the stored config', async () => {
    const stored: WebFormsConfig = {
      forms: [
        {
          id: 'f1',
          title: 'Kontakt',
          description: '',
          enabled: true,
          stage: 'NEW',
          dealNameTemplate: 'Web-Lead: {firstName} {lastName}',
          thankYouText: 'Danke!',
        },
      ],
    };

    get.mockResolvedValue([{ value: stored }]);

    await expect(service.getWebForms(workspaceId)).resolves.toEqual(stored);
  });

  it('persists the config and returns it', async () => {
    const config: WebFormsConfig = { forms: [] };

    set.mockResolvedValue(undefined);

    await expect(service.setWebForms(workspaceId, config)).resolves.toEqual(
      config,
    );
    expect(set).toHaveBeenCalledWith({
      userId: null,
      workspaceId,
      type: KeyValuePairType.CONFIG_VARIABLE,
      key: WEB_FORMS_KEY,
      value: config,
    });
  });
});
```

- [ ] **Step 3: Run it, verify it fails**

Run: `cd packages/twenty-server && npx jest web-form-config.service --config=jest.config.mjs`
Expected: FAIL (module not found).

- [ ] **Step 4: Write the service**

```typescript
// web-form-config.service.ts
import { Injectable } from '@nestjs/common';

import { KeyValuePairType } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { KeyValuePairService } from 'src/engine/core-modules/key-value-pair/key-value-pair.service';
import {
  WEB_FORMS_KEY,
  type WebFormKeyValueTypeMap,
  type WebFormsConfig,
} from 'src/modules/opportunity/types/web-form-key-value.type';

@Injectable()
export class WebFormConfigService {
  constructor(
    private readonly keyValuePairService: KeyValuePairService<WebFormKeyValueTypeMap>,
  ) {}

  async getWebForms(workspaceId: string): Promise<WebFormsConfig> {
    const stored = await this.keyValuePairService.get({
      userId: null,
      workspaceId,
      type: KeyValuePairType.CONFIG_VARIABLE,
      key: WEB_FORMS_KEY,
    });

    const value = (stored[0] as { value?: WebFormsConfig } | undefined)?.value;

    return value ?? { forms: [] };
  }

  async setWebForms(
    workspaceId: string,
    config: WebFormsConfig,
  ): Promise<WebFormsConfig> {
    await this.keyValuePairService.set({
      userId: null,
      workspaceId,
      type: KeyValuePairType.CONFIG_VARIABLE,
      key: WEB_FORMS_KEY,
      value: config,
    });

    return config;
  }
}
```

- [ ] **Step 5: Run tests + typecheck**

Run: `cd packages/twenty-server && npx jest web-form-config.service --config=jest.config.mjs`
Expected: PASS (3/3). Then `npx nx typecheck twenty-server` scoped is slow; rely on jest + a lint of the two files.

- [ ] **Step 6: Commit**

```bash
git add packages/twenty-server/src/modules/opportunity/types/web-form-key-value.type.ts packages/twenty-server/src/modules/opportunity/services/web-form-config.service.ts packages/twenty-server/src/modules/opportunity/services/__tests__/web-form-config.service.spec.ts
git commit -m "feat(server): web form config service"
```

---

## Task 2: Config resolver + DTO + module + registration

**Files:**
- Create: `packages/twenty-server/src/modules/opportunity/dtos/update-web-forms.input.ts`
- Create: `packages/twenty-server/src/modules/opportunity/resolvers/web-form-config.resolver.ts`
- Create: `packages/twenty-server/src/modules/opportunity/web-form-config.module.ts`
- Modify: `packages/twenty-server/src/engine/core-modules/core-engine.module.ts`

**Interfaces:**
- Consumes: `WebFormConfigService` (Task 1).
- Produces: GraphQL metadata query `webForms` (→ `WebFormsConfig`) and mutation `updateWebForms(input: { value: WebFormsConfig })` (→ `WebFormsConfig`); `WebFormConfigModule` exporting `WebFormConfigService`.

- [ ] **Step 1: Write the DTO** (mirror `update-opportunity-monthly-goal.input.ts`)

```typescript
// update-web-forms.input.ts
import { Field, InputType } from '@nestjs/graphql';

import { IsNotEmpty, IsObject } from 'class-validator';
import GraphQLJSON from 'graphql-type-json';

import { type WebFormsConfig } from 'src/modules/opportunity/types/web-form-key-value.type';

@InputType('UpdateWebFormsInput')
export class UpdateWebFormsInput {
  @IsObject()
  @IsNotEmpty()
  @Field(() => GraphQLJSON)
  value: WebFormsConfig;
}
```

- [ ] **Step 2: Write the resolver** (mirror `opportunity-monthly-goal-config.resolver.ts`)

```typescript
// web-form-config.resolver.ts
import { UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation, Query } from '@nestjs/graphql';

import GraphQLJSON from 'graphql-type-json';
import { PermissionFlagType } from 'twenty-shared/constants';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { UpdateWebFormsInput } from 'src/modules/opportunity/dtos/update-web-forms.input';
import { WebFormConfigService } from 'src/modules/opportunity/services/web-form-config.service';
import { type WebFormsConfig } from 'src/modules/opportunity/types/web-form-key-value.type';

@UseGuards(WorkspaceAuthGuard)
@UsePipes(ResolverValidationPipe)
@MetadataResolver()
export class WebFormConfigResolver {
  constructor(private readonly webFormConfigService: WebFormConfigService) {}

  @UseGuards(NoPermissionGuard)
  @Query(() => GraphQLJSON)
  async webForms(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<WebFormsConfig> {
    return this.webFormConfigService.getWebForms(workspaceId);
  }

  @UseGuards(SettingsPermissionGuard(PermissionFlagType.DATA_MODEL))
  @Mutation(() => GraphQLJSON)
  async updateWebForms(
    @Args('input') input: UpdateWebFormsInput,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<WebFormsConfig> {
    return this.webFormConfigService.setWebForms(workspaceId, input.value);
  }
}
```

- [ ] **Step 3: Write the module** (mirror `opportunity-monthly-goal-config.module.ts`)

```typescript
// web-form-config.module.ts
import { Module } from '@nestjs/common';

import { KeyValuePairModule } from 'src/engine/core-modules/key-value-pair/key-value-pair.module';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { WebFormConfigResolver } from 'src/modules/opportunity/resolvers/web-form-config.resolver';
import { WebFormConfigService } from 'src/modules/opportunity/services/web-form-config.service';

@Module({
  imports: [KeyValuePairModule, PermissionsModule],
  providers: [WebFormConfigService, WebFormConfigResolver],
  exports: [WebFormConfigService],
})
export class WebFormConfigModule {}
```

- [ ] **Step 4: Register in core-engine.module.ts**

Find the `OpportunityMonthlyGoalConfigModule` import line and its entry in the `imports` array; add `WebFormConfigModule` right after each, mirroring exactly.

```typescript
import { WebFormConfigModule } from 'src/modules/opportunity/web-form-config.module';
```
and in the module `imports: [ ... ]` array add `WebFormConfigModule,` next to `OpportunityMonthlyGoalConfigModule,`.

- [ ] **Step 5: Typecheck + lint the changed files**

Run: `cd packages/twenty-server && npx oxlint src/modules/opportunity/resolvers/web-form-config.resolver.ts src/modules/opportunity/web-form-config.module.ts src/modules/opportunity/dtos/update-web-forms.input.ts src/engine/core-modules/core-engine.module.ts`
Expected: 0 errors. (Full typecheck deferred; the resolver mirrors a compiling sibling.)

- [ ] **Step 6: Commit**

```bash
git add packages/twenty-server/src/modules/opportunity/dtos/update-web-forms.input.ts packages/twenty-server/src/modules/opportunity/resolvers/web-form-config.resolver.ts packages/twenty-server/src/modules/opportunity/web-form-config.module.ts packages/twenty-server/src/engine/core-modules/core-engine.module.ts
git commit -m "feat(server): web form config resolver"
```

---

## Task 3: Deal-name template resolver util (TDD)

**Files:**
- Create: `packages/twenty-server/src/modules/opportunity/utils/resolve-web-form-deal-name.util.ts`
- Test: `packages/twenty-server/src/modules/opportunity/utils/__tests__/resolve-web-form-deal-name.util.spec.ts`

**Interfaces:**
- Produces: `resolveWebFormDealName(template: string, fields: { firstName: string; lastName: string; email: string }): string` — substitutes `{firstName}`, `{lastName}`, `{email}`; trims; falls back to `'Web-Lead'` when the result is empty.

- [ ] **Step 1: Write the failing test**

```typescript
import { resolveWebFormDealName } from 'src/modules/opportunity/utils/resolve-web-form-deal-name.util';

describe('resolveWebFormDealName', () => {
  const fields = { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@x.io' };

  it('substitutes all placeholders', () => {
    expect(
      resolveWebFormDealName('Web-Lead: {firstName} {lastName}', fields),
    ).toBe('Web-Lead: Ada Lovelace');
  });

  it('substitutes email', () => {
    expect(resolveWebFormDealName('Lead {email}', fields)).toBe(
      'Lead ada@x.io',
    );
  });

  it('leaves unknown placeholders untouched', () => {
    expect(resolveWebFormDealName('X {company}', fields)).toBe('X {company}');
  });

  it('trims and falls back to Web-Lead when the result is empty', () => {
    expect(
      resolveWebFormDealName('{firstName}{lastName}', {
        firstName: '',
        lastName: '',
        email: 'a@b.c',
      }),
    ).toBe('Web-Lead');
    expect(resolveWebFormDealName('   ', fields)).toBe('Web-Lead');
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `cd packages/twenty-server && npx jest resolve-web-form-deal-name --config=jest.config.mjs`
Expected: FAIL.

- [ ] **Step 3: Write the util**

```typescript
export const resolveWebFormDealName = (
  template: string,
  fields: { firstName: string; lastName: string; email: string },
): string => {
  const resolved = template
    .replaceAll('{firstName}', fields.firstName)
    .replaceAll('{lastName}', fields.lastName)
    .replaceAll('{email}', fields.email)
    .trim();

  return resolved.length > 0 ? resolved : 'Web-Lead';
};
```

- [ ] **Step 4: Run tests**

Run: `cd packages/twenty-server && npx jest resolve-web-form-deal-name --config=jest.config.mjs`
Expected: PASS (4/4).

- [ ] **Step 5: Commit**

```bash
git add packages/twenty-server/src/modules/opportunity/utils/resolve-web-form-deal-name.util.ts packages/twenty-server/src/modules/opportunity/utils/__tests__/resolve-web-form-deal-name.util.spec.ts
git commit -m "feat(server): web form deal-name template resolver"
```

---

## Task 4: Person-insert builder util (TDD)

**Files:**
- Create: `packages/twenty-server/src/modules/opportunity/utils/build-web-form-person-insert.util.ts`
- Test: `packages/twenty-server/src/modules/opportunity/utils/__tests__/build-web-form-person-insert.util.spec.ts`

**Interfaces:**
- Consumes: `PersonWorkspaceEntity` (`src/modules/person/standard-objects/person.workspace-entity`).
- Produces: `type WebFormSubmissionInput = { firstName: string; lastName: string; email: string; phone: string; jobTitle: string }` and `buildWebFormPersonInsert(input: WebFormSubmissionInput): Partial<PersonWorkspaceEntity>` — builds `name` (FULL_NAME composite), `emails` (EMAILS composite, lowercased primary), `phones` (PHONES composite) only when phone present, `jobTitle` only when present. Empty optional fields are omitted (not set to empty composites).

- [ ] **Step 1: Write the failing test**

```typescript
import {
  buildWebFormPersonInsert,
  type WebFormSubmissionInput,
} from 'src/modules/opportunity/utils/build-web-form-person-insert.util';

const base: WebFormSubmissionInput = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'Ada@X.io',
  phone: '',
  jobTitle: '',
};

describe('buildWebFormPersonInsert', () => {
  it('maps name and lowercased primary email', () => {
    const record = buildWebFormPersonInsert(base);

    expect(record.name).toEqual({ firstName: 'Ada', lastName: 'Lovelace' });
    expect(record.emails).toEqual({
      primaryEmail: 'ada@x.io',
      additionalEmails: null,
    });
  });

  it('omits phones and jobTitle when empty', () => {
    const record = buildWebFormPersonInsert(base);

    expect(record.phones).toBeUndefined();
    expect(record.jobTitle).toBeUndefined();
  });

  it('sets phones and jobTitle when present', () => {
    const record = buildWebFormPersonInsert({
      ...base,
      phone: '+49 170 1234567',
      jobTitle: 'CTO',
    });

    expect(record.phones).toEqual({
      primaryPhoneNumber: '+49 170 1234567',
      primaryPhoneCountryCode: '',
      primaryPhoneCallingCode: '',
      additionalPhones: null,
    });
    expect(record.jobTitle).toBe('CTO');
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `cd packages/twenty-server && npx jest build-web-form-person-insert --config=jest.config.mjs`
Expected: FAIL.

- [ ] **Step 3: Write the util**

```typescript
import { isNonEmptyString } from 'twenty-shared/utils';

import { type PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';

export type WebFormSubmissionInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
};

export const buildWebFormPersonInsert = (
  input: WebFormSubmissionInput,
): Partial<PersonWorkspaceEntity> => {
  const record: Partial<PersonWorkspaceEntity> = {
    name: { firstName: input.firstName, lastName: input.lastName },
    emails: {
      primaryEmail: input.email.toLowerCase(),
      additionalEmails: null,
    },
  };

  if (isNonEmptyString(input.phone)) {
    record.phones = {
      primaryPhoneNumber: input.phone,
      primaryPhoneCountryCode: '',
      primaryPhoneCallingCode: '',
      additionalPhones: null,
    };
  }

  if (isNonEmptyString(input.jobTitle)) {
    record.jobTitle = input.jobTitle;
  }

  return record;
};
```

- [ ] **Step 4: Run tests**

Run: `cd packages/twenty-server && npx jest build-web-form-person-insert --config=jest.config.mjs`
Expected: PASS (3/3).

- [ ] **Step 5: Commit**

```bash
git add packages/twenty-server/src/modules/opportunity/utils/build-web-form-person-insert.util.ts packages/twenty-server/src/modules/opportunity/utils/__tests__/build-web-form-person-insert.util.spec.ts
git commit -m "feat(server): web form person-insert builder"
```

---

## Task 5: Submission service + public controller + module + registration

**Files:**
- Create: `packages/twenty-server/src/modules/opportunity/services/web-form-submission.service.ts`
- Create: `packages/twenty-server/src/modules/opportunity/controllers/web-form-public.controller.ts`
- Create: `packages/twenty-server/src/modules/opportunity/web-form-public.module.ts`
- Modify: `packages/twenty-server/src/engine/core-modules/core-engine.module.ts`

**Interfaces:**
- Consumes: `WebFormConfigService` (Task 1/2), `resolveWebFormDealName` (Task 3), `buildWebFormPersonInsert` + `WebFormSubmissionInput` (Task 4), `GlobalWorkspaceOrmManager` + `buildSystemAuthContext` (twenty-orm), `ThrottlerService`, `PersonWorkspaceEntity`, `OpportunityWorkspaceEntity`.
- Produces: `WebFormSubmissionService.submit({ workspaceId, form, input }): Promise<void>` (creates Person + Opportunity); REST routes `GET /forms/:workspaceId/:formId` → `{ title, description, thankYouText }` and `POST /forms/:workspaceId/:formId/submit` → `{ ok: true }`.

**Reference patterns:** `CreatePersonService.createPeople` (getRepository + insert under `executeInWorkspaceContext(fn, buildSystemAuthContext(workspaceId))`, composite fields as nested objects, `position` = max + 1, `createdBy` actor) and `WorkflowTriggerController` (public REST + `workspaceRepository.existsBy`).

- [ ] **Step 1: Write the submission service**

`position` is set to `maximum('position') + 1` for each record (mirroring `CreatePersonService`). `createdBy` uses `FieldActorSource.WEBHOOK`. The Opportunity is created after the Person so `pointOfContactId` can reference it. Both inserts run inside one `executeInWorkspaceContext`.

```typescript
// web-form-submission.service.ts
import { Injectable } from '@nestjs/common';

import { FieldActorSource } from 'twenty-shared/types';
import { v4 } from 'uuid';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { type WebForm } from 'src/modules/opportunity/types/web-form-key-value.type';
import { buildWebFormPersonInsert } from 'src/modules/opportunity/utils/build-web-form-person-insert.util';
import { resolveWebFormDealName } from 'src/modules/opportunity/utils/resolve-web-form-deal-name.util';
import { type WebFormSubmissionInput } from 'src/modules/opportunity/utils/build-web-form-person-insert.util';
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
  }: {
    workspaceId: string;
    form: WebForm;
    input: WebFormSubmissionInput;
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

      const createdBy = {
        source: FieldActorSource.WEBHOOK,
        workspaceMemberId: null,
        name: 'Web Form',
        context: {},
      };

      const personId = v4();
      const lastPersonPosition =
        (await personRepository.maximum('position', undefined)) ?? 0;

      await personRepository.insert({
        id: personId,
        ...buildWebFormPersonInsert(input),
        position: lastPersonPosition + 1,
        createdBy,
      });

      const lastOpportunityPosition =
        (await opportunityRepository.maximum('position', undefined)) ?? 0;

      await opportunityRepository.insert({
        id: v4(),
        name: resolveWebFormDealName(form.dealNameTemplate, {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
        }),
        stage: form.stage,
        pointOfContactId: personId,
        position: lastOpportunityPosition + 1,
        createdBy,
      });
    }, authContext);
  }
}
```

- [ ] **Step 2: Write the public controller**

Honeypot: `_hp` non-empty → return success without creating. Throttle: 5 submissions per IP per 60s window. Validation: email required + basic shape. Form must exist and be enabled.

```typescript
// web-form-public.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Request } from 'express';
import { isDefined } from 'twenty-shared/utils';
import { Repository } from 'typeorm';

import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { ThrottlerService } from 'src/engine/core-modules/throttler/throttler.service';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';
import { WebFormConfigService } from 'src/modules/opportunity/services/web-form-config.service';
import { WebFormSubmissionService } from 'src/modules/opportunity/services/web-form-submission.service';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Controller('forms')
export class WebFormPublicController {
  constructor(
    private readonly webFormConfigService: WebFormConfigService,
    private readonly webFormSubmissionService: WebFormSubmissionService,
    private readonly throttlerService: ThrottlerService,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
  ) {}

  @Get(':workspaceId/:formId')
  @UseGuards(PublicEndpointGuard, NoPermissionGuard)
  async getForm(
    @Param('workspaceId') workspaceId: string,
    @Param('formId') formId: string,
  ) {
    const form = await this.resolveEnabledForm(workspaceId, formId);

    return {
      title: form.title,
      description: form.description,
      thankYouText: form.thankYouText,
    };
  }

  @Post(':workspaceId/:formId/submit')
  @UseGuards(PublicEndpointGuard, NoPermissionGuard)
  async submitForm(
    @Param('workspaceId') workspaceId: string,
    @Param('formId') formId: string,
    @Body()
    body: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      jobTitle?: string;
      _hp?: string;
    },
    @Req() request: Request,
  ) {
    if (isDefined(body._hp) && body._hp.trim() !== '') {
      return { ok: true };
    }

    await this.throttlerService.tokenBucketThrottleOrThrow(
      `web-form-submit:${request.ip}`,
      1,
      5,
      60_000,
    );

    const email = (body.email ?? '').trim();

    if (!EMAIL_REGEX.test(email)) {
      throw new BadRequestException('A valid email is required');
    }

    const form = await this.resolveEnabledForm(workspaceId, formId);

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
    });

    return { ok: true };
  }

  private async resolveEnabledForm(workspaceId: string, formId: string) {
    const workspaceExists = await this.workspaceRepository.existsBy({
      id: workspaceId,
    });

    if (!workspaceExists) {
      throw new NotFoundException('Form not found');
    }

    const { forms } = await this.webFormConfigService.getWebForms(workspaceId);
    const form = forms.find((candidate) => candidate.id === formId);

    if (!isDefined(form) || form.enabled === false) {
      throw new NotFoundException('Form not found');
    }

    return form;
  }
}
```

Note: `ThrottlerException` from `tokenBucketThrottleOrThrow` surfaces as a 500 unless mapped; that is acceptable for Slice A (submission fails, no lead created). A friendly 429 mapping is a Slice B polish item. The frontend treats any non-2xx as a generic failure.

- [ ] **Step 3: Write the module**

`GlobalWorkspaceOrmManager`, `ThrottlerService`, and the `WorkspaceEntity` repository come from modules the config module does not import; register them here. Check how `WorkflowTriggerController`'s module (`workflow-api.module.ts`) imports `GlobalWorkspaceOrmManager` (via `TwentyORMModule` / feature import) and mirror it. `ThrottlerModule` exports `ThrottlerService`. `WorkspaceEntity` repo via `TypeOrmModule.forFeature([WorkspaceEntity], 'core')`.

```typescript
// web-form-public.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ThrottlerModule } from 'src/engine/core-modules/throttler/throttler.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { TwentyORMModule } from 'src/engine/twenty-orm/twenty-orm.module';
import { WebFormConfigModule } from 'src/modules/opportunity/web-form-config.module';
import { WebFormPublicController } from 'src/modules/opportunity/controllers/web-form-public.controller';
import { WebFormSubmissionService } from 'src/modules/opportunity/services/web-form-submission.service';

@Module({
  imports: [
    WebFormConfigModule,
    ThrottlerModule,
    TwentyORMModule,
    TypeOrmModule.forFeature([WorkspaceEntity], 'core'),
  ],
  controllers: [WebFormPublicController],
  providers: [WebFormSubmissionService],
})
export class WebFormPublicModule {}
```

Verify the exact import symbol + args for `TwentyORMModule` and the `'core'` datasource token against `workflow-api.module.ts` and an existing `TypeOrmModule.forFeature([WorkspaceEntity], ...)` usage before finalizing; adjust to match the codebase (this is the one place to double-check wiring).

- [ ] **Step 4: Register in core-engine.module.ts**

Add `import { WebFormPublicModule } from 'src/modules/opportunity/web-form-public.module';` and add `WebFormPublicModule,` to the `imports` array next to `WebFormConfigModule`.

- [ ] **Step 5: Lint touched files + boot the backend**

Run: `cd packages/twenty-server && npx oxlint src/modules/opportunity/services/web-form-submission.service.ts src/modules/opportunity/controllers/web-form-public.controller.ts src/modules/opportunity/web-form-public.module.ts`
Expected: 0 errors.
Then restart the backend (`npx nx start twenty-server`) and confirm boot: `curl -s -o /dev/null -w "%{http_code}" -X POST localhost:3000/metadata -H 'Content-Type: application/json' -d '{"query":"{__typename}"}'` → 200. A boot failure here means the module wiring (Step 3) is wrong; fix before committing.

- [ ] **Step 6: Smoke-test the public GET (no form yet → 404)**

Run: `curl -s -o /dev/null -w "%{http_code}" localhost:3000/forms/03655638-583c-49b0-82f0-b4583bffaa1e/nope`
Expected: 404.

- [ ] **Step 7: Commit**

```bash
git add packages/twenty-server/src/modules/opportunity/services/web-form-submission.service.ts packages/twenty-server/src/modules/opportunity/controllers/web-form-public.controller.ts packages/twenty-server/src/modules/opportunity/web-form-public.module.ts packages/twenty-server/src/engine/core-modules/core-engine.module.ts
git commit -m "feat(server): public web form submit endpoint"
```

---

## Task 6: twenty-shared enums (SettingsPath + AppPath)

**Files:**
- Modify: `packages/twenty-shared/src/types/SettingsPath.ts`
- Modify: `packages/twenty-shared/src/types/AppPath.ts`

**Interfaces:**
- Produces: `SettingsPath.ObjectWebForms = 'objects/:objectNamePlural/web-forms'` and `AppPath.WebFormPage = '/forms/:workspaceId/:formId'`.

- [ ] **Step 1: Add the SettingsPath entry**

Find `ObjectGoal = 'objects/:objectNamePlural/goal',` and add directly after it:
```typescript
  ObjectWebForms = 'objects/:objectNamePlural/web-forms',
```

- [ ] **Step 2: Add the AppPath entry**

In `AppPath.ts`, add (near the other unauthenticated public routes, e.g. after `Invite`):
```typescript
  WebFormPage = '/forms/:workspaceId/:formId',
```

- [ ] **Step 3: Rebuild twenty-shared + clear vite cache**

Run: `npx nx build twenty-shared && rm -rf packages/twenty-front/node_modules/.vite`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add packages/twenty-shared/src/types/SettingsPath.ts packages/twenty-shared/src/types/AppPath.ts
git commit -m "feat(shared): web form settings + public route paths"
```

---

## Task 7: Frontend config hooks

**Files:**
- Create: `packages/twenty-front/src/modules/settings/data-model/web-forms/types/WebForm.ts`
- Create: `packages/twenty-front/src/modules/settings/data-model/web-forms/graphql/queries/getWebForms.ts`
- Create: `packages/twenty-front/src/modules/settings/data-model/web-forms/graphql/mutations/updateWebForms.ts`
- Create: `packages/twenty-front/src/modules/settings/data-model/web-forms/hooks/useWebForms.ts`
- Create: `packages/twenty-front/src/modules/settings/data-model/web-forms/hooks/useUpdateWebForms.ts`

**Interfaces:**
- Consumes: the metadata GraphQL `webForms` query + `updateWebForms` mutation (Task 2).
- Produces: frontend `type WebForm`; `useWebForms(): { webForms: WebForm[]; loading: boolean }`; `useUpdateWebForms(): { updateWebForms: (forms: WebForm[]) => Promise<void> }`.

**Reference:** `useOpportunityMonthlyGoal.ts` / `useUpdateOpportunityMonthlyGoal.ts` and their `graphql/queries|mutations` files — these use the **metadata** GraphQL client. Copy their exact client/context usage (they call `useQuery`/`useMutation` with the metadata client options). Match that mechanism precisely.

- [ ] **Step 1: Frontend WebForm type**

```typescript
// types/WebForm.ts
export type WebForm = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  stage: string;
  dealNameTemplate: string;
  thankYouText: string;
};
```

- [ ] **Step 2: Query + mutation documents** (mirror the monthly-goal ones exactly, renaming)

```typescript
// graphql/queries/getWebForms.ts
import { gql } from '@apollo/client';

export const GET_WEB_FORMS = gql`
  query GetWebForms {
    webForms
  }
`;
```
```typescript
// graphql/mutations/updateWebForms.ts
import { gql } from '@apollo/client';

export const UPDATE_WEB_FORMS = gql`
  mutation UpdateWebForms($input: UpdateWebFormsInput!) {
    updateWebForms(input: $input)
  }
`;
```

- [ ] **Step 3: Hooks** (mirror `useOpportunityMonthlyGoal` / `useUpdateOpportunityMonthlyGoal`, including the metadata-client options those hooks pass to `useQuery`/`useMutation`)

`useWebForms` reads `data?.webForms?.forms ?? []`. `useUpdateWebForms` calls the mutation with `variables: { input: { value: { forms } } }` and refetches `GET_WEB_FORMS`.

```typescript
// hooks/useWebForms.ts
import { useQuery } from '@apollo/client';

import { GET_WEB_FORMS } from '@/settings/data-model/web-forms/graphql/queries/getWebForms';
import { type WebForm } from '@/settings/data-model/web-forms/types/WebForm';
// import the SAME metadata-client options object the monthly-goal query hook uses

export const useWebForms = (): { webForms: WebForm[]; loading: boolean } => {
  const { data, loading } = useQuery(GET_WEB_FORMS, {
    // spread the metadata-client context/options exactly as useOpportunityMonthlyGoal does
  });

  const webForms: WebForm[] = data?.webForms?.forms ?? [];

  return { webForms, loading };
};
```
```typescript
// hooks/useUpdateWebForms.ts
import { useMutation } from '@apollo/client';

import { UPDATE_WEB_FORMS } from '@/settings/data-model/web-forms/graphql/mutations/updateWebForms';
import { GET_WEB_FORMS } from '@/settings/data-model/web-forms/graphql/queries/getWebForms';
import { type WebForm } from '@/settings/data-model/web-forms/types/WebForm';

export const useUpdateWebForms = (): {
  updateWebForms: (forms: WebForm[]) => Promise<void>;
} => {
  const [mutate] = useMutation(UPDATE_WEB_FORMS, {
    // same metadata-client options as useUpdateOpportunityMonthlyGoal
    refetchQueries: [{ query: GET_WEB_FORMS }],
  });

  const updateWebForms = async (forms: WebForm[]): Promise<void> => {
    await mutate({ variables: { input: { value: { forms } } } });
  };

  return { updateWebForms };
};
```

- [ ] **Step 4: Typecheck the module**

Run: `npx nx typecheck twenty-front` (or lint the new files if typecheck is slow). Expected: 0 errors for these files. If the metadata-client import path is wrong, copy it verbatim from `useOpportunityMonthlyGoal.ts`.

- [ ] **Step 5: Commit**

```bash
git add packages/twenty-front/src/modules/settings/data-model/web-forms
git commit -m "feat(front): web forms config hooks"
```

---

## Task 8: Settings manage page

**Files:**
- Create: `packages/twenty-front/src/pages/settings/data-model/SettingsObjectOpportunityWebForms.tsx`

**Interfaces:**
- Consumes: `useWebForms`, `useUpdateWebForms` (Task 7), `REACT_APP_SERVER_BASE_URL` (`~/config`), Opportunity stage options (via `useObjectMetadataItem` for `opportunity` → the `stage` field options), `useSnackBar`, `v4` from `uuid`.
- Produces: a settings page listing forms with inline create/edit/delete + save; renders each form's public URL `${REACT_APP_SERVER_BASE_URL}/forms/${workspaceId}/${form.id}` with a copy button.

**Reference:** `SettingsObjectOpportunityGoal.tsx` for the `SettingsPageLayout` shell, breadcrumb `links`, skeleton-gating (`SettingsSectionSkeletonLoader` while `loading`, so a blank-load save cannot wipe the array), and `useSnackBar` success toast. `TextInput` from `@/ui/input/components/TextInput`, `Button` from `twenty-ui/input`, `Select` from `@/ui/input/components/Select` for the stage picker.

- [ ] **Step 1: Build the page**

State: `const [forms, setForms] = useState<WebForm[]>([])`, seeded once from `useWebForms` when `!loading` (guard: only seed while not yet seeded). Workspace id from the existing current-workspace state (`useRecoilValue(currentWorkspaceState)` → `.id`; confirm the atom name used elsewhere, e.g. in a settings page that needs workspace id). Stage options from `useObjectMetadataItem({ objectNameSingular: CoreObjectNameSingular.Opportunity })` → find field `name === 'stage'` → `.options` sorted by `position`, mapped to `{ label, value }`.

Actions:
- "Neues Formular" → append `{ id: v4(), title: 'Neues Formular', description: '', enabled: true, stage: firstStageValue, dealNameTemplate: 'Web-Lead: {firstName} {lastName}', thankYouText: 'Danke für deine Anfrage.' }`.
- Per form: `TextInput` for title / description / dealNameTemplate / thankYouText, `Select` for stage, a toggle for `enabled`, a delete button, and a read-only public URL + copy button (`navigator.clipboard.writeText(url)` + snackbar).
- "Speichern" → `await updateWebForms(forms)` + success snackbar.

Skeleton-gate: while `loading`, render `SettingsSectionSkeletonLoader` and do not render the editable list (prevents seeding from an empty state and wiping saved forms).

Provide the full component (mirror the goal page's structure; the list is a `.map` over `forms` with `setForms(forms.map(f => f.id === id ? { ...f, [key]: value } : f))` updaters). Use existing settings layout primitives (`SettingsPageContainer`, `Section`, `H2Title`) as the goal page does.

- [ ] **Step 2: Typecheck**

Run: `npx nx typecheck twenty-front`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add packages/twenty-front/src/pages/settings/data-model/SettingsObjectOpportunityWebForms.tsx
git commit -m "feat(front): web forms settings page"
```

---

## Task 9: Settings route + object-settings link

**Files:**
- Modify: `packages/twenty-front/src/modules/app/components/SettingsRoutes.tsx`
- Modify: `packages/twenty-front/src/modules/settings/data-model/object-details/components/tabs/ObjectSettings.tsx`

**Interfaces:**
- Consumes: `SettingsPath.ObjectWebForms` (Task 6), `SettingsObjectOpportunityWebForms` (Task 8).

- [ ] **Step 1: Lazy import + route** (mirror the `SettingsObjectOpportunityGoal` lazy import + `<Route path={SettingsPath.ObjectGoal} ... />` lines)

Add lazy import near the goal one:
```typescript
const SettingsObjectOpportunityWebForms = lazy(() =>
  import(
    '~/pages/settings/data-model/SettingsObjectOpportunityWebForms'
  ).then((module) => ({ default: module.SettingsObjectOpportunityWebForms })),
);
```
Add the route inside the same object-detail protected group as `ObjectGoal`:
```tsx
<Route
  path={SettingsPath.ObjectWebForms}
  element={<SettingsObjectOpportunityWebForms />}
/>
```

- [ ] **Step 2: Gated link in ObjectSettings.tsx** (mirror the Goal block at the Opportunity-gated section)

Add, next to the Goal `<StyledFormSectionContainer>`, an Opportunity-gated `Button to={getSettingsPath(SettingsPath.ObjectWebForms, { objectNamePlural })}` labelled `t\`Web-Formulare\`` with a suitable icon (e.g. `IconForms` if exported by `twenty-ui/display`, else `IconWorldWww`; verify the icon exists before using).

- [ ] **Step 3: Typecheck + lint**

Run: `npx nx typecheck twenty-front`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add packages/twenty-front/src/modules/app/components/SettingsRoutes.tsx packages/twenty-front/src/modules/settings/data-model/object-details/components/tabs/ObjectSettings.tsx
git commit -m "feat(front): web forms settings route + link"
```

---

## Task 10: Public form page + unauthenticated route

**Files:**
- Create: `packages/twenty-front/src/pages/web-form/PublicWebFormPage.tsx`
- Modify: `packages/twenty-front/src/modules/app/hooks/useCreateRootAppRouter.tsx`
- Modify: `packages/twenty-front/src/modules/app/hooks/useCreateWorkspaceAppRouter.tsx`

**Interfaces:**
- Consumes: `AppPath.WebFormPage` (Task 6), `REACT_APP_SERVER_BASE_URL` (`~/config`), `useParams` for `workspaceId` + `formId`. Uses plain `fetch` (not Apollo) since this page is unauthenticated and cross-service.
- Produces: an unauthenticated page at `/forms/:workspaceId/:formId`.

- [ ] **Step 1: Build the page**

Behavior:
- On mount, `fetch(\`\${REACT_APP_SERVER_BASE_URL}/forms/\${workspaceId}/\${formId}\`)`. If not ok → "Formular nicht gefunden" state. Else store `{ title, description, thankYouText }`.
- Render a centered card: title, description, inputs for Vorname, Nachname, E-Mail (required), Telefon, Jobtitel, plus a visually-hidden honeypot input named `_hp` (wrapper `style={{ position: 'absolute', left: '-9999px' }}`, `tabIndex={-1}`, `autoComplete="off"`).
- On submit: prevent default, client-validate email non-empty + basic regex, `fetch` POST `\`\${REACT_APP_SERVER_BASE_URL}/forms/\${workspaceId}/\${formId}/submit\`` with `headers: { 'Content-Type': 'application/json' }` and JSON body `{ firstName, lastName, email, phone, jobTitle, _hp }`. On ok → show `thankYouText`; on non-ok → generic "Etwas ist schiefgelaufen." message.
- Local `useState` for each field, a `status: 'form' | 'submitting' | 'done' | 'error' | 'notFound'`.

Use plain styled components (Linaria `styled`) for a minimal centered card. Do not depend on workspace/auth providers. Keep it self-contained so it renders inside an iframe.

Provide the full component (all inputs, handlers, states) — no placeholders.

- [ ] **Step 2: Register the unauthenticated route in both routers**

In `useCreateRootAppRouter.tsx` and `useCreateWorkspaceAppRouter.tsx`, add a `<Route path={AppPath.WebFormPage} element={<PublicWebFormPage />} />` alongside the existing unauthenticated auth-flow routes (SignInUp / Invite), NOT inside the authenticated `DefaultLayout` / `MainAppLayoutWithSidePanel` group. Lazy-import the page like the sibling public pages are imported. Ensure `PageChangeEffect` does not redirect this path to sign-in: check the `PageChangeEffect.tsx` path handling and, if unauthenticated paths are enumerated there, add `AppPath.WebFormPage` to the allowed/no-redirect set (mirror how `AppPath.Invite` is treated).

- [ ] **Step 3: Verify no auth redirect**

Boot front (`npx nx start twenty-front`), open `http://localhost:3001/forms/03655638-583c-49b0-82f0-b4583bffaa1e/nope` in the in-app browser while logged out (or in a fresh context). Expected: the "Formular nicht gefunden" state renders (page reached, no redirect to /sign-in). If it redirects, fix `PageChangeEffect` allow-list.

- [ ] **Step 4: Commit**

```bash
git add packages/twenty-front/src/pages/web-form/PublicWebFormPage.tsx packages/twenty-front/src/modules/app/hooks/useCreateRootAppRouter.tsx packages/twenty-front/src/modules/app/hooks/useCreateWorkspaceAppRouter.tsx packages/twenty-front/src/modules/app/effect-components/PageChangeEffect.tsx
git commit -m "feat(front): public web form page + route"
```

---

## Task 11: de-DE strings + final wiring check

**Files:**
- Modify: `packages/twenty-front/src/locales/generated/de-DE.po` (+ the source catalog if the repo extracts first)

**Interfaces:** none (i18n only).

- [ ] **Step 1: Extract catalogs**

Run: `npx nx run twenty-front:lingui:extract`
Expected: new msgids for the German-source strings added in Tasks 8-10 (Web-Formulare, Neues Formular, Speichern, Vorname, Nachname, E-Mail, Telefon, Jobtitel, Formular nicht gefunden, thank-you defaults, etc.).

- [ ] **Step 2: Fill de-DE msgstr**

For every new msgid in `de-DE.po` with an empty `msgstr`, fill the identity German string (source is already German). Do not blank sibling entries. Catalog churn across ~40 files is mechanical and expected.

- [ ] **Step 3: Typecheck + lint the whole diff**

Run: `npx nx typecheck twenty-front && npx nx typecheck twenty-server`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add packages/twenty-front/src/locales
git commit -m "feat(front): web forms de-DE strings"
```

---

## Live-verification (after Task 11, before finishing the branch)

Backend restarted (registers new resolver + controller); front + worker running; Docker up.

1. **Settings CRUD:** Settings → Opportunity object → "Web-Formulare". Create a form (title "Website-Kontakt", stage Neu, template `Web-Lead: {firstName} {lastName}`, thank-you "Danke!"), Save. Verify via Postgres MCP (read-only): `core.keyValuePair` row key `WEB_FORMS`, value `{ forms: [ { id, title, stage: 'NEW', ... } ] }`.
2. **Public GET:** open `${origin}/forms/<workspaceId>/<formId>` (the copied URL) in the in-app browser → renders title/description/fields.
3. **Submit:** fill Vorname/Nachname/E-Mail/Telefon/Jobtitel, submit → thank-you text shows.
4. **DB check (Postgres MCP):** a new `person` row with the name/email/phone/jobTitle, and a new `opportunity` row with the templated name, `stage = NEW`, `pointOfContactId` = the new person's id, `status = OPEN`. Confirm the deal appears on the board in stage Neu and its point-of-contact is the new person.
5. **Honeypot:** POST with `_hp` set (via a crafted request in the in-app browser console `fetch`) → 200 but NO new records.
6. **Disabled form:** toggle the form off + Save → public GET returns 404 / "Formular nicht gefunden".
7. Clean up dev data created during verification (delete the test person + opportunity, or leave a note in the ledger listing them).

---

## Self-review notes (author)
- Spec coverage: config storage (T1), settings resolver (T2), settings UI list/create/edit/delete + copy URL (T7-T9), public GET/POST (T5), Person+Opportunity create (T4/T5), public page (T10), honeypot+throttle (T5), de-DE (T11). All Slice A spec items mapped.
- Deviation from spec: submissions are created via **direct twenty-orm `GlobalWorkspaceOrmManager` inserts** (the proven `CreatePersonService` system-context pattern) rather than `CreateRecordService`. Reason: composite-field inserts + relation join columns under a no-user system context are exactly what `CreatePersonService`/`CreateCompanyAndPersonService` already do; `CreateRecordService` would also work (its `rolePermissionConfig: { shouldBypassPermissionChecks: true }` path bypasses the auth-context-type check) but adds indirection. Record semantics (Person + Opportunity, stage, pointOfContact) are unchanged.
- Known Slice A limitations (carried from spec): no cross-record transaction (Opportunity insert failing after Person insert leaves an orphan Person); throttle surfaces as 500 not 429; company/message/dedup/captcha deferred.
- Wiring risk flagged inline (T5 Step 3): the exact `TwentyORMModule` symbol + `'core'` datasource token for the `WorkspaceEntity` repo must be verified against `workflow-api.module.ts`; boot check in T5 Step 5 catches a mistake immediately.
