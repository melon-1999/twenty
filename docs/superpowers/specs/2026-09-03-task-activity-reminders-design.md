# Activity Reminders (Daily Task Digest Email) — Design

Date: 2026-09-03
Status: approved

## Goal

Email each assignee a once-a-day digest of their open tasks that are overdue or due today, so
deals don't stall because a follow-up was forgotten. Delivery is by email (Twenty has no in-app
notification object). The feature is opt-in per workspace (default off) so no one gets surprise
mail until an admin enables it.

## Decisions (from brainstorming)

- Channel: email, via the existing `EmailService` + a new `twenty-emails` template. (SMTP is
  configured on the target instance.)
- Cadence: one daily digest per assignee (not per-task), so a task overdue for several days
  appears in each day's digest — no per-task "already sent" state needed.
- Tasks included: `status != 'DONE'` and `dueAt` is non-null and `<=` end of today (UTC) — i.e.
  overdue + due today. Only tasks with an assignee whose workspace member has a `userEmail`.
- Enablement: per-workspace toggle stored as KeyValuePair `TASK_REMINDERS = { enabled: boolean }`,
  default `{ enabled: false }`. The cron runs for all active workspaces but skips any whose toggle
  is off.
- Schedule: fixed daily cron at `0 6 * * *` (06:00 UTC). Configurable time is out of scope.

## Architecture

Four pieces, mirroring existing patterns:

1. **Config (KeyValuePair) + resolver + settings toggle** — mirrors `OpportunityMonthlyGoalConfig`.
2. **Cron job + cron command + registration** — mirrors `BillingReminderCronJob` /
   `CalendarOngoingStaleCron*` and `CronRegisterAllCommand`.
3. **`TaskReminderService`** — iterate active workspaces, per workspace read due/overdue open
   tasks, group by assignee, render + send one digest email per assignee.
4. **`TaskReminderEmail` template** in `packages/twenty-emails`.

### 1. Config

- Type: `TASK_REMINDERS_KEY = 'TASK_REMINDERS'`, `TaskRemindersConfig = { enabled: boolean }`.
- `TaskReminderConfigService` (KeyValuePairService, `userId: null`, `type: CONFIG_VARIABLE`):
  `getConfig(workspaceId): Promise<TaskRemindersConfig>` returns `{ enabled: false }` when unset;
  `setConfig(workspaceId, config)`.
- `@MetadataResolver` `TaskReminderConfigResolver`: query `taskReminders` (GraphQLJSON,
  `NoPermissionGuard`), mutation `updateTaskReminders(input.value)`
  (`SettingsPermissionGuard(DATA_MODEL)`), class-level `WorkspaceAuthGuard` +
  `ResolverValidationPipe`. Module registered in `core-engine.module.ts`.
- Frontend: `useTaskReminders` / `useUpdateTaskReminders` hooks (plain `gql`, default Apollo
  client). A Task-object-gated settings page `SettingsObjectTaskReminders` with a single on/off
  toggle (mirror the goal settings page shell + skeleton gate). `SettingsPath.ObjectTaskReminders
  = 'objects/:objectNamePlural/reminders'`, route in `SettingsRoutes.tsx`, gated link in
  `ObjectSettings.tsx` (Task only): "Aktivitäts-Reminder".

### 2. Cron job + command

- `TASK_REMINDER_CRON_PATTERN = '0 6 * * *'`.
- `TaskReminderCronJob` — `@Processor(MessageQueue.cronQueue)` + `@Process(TaskReminderCronJob.name)`
  + `@SentryCronMonitor(...)`, no-arg `handle()` that delegates to
  `taskReminderService.sendDailyDigests()`. (Config-gated single-service flavor like
  `BillingReminderCronJob`, not per-workspace fan-out — the instance has few workspaces.)
- `TaskReminderCronCommand` (`@Command name: 'cron:task:reminders'`) — `addCron` with
  `options: { repeat: { pattern: TASK_REMINDER_CRON_PATTERN } }`, `jobName:
  TaskReminderCronJob.name`.
