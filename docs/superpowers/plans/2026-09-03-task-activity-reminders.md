# Activity Reminders (Daily Task Digest Email) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A daily cron emails each assignee a digest of their overdue + due-today open tasks, opt-in per workspace.

**Architecture:** A cron job (on the cron queue) runs daily and calls `TaskReminderService`, which iterates active workspaces, skips those whose KeyValuePair toggle is off, reads each workspace's overdue/due-today open tasks with an assignee, groups them by assignee, and sends one digest email per assignee via the existing `EmailService` + a new `twenty-emails` template. A settings toggle (KeyValuePair config resolver + page) enables it per workspace.

**Tech Stack:** NestJS, TypeORM (twenty-orm workspace repositories), BullMQ cron queue, React-Email (twenty-emails), Lingui i18n, React/Linaria, Jest.

## Global Constraints

- No signatures / Co-Authored-By / "Generated with Claude" anywhere.
- **Never modify or copy from `/* @license Enterprise */` files.** In particular do NOT read/mirror `billing-reminder.service.ts` (Enterprise). Base the cron job/command on the AGPL `calendar-ongoing-stale.cron.job.ts` and its command; base the email-send on `workspace-invitation.service.ts` (AGPL) and `EmailService`.
- Named exports only; types over interfaces; no `any`; `isDefined`/`isNonEmptyString` from `twenty-shared/utils` (isNonEmptyString: use `@sniptt/guards` per fork convention).
- Delivery is email only (Twenty has no in-app notification object). Toggle default OFF (opt-in). Schedule fixed `0 6 * * *` (06:00 UTC). Day boundaries in UTC.
- After a server change to a resolver/module/cron/service: restart the backend and confirm boot (`curl -s -o /dev/null -w "%{http_code}" -X POST localhost:3000/metadata -H 'Content-Type: application/json' -d '{"query":"{__typename}"}'` = 200) before committing.
- Run `npx nx typecheck twenty-server` (not just jest) on server changes; `npx nx typecheck twenty-front` on FE changes; lint touched files. All 0 before commit.
- After a twenty-shared change: `npx nx build twenty-shared` + `rm -rf packages/twenty-front/node_modules/.vite`. After a twenty-emails change: `npx nx build twenty-emails` (the server imports it as a built package).
- Dev workspace id `03655638-583c-49b0-82f0-b4583bffaa1e`, schema `workspace_78jtyayrql5p8djgplk9x6vy`. Prefilled login user is tim@apple.dev (a workspace member).

---

## File structure

Server:
- `src/modules/task-reminder/utils/build-task-digest.util.ts` (+ `__tests__`) — pure split overdue/today.
- `src/modules/task-reminder/types/task-reminders-key-value.type.ts` — key + config type + TypeMap.
- `src/modules/task-reminder/services/task-reminder-config.service.ts` (+ `__tests__`) — KeyValuePair get/set.
- `src/modules/task-reminder/dtos/update-task-reminders.input.ts`
- `src/modules/task-reminder/resolvers/task-reminder-config.resolver.ts`
- `src/modules/task-reminder/task-reminder-config.module.ts` — config service + resolver (registered in core-engine).
- `src/modules/task-reminder/services/task-reminder.service.ts` — the cron worker logic.
- `src/modules/task-reminder/constants/task-reminder.cron-pattern.constant.ts`
- `src/modules/task-reminder/crons/task-reminder.cron.job.ts`
- `src/modules/task-reminder/crons/commands/task-reminder.cron.command.ts`
- `src/modules/task-reminder/task-reminder.module.ts` — job + command + service.
- Modify: `src/engine/core-modules/core-engine.module.ts` (register config module), `src/database/commands/cron-register-all.command.ts` (register cron command), and the module that wires cron commands for the command context (see Task 5).

twenty-emails:
- `packages/twenty-emails/src/emails/task-reminder.email.tsx` + export in `packages/twenty-emails/src/index.ts`.

Frontend:
- `packages/twenty-shared/src/types/SettingsPath.ts` — `ObjectTaskReminders`.
- `.../modules/settings/data-model/task-reminders/{types,graphql,hooks}` — config hooks.
- `packages/twenty-front/src/pages/settings/data-model/SettingsObjectTaskReminders.tsx` — toggle page.
- Modify `SettingsRoutes.tsx` + `ObjectSettings.tsx` (Task-gated link).
- de-DE catalog.

---

## Task 1: Digest builder util (TDD)

**Files:**
- Create: `packages/twenty-server/src/modules/task-reminder/utils/build-task-digest.util.ts`
- Test: `packages/twenty-server/src/modules/task-reminder/utils/__tests__/build-task-digest.util.spec.ts`

**Interfaces:**
- Produces: `type TaskDigestInput = { title: string | null; dueAt: Date; linkedRecordName: string | null }`; `type TaskDigestItem = { title: string; dueAt: Date; linkedRecordName: string | null }`; `buildTaskDigest(tasks: TaskDigestInput[], now: Date): { overdue: TaskDigestItem[]; today: TaskDigestItem[] }`. Splits by UTC start-of-day: `dueAt` before today's UTC midnight → `overdue`, otherwise → `today`. `title` falls back to `'Ohne Titel'` when null/empty. Order within each group preserves input order.

- [ ] **Step 1: Write the failing test**

