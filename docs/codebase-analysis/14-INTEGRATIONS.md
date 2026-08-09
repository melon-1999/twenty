# 14 — Integrations

Server package `packages/twenty-server/src` (paths relative to it) + `packages/twenty-zapier`.

## Abstraction patterns

Two recurring shapes: (1) **per-provider driver dispatch** by `ConnectedAccountProvider` (`GOOGLE | MICROSOFT | IMAP_SMTP_CALDAV`) — a switch/factory selects a provider-specific service (messaging, calendar, connected-account, webhook subscriptions); (2) **config-hash-keyed `DriverFactoryBase`** (`engine/core-modules/twenty-config/dynamic-factory.base.ts`) — subclasses `buildConfigKey()` + `createDriver()`, cached and rebuilt on config change (file-storage, email, captcha). All external HTTP goes through `engine/core-modules/secure-http-client/secure-http-client.service.ts` (SSRF protection, blocks internal IPs).

## Email / calendar sync (Gmail, Microsoft, IMAP/CalDAV)

**Two OAuth systems**: login/SSO (authenticate a *user*, `auth/strategies/google.auth.strategy.ts`) vs "APIs" OAuth (connect a *mailbox/calendar* with broader scopes, `strategies/google-apis-oauth-*`, controllers `google-apis-auth.controller.ts`). Landing services (`auth/services/google-apis.service.ts`, `microsoft-apis.service.ts`) create a connected account + message/calendar channel and **enqueue the first sync job**.

Runtime OAuth clients + token refresh: `modules/connected-account/oauth2-client-manager/drivers/{google,microsoft}/` (build client, decrypt refresh token) and `refresh-tokens-manager/drivers/{google,microsoft}/` (googleapis / MSAL), with permanent-vs-transient error classification.

**Message sync dispatch** `modules/messaging/message-import-manager/services/messaging-get-messages.service.ts` — `switch(provider)` → `GmailGetMessagesService` (googleapis + batcher, Gmail History API) | `MicrosoftGetMessagesService` (Graph delta + `$batch`) | `ImapGetMessagesService` (imapflow). Pipeline is a state machine on `MessageChannel.syncStage`: list-fetch → import. Jobs `messaging-message-list-fetch.job.ts` + `messaging-messages-import.job.ts` (`@Processor(messagingQueue)`).

**Calendar sync** same shape (`modules/calendar/calendar-event-import-manager/drivers/{google-calendar,microsoft-calendar,caldav}`, jobs on `calendarQueue`). CalDAV via tsdav.

**Push notifications** (provider → Twenty, replaces polling): subscription registration `modules/connected-account/webhook-subscription-manager/` (Gmail `users.watch` via Pub/Sub; Calendar `events.watch`; Graph subscriptions), renewal cron. Inbound push controller `modules/connected-account-sync-webhooks/connected-account-sync-webhooks.controller.ts` — public `POST {webhooks}/google/messaging`, `/google/calendar`, `/microsoft/messaging`, `/microsoft/calendar` (handles Graph `validationToken` handshake); handlers mark channels for re-sync.

**IMAP/SMTP/CalDAV manual connection** `engine/core-modules/imap-smtp-caldav-connection/` — ImapFlow + nodemailer + CalDAV, validates host via `SecureHttpClientService`, stores encrypted `connectionParameters` on a connected account.

## Outbound webhooks

- Definition `engine/metadata-modules/webhook/` + `flat-webhook/` (`flatWebhookMaps`): `targetUrl`, `operations[]` (e.g. `person.created`, `*.*`), `secret`.
- Origin: `entity-events-to-db.listener.ts` enqueues `CallWebhookJobsJob` on `webhookQueue` per batch.
- Fan-out `webhook/jobs/call-webhook-jobs.job.ts` matches operations, chunks by 20, enqueues `CallWebhookJob`.
- Delivery `jobs/call-webhook.job.ts` — POST via `SecureHttpClientService` (5s timeout), HMAC-SHA256 headers (`X-Twenty-Webhook-Signature`/`-Timestamp`/`-Nonce`) when a secret is set, blocks internal IPs.

