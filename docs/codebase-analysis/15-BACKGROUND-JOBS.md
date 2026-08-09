# 15 — Background Jobs / Queues

Paths under `packages/twenty-server/src`.

## 1. Message-queue abstraction (`engine/core-modules/message-queue`)

- **Driver interface** `drivers/interfaces/message-queue-driver.interface.ts`: `register/add/bulkAdd/work/addCron/removeCron/getInFlightJobs`. Implementations:
  - `drivers/bullmq.driver.ts` (`BullMQDriver`) — production. BullMQ `Queue`/`Worker` per queue over Redis; retention, job dedup (waiting-job check by `option.id`), cron via `upsertJobScheduler`, Sentry isolation scope per job, metrics, bounded shutdown drain.
  - `drivers/sync.driver.ts` (`SyncDriver`) — tests/dev, inline, no Redis.
  - Selection `message-queue.module-factory.ts` — currently **hardcoded to BullMQ**; Redis from `RedisClientService.getQueueClient()` (no pg-boss driver present).
- **Producer** `services/message-queue.service.ts` (`MessageQueueService`) — one instance per queue, `@InjectMessageQueue(MessageQueue.x)`, delegates `add/bulkAdd/addCron/…` to the driver.
- **Decorators** `@Processor(queueName, {scope})`, `@Process(jobName)`, `@InjectMessageQueue`.
- **Explorer** `message-queue.explorer.ts` (`onModuleInit`) — discovers all `@Processor` providers via `DiscoveryService`, groups by queue, and for each registers a single BullMQ worker dispatching a job to every method whose `@Process(jobName)` matches `job.name`. Supports request-scoped processors (Nest context per job with injected `workspaceId`). Honors `WORKER_ENABLED_QUEUES`/`WORKER_EXCLUDED_QUEUES` (queue sharding across worker processes).
- **Per-queue config** `message-queue-worker-config.constant.ts` (priority, concurrency, lockDuration, maxStalledCount). **Retention** `constants/queue-retention.constants.ts` (completed 4h/1000, failed 7d/1000).

## 2. Worker process (`src/queue-worker`)

`queue-worker.ts` — `NestFactory.createApplicationContext` (headless, no HTTP), wires logger + exception handler, `enableShutdownHooks()`. `queue-worker.module.ts` imports `CoreEngineModule`, `MessageQueueModule.registerExplorer()` (triggers worker registration), `JobsModule`, `TwentyORMModule`, `GlobalWorkspaceDataSourceModule`. `JobsModule` aggregates every feature module holding processors + provides cron/one-off processors. Run: `npx nx run twenty-server:worker`.

## 3. The 17 queues

| Queue | Priority / Concurrency | Representative jobs |
|---|---|---|
| `messaging-queue` | 2 / 1 | message list-fetch, messages-import, inbound-email, participant match, cleaner |
| `calendar-queue` | 4 / 1 | event list-fetch, events-import, stale/relaunch, participant match |
| `webhook-queue` | 2 / 1 | `CallWebhookJobsJob`, `CallWebhookJob`, metadata webhook |
| `workflow-queue` | 2 / 1 | `RunWorkflowJob`, `WorkflowTriggerJob`, `WorkflowStatusesUpdateJob` |
| `trigger-queue` | 5 / 1 | `CallDatabaseEventTriggerJobsJob` (workflow DB-event triggers) |
| `email-queue` | 1 / 1 | `EmailSenderJob` |
| `billing-queue` | 1 / 1 | `UpdateSubscriptionQuantityJob`, `BillingReminderCronJob` |
| `contact-creation-queue` | 4 / 1 | `CreateCompanyAndContactJob` |
| `cron-queue` | 7 / 1 | all `*.cron.job.ts` schedulers (fan-out dispatchers) |
| `workspace-queue` | 5 / 1 | workspace cleaner, member-deleted |
| `entity-events-to-db-queue` | 1 / 1 | event-log + timeline-activity from internal events |
| `delayed-jobs-queue` | 3 / 1 | delayed workflow resumes |
| `delete-cascade-queue` | 6 / 1 | cascade deletes |
| `logic-function-queue` | 4 / **10** | serverless logic-function execution |
| `ai-queue` | 5 / 1 | agent evaluation |
| `ai-stream-queue` | 2 / **20** | `StreamAgentChatJob` (10-min lock, `maxStalledCount:0`, bounded drain) |
| `task-assigned-queue` | 4 / 1 | task-assignment notifications |

Most queues concurrency 1; only `logic-function-queue` (10) and `ai-stream-queue` (20) parallelize.

## 4. Cron / scheduled jobs

Two layers:
1. **Registration** — each recurring task has a `*.cron.command.ts` (`nest-commander`) that calls `messageQueueService.addCron({jobName, options:{repeat:{pattern}}})` on `cronQueue` (a BullMQ job scheduler). Run at deploy/boot via `cron:register:all`.
2. **Fan-out** — the matching `*.cron.job.ts` (`@Processor(cronQueue)`) iterates active workspaces/channels and **enqueues concrete per-entity jobs onto the real feature queue** (e.g. `MessagingMessageListFetchCronJob` → adds `MessagingMessageListFetchJob` to `messagingQueue`), guarded against overlap by `syncStage` state + throttling.

Notable patterns: messaging list-fetch `2-59/5 * * * *`, messages-import `*/1`, calendar events `*/5`, workflow run-enqueue + cron-trigger `* * * * *`, handle-staled-runs `*/10`, trash-cleanup `10 0 * * *`, session/event-log cleanup `0 3`, JWT key rotation `15 3`, pending-file cleanup `0 * * * *`, billing reminder `0 8`, domain validation `0 * * * *`.

## 5. Retry, concurrency, failure

- **Retries**: BullMQ `attempts = 1 + retryLimit`; callers pass `retryLimit` (webhooks/triggers use 3). Default 1 (no retry).
- **Concurrency**: from `MESSAGE_QUEUE_WORKER_CONFIG`. Job dedup: `add()` skips if a waiting job with the same `option.id` prefix exists (unless `allowDuplicatedPrefixes`).
- **Stalled**: `lockDuration` (30s default, 600s for ai-stream) + `maxStalledCount` (1 default; 0 for ai-stream = fail immediately).
- **Failures**: processor exceptions → `ExceptionHandlerService` (Sentry when `shouldCaptureException`) then rethrown so BullMQ marks failed. Cron fan-out catches per-workspace errors without aborting the tick.
- **Metrics**: `MetricsService` records job latency histogram + completed/failed/stalled counters + waiting gauge.
- **Graceful shutdown**: `onModuleDestroy` drains active jobs; `boundedShutdownDrain` for ai-stream.

## 6. Features that depend on the worker

If no worker runs (or a queue is excluded): email/messaging sync, calendar sync, connected-account push renewal + re-sync, **outbound webhooks (and therefore Zapier)**, **workflows/automations**, serverless logic functions + inbound server-route triggers, **AI agents & chat streaming**, auto company/contact creation, transactional emails, billing sync/reminders, timeline activities & audit event logs, all cron housekeeping (trash/session/file cleanup, JWT rotation, domain validation, marketplace sync), cascade deletes, task-assignment notifications, SDK client generation, application install/upgrade, workspace cleaning.

**Anchor files:** `engine/core-modules/message-queue/{message-queue.constants.ts, message-queue.explorer.ts, drivers/bullmq.driver.ts, services/message-queue.service.ts, message-queue-worker-config.constant.ts}`, `queue-worker/{queue-worker.ts, queue-worker.module.ts}`, `engine/api/graphql/workspace-query-runner/listeners/entity-events-to-db.listener.ts`.