```typescript
import {
  buildTaskDigest,
  type TaskDigestInput,
} from 'src/modules/task-reminder/utils/build-task-digest.util';

const now = new Date('2026-09-03T09:00:00.000Z');

describe('buildTaskDigest', () => {
  it('splits overdue (before today UTC) from today', () => {
    const tasks: TaskDigestInput[] = [
      { title: 'Alt', dueAt: new Date('2026-09-01T10:00:00Z'), linkedRecordName: 'Acme' },
      { title: 'Heute', dueAt: new Date('2026-09-03T15:00:00Z'), linkedRecordName: null },
    ];

    const result = buildTaskDigest(tasks, now);

    expect(result.overdue.map((t) => t.title)).toEqual(['Alt']);
    expect(result.today.map((t) => t.title)).toEqual(['Heute']);
    expect(result.overdue[0].linkedRecordName).toBe('Acme');
  });

  it('treats a due time earlier today as today, not overdue', () => {
    const result = buildTaskDigest(
      [{ title: 'Frueh', dueAt: new Date('2026-09-03T06:00:00Z'), linkedRecordName: null }],
      now,
    );

    expect(result.today).toHaveLength(1);
    expect(result.overdue).toHaveLength(0);
  });

  it('falls back to Ohne Titel for null/empty title', () => {
    const result = buildTaskDigest(
      [{ title: null, dueAt: new Date('2026-09-03T12:00:00Z'), linkedRecordName: null }],
      now,
    );

    expect(result.today[0].title).toBe('Ohne Titel');
  });

  it('returns empty groups for no tasks', () => {
    expect(buildTaskDigest([], now)).toEqual({ overdue: [], today: [] });
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `cd packages/twenty-server && npx jest build-task-digest --config=jest.config.mjs`
Expected: FAIL (module not found).

- [ ] **Step 3: Write the util**

```typescript
import { isNonEmptyString } from '@sniptt/guards';

export type TaskDigestInput = {
  title: string | null;
  dueAt: Date;
  linkedRecordName: string | null;
};

export type TaskDigestItem = {
  title: string;
  dueAt: Date;
  linkedRecordName: string | null;
};

export const buildTaskDigest = (
  tasks: TaskDigestInput[],
  now: Date,
): { overdue: TaskDigestItem[]; today: TaskDigestItem[] } => {
  const startOfTodayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );

  const overdue: TaskDigestItem[] = [];
  const today: TaskDigestItem[] = [];

  for (const task of tasks) {
    const item: TaskDigestItem = {
      title: isNonEmptyString(task.title) ? task.title : 'Ohne Titel',
      dueAt: task.dueAt,
      linkedRecordName: task.linkedRecordName,
    };

    if (task.dueAt.getTime() < startOfTodayUtc) {
      overdue.push(item);
    } else {
      today.push(item);
    }
  }

  return { overdue, today };
};
```

- [ ] **Step 4: Run tests**

Run: `cd packages/twenty-server && npx jest build-task-digest --config=jest.config.mjs`
Expected: PASS (4/4).

- [ ] **Step 5: Commit**

```bash
git add packages/twenty-server/src/modules/task-reminder/utils/build-task-digest.util.ts packages/twenty-server/src/modules/task-reminder/utils/__tests__/build-task-digest.util.spec.ts
git commit -m "feat(server): task digest builder util"
```

---

## Task 2: Config type + service (TDD)

**Files:**
- Create: `packages/twenty-server/src/modules/task-reminder/types/task-reminders-key-value.type.ts`
- Create: `packages/twenty-server/src/modules/task-reminder/services/task-reminder-config.service.ts`
- Test: `packages/twenty-server/src/modules/task-reminder/services/__tests__/task-reminder-config.service.spec.ts`

**Interfaces:**
- Produces: `TASK_REMINDERS_KEY = 'TASK_REMINDERS'`, `type TaskRemindersConfig = { enabled: boolean }`, `type TaskRemindersKeyValueTypeMap`; `TaskReminderConfigService.getConfig(workspaceId): Promise<TaskRemindersConfig>` (returns `{ enabled: false }` when unset) and `setConfig(workspaceId, config): Promise<TaskRemindersConfig>`.

This mirrors `OpportunityMonthlyGoalConfigService` exactly. Cross-check imports against `packages/twenty-server/src/modules/opportunity/services/opportunity-monthly-goal-config.service.ts` and its `types/opportunity-monthly-goal-key-value.type.ts`.

- [ ] **Step 1: Write the type file**

```typescript
export const TASK_REMINDERS_KEY = 'TASK_REMINDERS';

export type TaskRemindersConfig = { enabled: boolean };

export type TaskRemindersKeyValueTypeMap = {
  [TASK_REMINDERS_KEY]: TaskRemindersConfig;
};
```

- [ ] **Step 2: Write the failing service spec** (mirror `opportunity-monthly-goal-config.service.spec.ts`)

```typescript
import { Test, type TestingModule } from '@nestjs/testing';

import { KeyValuePairType } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { KeyValuePairService } from 'src/engine/core-modules/key-value-pair/key-value-pair.service';
import { TaskReminderConfigService } from 'src/modules/task-reminder/services/task-reminder-config.service';
import { TASK_REMINDERS_KEY } from 'src/modules/task-reminder/types/task-reminders-key-value.type';

describe('TaskReminderConfigService', () => {
  const workspaceId = 'ws-1';
  let service: TaskReminderConfigService;
  const get = jest.fn();
  const set = jest.fn();

  beforeEach(async () => {
    get.mockReset();
    set.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskReminderConfigService,
        { provide: KeyValuePairService, useValue: { get, set } },
      ],
    }).compile();
    service = module.get(TaskReminderConfigService);
  });

  it('returns { enabled: false } when nothing is stored', async () => {
    get.mockResolvedValue([]);

    await expect(service.getConfig(workspaceId)).resolves.toEqual({
      enabled: false,
    });
    expect(get).toHaveBeenCalledWith({
      userId: null,
      workspaceId,
      type: KeyValuePairType.CONFIG_VARIABLE,
      key: TASK_REMINDERS_KEY,
    });
  });

  it('returns the stored config', async () => {
    get.mockResolvedValue([{ value: { enabled: true } }]);

    await expect(service.getConfig(workspaceId)).resolves.toEqual({
      enabled: true,
    });
  });

  it('persists the config and returns it', async () => {
    set.mockResolvedValue(undefined);

    await expect(
      service.setConfig(workspaceId, { enabled: true }),
    ).resolves.toEqual({ enabled: true });
    expect(set).toHaveBeenCalledWith({
      userId: null,
      workspaceId,
      type: KeyValuePairType.CONFIG_VARIABLE,
      key: TASK_REMINDERS_KEY,
      value: { enabled: true },
    });
  });
});
```

- [ ] **Step 3: Run it, verify it fails**

Run: `cd packages/twenty-server && npx jest task-reminder-config.service --config=jest.config.mjs`
Expected: FAIL.

- [ ] **Step 4: Write the service**

```typescript
import { Injectable } from '@nestjs/common';