- Register the command in `CronRegisterAllCommand` (`allCommands`), unconditionally (per-workspace
  toggle handles opt-in; no global env gate).
- Both job + command in a new `TaskReminderModule` (providers), imported where cron modules are
  wired.

### 3. TaskReminderService.sendDailyDigests()

- Fetch active workspace ids (mirror how the calendar cron finds `activationStatus === ACTIVE`
  workspaces from the core workspace table).
- For each workspace:
  - `getConfig(workspaceId)`; if `!enabled`, skip.
  - `buildSystemAuthContext(workspaceId)` + `executeInWorkspaceContext`:
    - `taskRepository = getRepository(workspaceId, TaskWorkspaceEntity, {
      shouldBypassPermissionChecks: true })`.
    - `find({ where: { status: Not('DONE'), dueAt: LessThanOrEqual(endOfTodayUtc) }, relations: {
      assignee: true, taskTargets: { targetOpportunity: true, targetPerson: true, targetCompany:
      true } } })`. (Tasks with null `dueAt` are excluded by the operator.)
    - Group tasks by `assigneeId`; drop groups whose assignee is null or has no `userEmail`.
    - For each assignee group: build the digest view model via the pure util
      `buildTaskDigest(tasks, now)` → `{ overdue: DigestItem[]; today: DigestItem[] }` where
      `DigestItem = { title, dueAtIso, isOverdue, linkedRecordName: string | null }`
      (`linkedRecordName` = first non-null target's opportunity name / person full name / company
      name, else null). Render `TaskReminderEmail` (assignee locale via `assignee.locale`), send
      via `emailService.send({ from: EMAIL_FROM_ADDRESS, to: assignee.userEmail, subject, html,
      text })`.
- Errors per workspace/assignee are caught and logged (one failure must not abort the rest);
  reuse `ExceptionHandlerService` like the calendar cron.

### 4. Email template

`packages/twenty-emails/src/emails/task-reminder.email.tsx` — a React-Email template taking
`{ overdue: DigestItem[]; today: DigestItem[] }` (+ the member first name), rendering two sections
("Überfällig" / "Heute fällig"), each a list of task titles with the due date and the linked
record name when present. Exported from `packages/twenty-emails/src/index.ts`. Subject localized
("Deine fälligen Aktivitäten"). Match the existing email templates' structure (e.g.
`billing-trial-ending.email.tsx`).

## Data flow

cron (06:00 UTC) → `TaskReminderCronJob.handle` → `TaskReminderService.sendDailyDigests` →
per active+enabled workspace → read overdue/due-today open tasks with assignee → group by
assignee → `buildTaskDigest` → render `TaskReminderEmail` → `emailService.send` (enqueues on
emailQueue).

## Testing

- `buildTaskDigest(tasks, now)` — unit tests (TDD): splits overdue vs due-today by `dueAt` vs
  `now`; resolves `linkedRecordName` from the first non-null target (opportunity/person/company
  precedence); ignores DONE (caller pre-filters, but assert the util is a pure transform);
  empty → `{ overdue: [], today: [] }`.
- `TaskReminderConfigService` — get-returns-`{enabled:false}`-when-unset + set round-trip.
- The cron job, service orchestration, and email send are verified live (dev): enable the toggle,
  create an overdue + a due-today task assigned to a member, run the cron command (or enqueue the
  job) manually, and confirm the digest is built + the email send is invoked (dev uses a logger
  email driver, so verification is via the send being attempted / logged, not an actual inbox).

## Error handling
- Workspace with toggle off → skipped, no work.
- Assignee null or no `userEmail` → task dropped from the digest (not emailed to nobody).
- Per-workspace / per-assignee send failure → caught + logged, loop continues.
- No matching tasks for an assignee → no email for that assignee.

## Non-goals / limitations
- No in-app notification (Twenty has none); email only.
- Day boundaries in UTC (a member's local "today" may differ near midnight).
- Fixed 06:00 UTC schedule (not configurable).
- Per-workspace toggle only (no per-user opt-out).
- No per-task sent-state (a task recurs in each daily digest until done/rescheduled — intended).
- Digest shows the first linked record only (a task with multiple targets shows one).