## Inbound routing

- **Server route trigger** `engine/core-modules/server-route-trigger/` — public `POST {webhooks}/server/:resolverLogicFunctionUniversalIdentifier` invokes a **logic function** (custom inbound endpoints running app code).
- **Messaging inbound (AWS SES)** `modules/messaging-webhooks/` — receives SNS/SES notifications (signature verify, subscription confirm), routes inbound mail into import jobs, tracks outbound delivery/bounce/suppression.

## Zapier (`packages/twenty-zapier`)

`zapier-platform-core` app (`src/index.ts`). Auth (`src/authentication.ts`): `apiKey` + optional `apiUrl`; test = GraphQL `currentWorkspace`. Transport `src/utils/requestDb.ts` POSTs to `<apiUrl>/graphql` or `/metadata`, or GETs `/rest/<objectNamePlural>`. Triggers: `trigger_record` (REST-hook — `performSubscribe`/`performUnsubscribe` create/delete a Twenty **webhook** via metadata GraphQL; `performList` polls REST), `find_object_names_singular`, `list_record_ids`. Creates: `crud_record` (one action doing Create/Update/Delete via GraphQL mutation from dynamic fields). **Zapier triggers depend on Twenty's outbound webhook system → require the worker.**

## Storage, billing & others

| Integration | Entry | Provider | Notes |
|---|---|---|---|
| **File storage** | `engine/core-modules/file-storage/file-storage-driver.factory.ts` | local FS or S3 (`@aws-sdk/client-s3`, MinIO via path-style, presigned URLs) | `STORAGE_TYPE`; consumed by `core-modules/file/` |
| **Billing / Stripe** | `engine/core-modules/billing/` (13 stripe services) | Stripe SDK | Enterprise. Webhook `billing-webhook/billing-webhook.controller.ts` `POST {webhooks}/stripe` (signature-verified, raw body). `billingQueue` jobs |
| **Company enrichment** | `engine/core-modules/company-enrichment/` | People Data Labs | API-key gated |
| **Geo/maps** | `engine/core-modules/geo-map/` | Google Maps Places | `IS_MAPS_AND_ADDRESS_AUTOCOMPLETE_ENABLED` + `GOOGLE_MAP_API_KEY` |
| **Captcha** | `engine/core-modules/captcha/captcha-driver.factory.ts` | Google reCAPTCHA or Cloudflare Turnstile | `CAPTCHA_DRIVER` |
| **Email sending** | `engine/core-modules/email/email-driver.factory.ts` | SMTP (nodemailer) or logger | `EMAIL_DRIVER`, `EMAIL_SMTP_*`, templates from `twenty-emails`. `emailQueue` |
| **Cloudflare / DNS** | `engine/core-modules/{cloudflare,dns-manager}/` | Cloudflare | custom-domain SaaS mode, validation crons |
| **Telemetry** | `engine/core-modules/telemetry/` | twenty-telemetry.com | `TELEMETRY_ENABLED` |

For each: entry point → internal abstraction (driver/factory) → external provider, with `SecureHttpClientService` as the common outbound HTTP guard.

**Anchor files:** `modules/messaging/message-import-manager/services/messaging-get-messages.service.ts`, `modules/connected-account/oauth2-client-manager/drivers/*`, `modules/connected-account-sync-webhooks/connected-account-sync-webhooks.controller.ts`, `engine/metadata-modules/webhook/jobs/{call-webhook-jobs,call-webhook}.job.ts`, `engine/core-modules/server-route-trigger/server-route-trigger.controller.ts`, `engine/core-modules/{file-storage,email,captcha}/*-driver.factory.ts`, `packages/twenty-zapier/src/{index,authentication}.ts`.