import { KeyValuePairType } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { KeyValuePairService } from 'src/engine/core-modules/key-value-pair/key-value-pair.service';
import {
  TASK_REMINDERS_KEY,
  type TaskRemindersConfig,
  type TaskRemindersKeyValueTypeMap,
} from 'src/modules/task-reminder/types/task-reminders-key-value.type';

@Injectable()
export class TaskReminderConfigService {
  constructor(
    private readonly keyValuePairService: KeyValuePairService<TaskRemindersKeyValueTypeMap>,
  ) {}

  async getConfig(workspaceId: string): Promise<TaskRemindersConfig> {
    const stored = await this.keyValuePairService.get({
      userId: null,
      workspaceId,
      type: KeyValuePairType.CONFIG_VARIABLE,
      key: TASK_REMINDERS_KEY,
    });

    const value = (stored[0] as { value?: TaskRemindersConfig } | undefined)
      ?.value;

    return value ?? { enabled: false };
  }

  async setConfig(
    workspaceId: string,
    config: TaskRemindersConfig,
  ): Promise<TaskRemindersConfig> {
    await this.keyValuePairService.set({
      userId: null,
      workspaceId,
      type: KeyValuePairType.CONFIG_VARIABLE,
      key: TASK_REMINDERS_KEY,
      value: config,
    });

    return config;
  }
}
```

- [ ] **Step 5: Run tests**

Run: `cd packages/twenty-server && npx jest task-reminder-config.service --config=jest.config.mjs`
Expected: PASS (3/3).

- [ ] **Step 6: Commit**

```bash
git add packages/twenty-server/src/modules/task-reminder/types/task-reminders-key-value.type.ts packages/twenty-server/src/modules/task-reminder/services/task-reminder-config.service.ts packages/twenty-server/src/modules/task-reminder/services/__tests__/task-reminder-config.service.spec.ts
git commit -m "feat(server): task reminder config service"
```

---

## Task 3: Config resolver + DTO + module + registration

**Files:**
- Create: `packages/twenty-server/src/modules/task-reminder/dtos/update-task-reminders.input.ts`
- Create: `packages/twenty-server/src/modules/task-reminder/resolvers/task-reminder-config.resolver.ts`
- Create: `packages/twenty-server/src/modules/task-reminder/task-reminder-config.module.ts`
- Modify: `packages/twenty-server/src/engine/core-modules/core-engine.module.ts`

**Interfaces:**
- Consumes: `TaskReminderConfigService` (Task 2).
- Produces: metadata query `taskReminders` (→ `TaskRemindersConfig`) + mutation `updateTaskReminders(input: { value: TaskRemindersConfig })`; `TaskReminderConfigModule` exporting the service.

Mirror `WebFormConfigResolver`/`web-form-config.module.ts` (or the monthly-goal pair). The query returns NON-nullable `GraphQLJSON` (service always returns an object).

- [ ] **Step 1: DTO**

```typescript
import { Field, InputType } from '@nestjs/graphql';

import { IsNotEmpty, IsObject } from 'class-validator';
import GraphQLJSON from 'graphql-type-json';

import { type TaskRemindersConfig } from 'src/modules/task-reminder/types/task-reminders-key-value.type';

@InputType('UpdateTaskRemindersInput')
export class UpdateTaskRemindersInput {
  @IsObject()
  @IsNotEmpty()
  @Field(() => GraphQLJSON)
  value: TaskRemindersConfig;
}
```

- [ ] **Step 2: Resolver**

```typescript
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
import { UpdateTaskRemindersInput } from 'src/modules/task-reminder/dtos/update-task-reminders.input';
import { TaskReminderConfigService } from 'src/modules/task-reminder/services/task-reminder-config.service';
import { type TaskRemindersConfig } from 'src/modules/task-reminder/types/task-reminders-key-value.type';

@UseGuards(WorkspaceAuthGuard)
@UsePipes(ResolverValidationPipe)
@MetadataResolver()
export class TaskReminderConfigResolver {
  constructor(
    private readonly taskReminderConfigService: TaskReminderConfigService,
  ) {}

  @UseGuards(NoPermissionGuard)
  @Query(() => GraphQLJSON)
  async taskReminders(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TaskRemindersConfig> {
    return this.taskReminderConfigService.getConfig(workspaceId);
  }

  @UseGuards(SettingsPermissionGuard(PermissionFlagType.DATA_MODEL))
  @Mutation(() => GraphQLJSON)
  async updateTaskReminders(
    @Args('input') input: UpdateTaskRemindersInput,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TaskRemindersConfig> {
    return this.taskReminderConfigService.setConfig(workspaceId, input.value);
  }
}
```

- [ ] **Step 3: Config module** (only the config service + resolver; the cron pieces are a separate module in Task 5)

```typescript
import { Module } from '@nestjs/common';

import { KeyValuePairModule } from 'src/engine/core-modules/key-value-pair/key-value-pair.module';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { TaskReminderConfigResolver } from 'src/modules/task-reminder/resolvers/task-reminder-config.resolver';
import { TaskReminderConfigService } from 'src/modules/task-reminder/services/task-reminder-config.service';

@Module({
  imports: [KeyValuePairModule, PermissionsModule],
  providers: [TaskReminderConfigService, TaskReminderConfigResolver],
  exports: [TaskReminderConfigService],
})
export class TaskReminderConfigModule {}
```

- [ ] **Step 4: Register in core-engine.module.ts**

Add `import { TaskReminderConfigModule } from 'src/modules/task-reminder/task-reminder-config.module';` and add `TaskReminderConfigModule,` to the module `imports` array (next to `WebFormConfigModule`).

- [ ] **Step 5: Typecheck + lint + restart + boot**

Run: `npx nx typecheck twenty-server` → 0. Lint the 4 files → 0. Restart backend, confirm metadata 200, and confirm the query registers:
```bash
curl -s -X POST localhost:3000/metadata -H 'Content-Type: application/json' -d '{"query":"{ __type(name:\"Query\"){ fields { name } } }"}' | grep -o taskReminders || echo "NOT FOUND (needs auth-scoped introspection; ok if boot 200)"
```
(Boot 200 is the gate; the metadata schema is auth-scoped so introspection may not list it unauthenticated.)

- [ ] **Step 6: Commit**

```bash
git add packages/twenty-server/src/modules/task-reminder/dtos/update-task-reminders.input.ts packages/twenty-server/src/modules/task-reminder/resolvers/task-reminder-config.resolver.ts packages/twenty-server/src/modules/task-reminder/task-reminder-config.module.ts packages/twenty-server/src/engine/core-modules/core-engine.module.ts
git commit -m "feat(server): task reminder config resolver"
```

---

## Task 4: Email template (twenty-emails)

**Files:**
- Create: `packages/twenty-emails/src/emails/task-reminder.email.tsx`
- Modify: `packages/twenty-emails/src/index.ts`

**Interfaces:**
- Produces: `type TaskReminderLine = { title: string; due: string; linkedRecordName: string | null }`; `TaskReminderEmail(props: { userName: string; overdue: TaskReminderLine[]; today: TaskReminderLine[]; locale: keyof typeof APP_LOCALES })` React-Email component, exported from the package index.

Mirror `warn-suspended-workspace.email.tsx` (AGPL) for the imports/shape (`BaseEmail`, `Title`, `MainText`, `Trans`, `createI18nInstance`). Do NOT copy any Enterprise/billing template.

- [ ] **Step 1: Write the template**

```tsx
import { Trans } from '@lingui/react';
import { BaseEmail } from 'src/components/BaseEmail';
import { MainText } from 'src/components/MainText';
import { Title } from 'src/components/Title';
import { createI18nInstance } from 'src/utils/i18n.utils';
import { type APP_LOCALES } from 'twenty-shared/translations';

export type TaskReminderLine = {
  title: string;
  due: string;
  linkedRecordName: string | null;
};

type TaskReminderEmailProps = {
  userName: string;
  overdue: TaskReminderLine[];
  today: TaskReminderLine[];
  locale: keyof typeof APP_LOCALES;
};

const renderLine = (line: TaskReminderLine) => {
  const suffix = line.linkedRecordName ? ` (${line.linkedRecordName})` : '';

  return (
    <span key={`${line.title}-${line.due}`}>
      • {line.title}
      {suffix} — {line.due}
      <br />
    </span>
  );
};

export const TaskReminderEmail = ({
  userName,
  overdue,
  today,
  locale,
}: TaskReminderEmailProps) => {
  const i18n = createI18nInstance(locale);

  return (
    <BaseEmail width={333} locale={locale}>
      <Title value={i18n._('Deine fälligen Aktivitäten')} />
      <MainText>
        {userName.length > 1 ? (
          <Trans id="Hi {userName}," values={{ userName }} />
        ) : (
          <Trans id="Hallo," />
        )}
        <br />
        <br />
        {overdue.length > 0 ? (
          <>
            <b>{i18n._('Überfällig')}</b>
            <br />
            {overdue.map(renderLine)}
            <br />
          </>
        ) : null}
        {today.length > 0 ? (
          <>
            <b>{i18n._('Heute fällig')}</b>
            <br />
            {today.map(renderLine)}
          </>
        ) : null}
      </MainText>
      <br />
      <br />
    </BaseEmail>
  );
};

TaskReminderEmail.PreviewProps = {
  userName: 'Tim Apple',
  overdue: [{ title: 'Angebot nachfassen', due: '01.09.2026', linkedRecordName: 'Acme GmbH' }],
  today: [{ title: 'Demo vorbereiten', due: '03.09.2026', linkedRecordName: null }],
  locale: 'de',
};

export default TaskReminderEmail;
```

- [ ] **Step 2: Export from the package index**

In `packages/twenty-emails/src/index.ts`, add (matching the existing export style):
```typescript
export * from './emails/task-reminder.email';
```
(If the file uses named re-exports like `export { WarnSuspendedWorkspaceEmail } from './emails/...'`, match that form: `export { TaskReminderEmail, type TaskReminderLine } from './emails/task-reminder.email';`.)

- [ ] **Step 3: Build twenty-emails + typecheck**

Run: `npx nx build twenty-emails` → succeeds. `npx nx typecheck twenty-emails` → 0.

- [ ] **Step 4: Commit**

```bash
git add packages/twenty-emails/src/emails/task-reminder.email.tsx packages/twenty-emails/src/index.ts
git commit -m "feat(emails): task reminder digest template"
```

---

## Task 5: Reminder service + cron job + command + registration

**Files:**
- Create: `packages/twenty-server/src/modules/task-reminder/constants/task-reminder.cron-pattern.constant.ts`
- Create: `packages/twenty-server/src/modules/task-reminder/services/task-reminder.service.ts`
- Create: `packages/twenty-server/src/modules/task-reminder/crons/task-reminder.cron.job.ts`
- Create: `packages/twenty-server/src/modules/task-reminder/crons/commands/task-reminder.cron.command.ts`
- Create: `packages/twenty-server/src/modules/task-reminder/task-reminder.module.ts`
- Modify: `packages/twenty-server/src/database/commands/cron-register-all.command.ts`
- Modify: the module that provides cron commands to the command context (see Step 6).

**Interfaces:**
- Consumes: `buildTaskDigest` + `TaskDigestInput` (Task 1); `TaskReminderConfigService` (Task 2); `TaskReminderEmail` + `TaskReminderLine` (Task 4, from `twenty-emails`); `GlobalWorkspaceOrmManager`, `buildSystemAuthContext`, `TaskWorkspaceEntity`, `WorkspaceEntity`, `EmailService`, `I18nService`, `TwentyConfigService`.
- Produces: `TaskReminderService.sendDailyDigests(): Promise<void>`; `TaskReminderCronJob` (cron-queue processor); `TaskReminderCronCommand` (`cron:task:reminders`).

**Reference (AGPL only):** cron job/command shape from `calendar-ongoing-stale.cron.job.ts` + `.../commands/calendar-ongoing-stale.cron.command.ts`; email send from `workspace-invitation.service.ts` (`renderEmail`, `i18nService.getI18nInstance(locale)._(msg\`...\`)`, `emailService.send({ from, to, subject, html, text })`, `EMAIL_FROM_NAME`/`EMAIL_FROM_ADDRESS` from `TwentyConfigService`). Do NOT read `billing-reminder.service.ts` (Enterprise).

- [ ] **Step 1: Cron pattern constant**

```typescript
export const TASK_REMINDER_CRON_PATTERN = '0 6 * * *';
```

- [ ] **Step 2: The service**

Active-workspace fetch via the core `WorkspaceEntity` repo; per-workspace task read via `GlobalWorkspaceOrmManager`. Query open tasks due up to end-of-today UTC with the assignee + targets loaded, group by assignee, build the digest, render + send. Errors per workspace are caught + logged.

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { msg } from '@lingui/core/macro';
import { TaskReminderEmail, renderEmail } from 'twenty-emails';
import { isDefined } from 'twenty-shared/utils';
import { WorkspaceActivationStatus } from 'twenty-shared/workspace';
import { In, IsNull, LessThanOrEqual, Repository } from 'typeorm';

import { EmailService } from 'src/engine/core-modules/email/email.service';
import { I18nService } from 'src/engine/core-modules/i18n/i18n.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { TaskWorkspaceEntity } from 'src/modules/task/standard-objects/task.workspace-entity';
import { TaskReminderConfigService } from 'src/modules/task-reminder/services/task-reminder-config.service';
import { buildTaskDigest } from 'src/modules/task-reminder/utils/build-task-digest.util';

@Injectable()
export class TaskReminderService {
  private readonly logger = new Logger(TaskReminderService.name);

  constructor(
    // Cross-workspace cron: no workspaceId is in scope for the core repo.
    // eslint-disable-next-line twenty/prefer-workspace-scoped-repository
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly taskReminderConfigService: TaskReminderConfigService,
    private readonly emailService: EmailService,
    private readonly i18nService: I18nService,
    private readonly twentyConfigService: TwentyConfigService,
  ) {}

  async sendDailyDigests(): Promise<void> {
    const now = new Date();
    const endOfTodayUtc = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );

    const workspaces = await this.workspaceRepository.find({
      select: { id: true },
      where: {
        activationStatus: WorkspaceActivationStatus.ACTIVE,
        deletedAt: IsNull(),
      },
    });

    for (const { id: workspaceId } of workspaces) {
      try {
        const { enabled } =
          await this.taskReminderConfigService.getConfig(workspaceId);

        if (!enabled) {
          continue;
        }

        await this.processWorkspace(workspaceId, now, endOfTodayUtc);
      } catch (error) {
        this.logger.error(
          `Task reminders failed for workspace ${workspaceId}: ${error}`,
        );
      }
    }
  }

  private async processWorkspace(
    workspaceId: string,
    now: Date,
    endOfTodayUtc: Date,
  ): Promise<void> {
    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const taskRepository =
        await this.globalWorkspaceOrmManager.getRepository<TaskWorkspaceEntity>(
          workspaceId,
          'task',
          { shouldBypassPermissionChecks: true },
        );

      const tasks = await taskRepository.find({
        where: {
          status: In(['TODO', 'IN_PROGRESS']),
          dueAt: LessThanOrEqual(endOfTodayUtc),
        },
        relations: {
          assignee: true,
          taskTargets: {
            targetOpportunity: true,
            targetPerson: true,
            targetCompany: true,
          },
        },
      });

      const byAssignee = new Map<string, TaskWorkspaceEntity[]>();

      for (const task of tasks) {
        const assignee = task.assignee;

        if (!isDefined(assignee) || !isDefined(assignee.userEmail)) {
          continue;
        }

        const group = byAssignee.get(assignee.id) ?? [];

        group.push(task);
        byAssignee.set(assignee.id, group);
      }

      for (const group of byAssignee.values()) {
        await this.sendDigestForAssignee(group, now);
      }
    }, authContext);
  }

  private resolveLinkedRecordName(task: TaskWorkspaceEntity): string | null {
    const target = task.taskTargets?.[0];

    if (!isDefined(target)) {
      return null;
    }

    if (isDefined(target.targetOpportunity?.name)) {
      return target.targetOpportunity.name;
    }

    if (isDefined(target.targetPerson?.name)) {
      const { firstName, lastName } = target.targetPerson.name;

      return `${firstName ?? ''} ${lastName ?? ''}`.trim() || null;
    }

    if (isDefined(target.targetCompany?.name)) {
      return target.targetCompany.name;
    }

    return null;
  }

  private async sendDigestForAssignee(
    tasks: TaskWorkspaceEntity[],
    now: Date,
  ): Promise<void> {
    const assignee = tasks[0].assignee;

    if (!isDefined(assignee) || !isDefined(assignee.userEmail)) {
      return;
    }

    const digest = buildTaskDigest(
      tasks.map((task) => ({
        title: task.title,
        dueAt: task.dueAt as Date,
        linkedRecordName: this.resolveLinkedRecordName(task),
      })),
      now,
    );

    if (digest.overdue.length === 0 && digest.today.length === 0) {
      return;
    }

    const toLine = (item: {
      title: string;
      dueAt: Date;
      linkedRecordName: string | null;
    }) => ({
      title: item.title,
      due: item.dueAt.toLocaleDateString('de-DE'),
      linkedRecordName: item.linkedRecordName,
    });

    const userName =
      `${assignee.name.firstName ?? ''} ${assignee.name.lastName ?? ''}`.trim();
    const locale = assignee.locale;
    const i18n = this.i18nService.getI18nInstance(locale);

    const emailTemplate = TaskReminderEmail({
      userName,
      overdue: digest.overdue.map(toLine),
      today: digest.today.map(toLine),
      locale,
    });

    const html = await renderEmail(emailTemplate, { pretty: true });
    const text = await renderEmail(emailTemplate, { plainText: true });

    await this.emailService.send({
      to: assignee.userEmail,
      from: `${this.twentyConfigService.get('EMAIL_FROM_NAME')} <${this.twentyConfigService.get('EMAIL_FROM_ADDRESS')}>`,
      subject: i18n._(msg`Deine fälligen Aktivitäten`),
      html,
      text,
    });
  }
}
```

Note: verify `renderEmail` accepts `{ pretty: true }` / `{ plainText: true }` (it does in `workspace-invitation.service.ts`). Verify `I18nService.getI18nInstance` + `msg` usage against `workspace-invitation.service.ts`. If the task-target relation names differ (`targetOpportunity`/`targetPerson`/`targetCompany`), correct them against `task-target.workspace-entity.ts`.

- [ ] **Step 3: Cron job** (mirror `calendar-ongoing-stale.cron.job.ts` shape)

```typescript
import { SentryCronMonitor } from 'src/engine/core-modules/cron/sentry-cron-monitor.decorator';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { TASK_REMINDER_CRON_PATTERN } from 'src/modules/task-reminder/constants/task-reminder.cron-pattern.constant';
import { TaskReminderService } from 'src/modules/task-reminder/services/task-reminder.service';

@Processor(MessageQueue.cronQueue)
export class TaskReminderCronJob {
  constructor(private readonly taskReminderService: TaskReminderService) {}

  @Process(TaskReminderCronJob.name)
  @SentryCronMonitor(TaskReminderCronJob.name, TASK_REMINDER_CRON_PATTERN)
  async handle(): Promise<void> {
    await this.taskReminderService.sendDailyDigests();
  }
}
```

- [ ] **Step 4: Cron command** (mirror the calendar/billing cron command)

```typescript
import { Command, CommandRunner } from 'nest-commander';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { TASK_REMINDER_CRON_PATTERN } from 'src/modules/task-reminder/constants/task-reminder.cron-pattern.constant';
import { TaskReminderCronJob } from 'src/modules/task-reminder/crons/task-reminder.cron.job';

@Command({
  name: 'cron:task:reminders',
  description: 'Starts a cron job to email daily task reminder digests',
})
export class TaskReminderCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.messageQueueService.addCron<undefined>({
      jobName: TaskReminderCronJob.name,
      data: undefined,
      options: { repeat: { pattern: TASK_REMINDER_CRON_PATTERN } },
    });
  }
}
```

- [ ] **Step 5: Module**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmailModule } from 'src/engine/core-modules/email/email.module';
import { I18nModule } from 'src/engine/core-modules/i18n/i18n.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { TaskReminderConfigModule } from 'src/modules/task-reminder/task-reminder-config.module';
import { TaskReminderCronCommand } from 'src/modules/task-reminder/crons/commands/task-reminder.cron.command';
import { TaskReminderCronJob } from 'src/modules/task-reminder/crons/task-reminder.cron.job';
import { TaskReminderService } from 'src/modules/task-reminder/services/task-reminder.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkspaceEntity]),
    EmailModule,
    I18nModule,
    TaskReminderConfigModule,
  ],
  providers: [TaskReminderService, TaskReminderCronJob, TaskReminderCronCommand],
  exports: [TaskReminderService, TaskReminderCronCommand],
})
export class TaskReminderModule {}
```

Verify the exact module names/paths: `EmailModule` (`src/engine/core-modules/email/email.module`), `I18nModule` (`src/engine/core-modules/i18n/i18n.module`) — confirm they export `EmailService` / `I18nService`; `GlobalWorkspaceOrmManager` is `@Global()` so needs no import. If `I18nModule` isn't the right provider for `I18nService`, find its module the same way `workspace-invitation` obtains `I18nService`.

- [ ] **Step 6: Register the cron command in the command context + CronRegisterAllCommand**

`CronRegisterAllCommand` (`src/database/commands/cron-register-all.command.ts`) injects every cron command, so `TaskReminderCronCommand` must be provided in the module that provides `CronRegisterAllCommand`. Find where `BillingReminderCronCommand` / `CalendarOngoingStaleCronCommand` reach `CronRegisterAllCommand` (the command module graph — likely a `CommandModule` that imports `BillingReminderModule` etc.) and import `TaskReminderModule` there the same way. Then in `cron-register-all.command.ts`:
- add constructor param `private readonly taskReminderCronCommand: TaskReminderCronCommand,`
- add `{ name: 'TaskReminder', command: this.taskReminderCronCommand },` to the `allCommands` array (no `isEnabled` — the per-workspace toggle gates delivery).
- add the import.

- [ ] **Step 7: Typecheck + lint + restart + boot**

Run: `npx nx typecheck twenty-server` → 0. Lint the new files → 0. Restart backend, confirm metadata 200. A boot failure means the module wiring (Step 5/6) is wrong — fix before committing.

- [ ] **Step 8: Commit**

```bash
git add packages/twenty-server/src/modules/task-reminder/constants/task-reminder.cron-pattern.constant.ts packages/twenty-server/src/modules/task-reminder/services/task-reminder.service.ts packages/twenty-server/src/modules/task-reminder/crons/task-reminder.cron.job.ts packages/twenty-server/src/modules/task-reminder/crons/commands/task-reminder.cron.command.ts packages/twenty-server/src/modules/task-reminder/task-reminder.module.ts packages/twenty-server/src/database/commands/cron-register-all.command.ts
git commit -m "feat(server): daily task reminder cron + digest service"
```

---

## Task 6: Frontend config hooks

**Files:**
- Create: `packages/twenty-front/src/modules/settings/data-model/task-reminders/types/TaskReminders.ts`
- Create: `.../task-reminders/graphql/queries/getTaskReminders.ts`
- Create: `.../task-reminders/graphql/mutations/updateTaskReminders.ts`
- Create: `.../task-reminders/hooks/useTaskReminders.ts`
- Create: `.../task-reminders/hooks/useUpdateTaskReminders.ts`

**Interfaces:**
- Produces: `type TaskReminders = { enabled: boolean }`; `useTaskReminders(): { enabled: boolean; loading: boolean }`; `useUpdateTaskReminders(): { updateTaskReminders: (enabled: boolean) => Promise<unknown> }`.

Mirror the web-forms hooks exactly (`gql` from `@apollo/client`, `useQuery`/`useMutation` from `@apollo/client/react`, no client options).

- [ ] **Step 1: Type + documents + hooks**

```typescript
// types/TaskReminders.ts
export type TaskReminders = { enabled: boolean };
```
```typescript
// graphql/queries/getTaskReminders.ts
import { gql } from '@apollo/client';

export const GET_TASK_REMINDERS = gql`
  query GetTaskReminders {
    taskReminders
  }
`;
```
```typescript
// graphql/mutations/updateTaskReminders.ts
import { gql } from '@apollo/client';

export const UPDATE_TASK_REMINDERS = gql`
  mutation UpdateTaskReminders($input: UpdateTaskRemindersInput!) {
    updateTaskReminders(input: $input)
  }
`;
```
```typescript
// hooks/useTaskReminders.ts
import { useQuery } from '@apollo/client/react';

import { GET_TASK_REMINDERS } from '@/settings/data-model/task-reminders/graphql/queries/getTaskReminders';
import { type TaskReminders } from '@/settings/data-model/task-reminders/types/TaskReminders';

type GetTaskRemindersResult = { taskReminders: TaskReminders | null };

export const useTaskReminders = (): { enabled: boolean; loading: boolean } => {
  const { data, loading } = useQuery<GetTaskRemindersResult>(GET_TASK_REMINDERS);

  return { enabled: data?.taskReminders?.enabled ?? false, loading };
};
```
```typescript
// hooks/useUpdateTaskReminders.ts
import { useMutation } from '@apollo/client/react';

import { UPDATE_TASK_REMINDERS } from '@/settings/data-model/task-reminders/graphql/mutations/updateTaskReminders';
import { GET_TASK_REMINDERS } from '@/settings/data-model/task-reminders/graphql/queries/getTaskReminders';

export const useUpdateTaskReminders = (): {
  updateTaskReminders: (enabled: boolean) => Promise<unknown>;
} => {
  const [mutate] = useMutation(UPDATE_TASK_REMINDERS, {
    refetchQueries: [{ query: GET_TASK_REMINDERS }],
  });

  const updateTaskReminders = (enabled: boolean) =>
    mutate({ variables: { input: { value: { enabled } } } });

  return { updateTaskReminders };
};
```

- [ ] **Step 2: Typecheck**

Run: `npx nx typecheck twenty-front` → 0 (or oxlint the 5 files if slow).

- [ ] **Step 3: Commit**

```bash
git add packages/twenty-front/src/modules/settings/data-model/task-reminders
git commit -m "feat(front): task reminders config hooks"
```

---

## Task 7: Settings toggle page + route + link

**Files:**
- Modify: `packages/twenty-shared/src/types/SettingsPath.ts`
- Create: `packages/twenty-front/src/pages/settings/data-model/SettingsObjectTaskReminders.tsx`
- Modify: `packages/twenty-front/src/modules/app/components/SettingsRoutes.tsx`
- Modify: `packages/twenty-front/src/modules/settings/data-model/object-details/components/tabs/ObjectSettings.tsx`

**Interfaces:**
- Consumes: `useTaskReminders`, `useUpdateTaskReminders` (Task 6), `SettingsPath.ObjectTaskReminders`.

- [ ] **Step 1: Add SettingsPath + rebuild shared**

In `packages/twenty-shared/src/types/SettingsPath.ts`, after `ObjectWebForms`, add:
```typescript
  ObjectTaskReminders = 'objects/:objectNamePlural/reminders',
```
Then `npx nx build twenty-shared && rm -rf packages/twenty-front/node_modules/.vite`.

- [ ] **Step 2: Settings page** (mirror `SettingsObjectOpportunityWebForms`/`SettingsObjectOpportunityGoal` shell + skeleton gate)

Read `SettingsObjectOpportunityGoal.tsx` for the `SettingsPageLayout` breadcrumb + `SettingsSectionSkeletonLoader` gating + `useSnackBar` pattern. Build a page with a `Toggle` (from `twenty-ui/input`) bound to `enabled`, seeded once from `useTaskReminders` (skeleton-gate while loading so a blank state can't wipe). On toggle change: `await updateTaskReminders(next)` + `enqueueSuccessSnackBar({ message: t\`Aktivitäts-Reminder aktualisiert\` })`. Title `t\`Aktivitäts-Reminder\``, a short description, breadcrumb links to Workspace → Objects → object label → this page (built from `useParams` `objectNamePlural` + `useObjectMetadataItem({ objectNameSingular: CoreObjectNameSingular.Task })`). German source strings via `t`.

- [ ] **Step 3: Route + gated link**

In `SettingsRoutes.tsx`: lazy import `SettingsObjectTaskReminders` (mirror the web-forms/goal lazy import) and add `<Route path={SettingsPath.ObjectTaskReminders} element={<SettingsObjectTaskReminders />} />` in the object-detail route group.
In `ObjectSettings.tsx`: add a **Task**-gated (`objectMetadataItem.nameSingular === CoreObjectNameSingular.Task`) `<StyledFormSectionContainer>` with an `H2Title` "Aktivitäts-Reminder" + a `Button` `to={getSettingsPath(SettingsPath.ObjectTaskReminders, { objectNamePlural: objectMetadataItem.namePlural })}` labelled `t\`Reminder konfigurieren\`` with a suitable icon (e.g. `IconBell` if exported by `twenty-ui/display`, else `IconClockHour8`; verify it exists).

- [ ] **Step 4: Typecheck + lint**

Run: `npx nx typecheck twenty-front` → 0. Lint touched files → 0.

- [ ] **Step 5: Commit**

```bash
git add packages/twenty-shared/src/types/SettingsPath.ts packages/twenty-front/src/pages/settings/data-model/SettingsObjectTaskReminders.tsx packages/twenty-front/src/modules/app/components/SettingsRoutes.tsx packages/twenty-front/src/modules/settings/data-model/object-details/components/tabs/ObjectSettings.tsx
git commit -m "feat(front): task reminders settings toggle page"
```

---

## Task 8: de-DE strings

**Files:**
- Modify: `packages/twenty-front/src/locales/generated/de-DE.po`
- Modify: `packages/twenty-emails/src/locales/*` if the emails package has its own catalog (check; the email uses `Trans`/`i18n._` ids that are English/German source — fill de-DE if a catalog exists, else the source renders directly).

- [ ] **Step 1: Extract front catalogs**

Run: `npx nx run twenty-front:lingui:extract`. New msgids: `Aktivitäts-Reminder`, `Reminder konfigurieren`, `Aktivitäts-Reminder aktualisiert`, plus the page description.

- [ ] **Step 2: Fill de-DE msgstr**

Fill the empty `msgstr` for the new task-reminder msgids with the identity German string. Do not blank siblings.

- [ ] **Step 3: Email catalog (if present)**

Check whether `packages/twenty-emails` has a lingui catalog + extract script. If it does, extract + fill de-DE for the new email ids (`Deine fälligen Aktivitäten`, `Überfällig`, `Heute fällig`, `Hallo,`, `Hi {userName},`). If the emails package renders source ids directly (no catalog), skip — the German source strings render as-is.

- [ ] **Step 4: Typecheck**

Run: `npx nx typecheck twenty-front && npx nx typecheck twenty-server` → 0.

- [ ] **Step 5: Commit**

```bash
git add packages/twenty-front/src/locales packages/twenty-emails/src/locales
git commit -m "feat(front): task reminders de-DE strings"
```

---

## Live-verification (after Task 8, before finishing the branch)

Backend + worker + front + Docker up. Note: dev uses a logger email driver, so a "sent" email is logged, not delivered — verify by the send being invoked + the digest content in the worker/email logs.

1. **Settings toggle:** Settings → Task object → "Aktivitäts-Reminder" → turn ON, save. Verify via Postgres MCP: `core.keyValuePair` key `TASK_REMINDERS` value `{ enabled: true }`.
2. **Create tasks:** create one task with `dueAt` yesterday (overdue) and one with `dueAt` today, both assigned to tim@apple.dev's workspace member, status To do, each linked to an Opportunity. (Do this in the app UI, or note the assignee member id.)
3. **Run the job once:** start the worker (`npx nx run twenty-server:worker`), then enqueue the cron job once immediately (the worker processes `@Process(TaskReminderCronJob.name)`), e.g. by running the registration command `cron:task:reminders` and triggering, or by adding the job to the cron queue manually. Confirm in the worker logs that `TaskReminderService.sendDailyDigests` ran and an email send was invoked (logger driver output) with the two tasks split into Überfällig / Heute fällig.
4. **Toggle off:** set the toggle OFF → run again → the workspace is skipped, no email attempted.
5. Clean up the test tasks (and note them in the ledger).

---

## Self-review notes (author)
- Spec coverage: config (T2) + resolver (T3) + settings toggle (T6/T7); cron job+command+registration (T5); service iterate/skip/read/group/send (T5); digest split util (T1); email template (T4); de-DE (T8). All spec items mapped.
- Enterprise safety: the cron job/command mirror the AGPL calendar cron; the email send mirrors AGPL `workspace-invitation.service`; `billing-reminder.service.ts` (Enterprise) is explicitly NOT read/copied.
- `buildTaskDigest` is the only pure-tested unit; the service orchestration + email render + cron wiring are verified live (Slice-A precedent; no in-repo unit test for cron services). `resolveLinkedRecordName` precedence lives in the service (verified live).
- Known limitations carried from spec: UTC day boundaries; fixed 06:00 schedule; per-workspace toggle only; no per-task sent-state (a task recurs daily until done); first linked record only; dev logger email driver.
- Wiring risks flagged inline (T5 Step 5/6): exact `EmailModule`/`I18nModule` providers and the command-context module that reaches `CronRegisterAllCommand`; the boot check in T5 Step 7 catches a mistake.
