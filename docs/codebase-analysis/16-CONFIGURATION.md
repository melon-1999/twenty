# 16 — Configuration & Environment

## Config system (`packages/twenty-server/src/engine/core-modules/twenty-config`)

A single strongly-typed class drives everything: `config-variables.ts` (~2300 lines) declares each variable as a class property with a default, decorated by `@ConfigVariablesMetadata({group, description, type, isSensitive, isEnvOnly})`.

- **Types** (`enums/config-variable-type.enum.ts`): BOOLEAN, NUMBER, STRING, ARRAY, ENUM.
- **Sources** (`enums/config-source.enum.ts`): env or DB. `IS_CONFIG_VARIABLES_IN_DB_ENABLED` enables DB-backed config (editable in Admin Panel > Config Variables). `isEnvOnly:true` forces env-only.
- **Service** `TwentyConfigService.get(key)` — env-only → env; else DB (if enabled + present) → env → default. DB values cached in `ConfigCacheService`, refreshed `@Cron('*/15s')`, persisted encrypted in `keyValuePair` (sensitive strings via `SecretEncryptionService`).
- **Groups** (`enums/config-variables-group.enum.ts`): SERVER_CONFIG, RATE_LIMITING, STORAGE_CONFIG, GOOGLE_AUTH, MICROSOFT_AUTH, EMAIL_SETTINGS, AWS_SES_SETTINGS, LOGGING, ADVANCED_SETTINGS, BILLING_CONFIG, CAPTCHA_CONFIG, CLOUDFLARE_CONFIG, LLM, LOGIC_FUNCTION_CONFIG, CODE_INTERPRETER_CONFIG, SSL, SUPPORT_CHAT_CONFIG, ANALYTICS_CONFIG, TOKENS_DURATION.

## Env vars by category

Grouped from `packages/twenty-server/.env.example` and `packages/twenty-front/.env.example` (no secret values shown). "Required" = uncommented in `.env.example`.

**Required (server):** `NODE_ENV`, `PG_DATABASE_URL`, `REDIS_URL`, `APP_SECRET`, `FRONTEND_URL`, `SIGN_IN_PREFILLED`, `IS_WORKSPACE_CREATION_LIMITED_TO_SERVER_ADMINS`. **Required (front):** `REACT_APP_SERVER_BASE_URL`.

- **Database**: `PG_DATABASE_URL`, `PG_SSL_ALLOW_SELF_SIGNED`, `PG_DATABASE_REPLICA_URL` (optional read replica). Docker splits into `PG_DATABASE_USER/PASSWORD/HOST/PORT/NAME`.
- **Redis / queue / workers**: `REDIS_URL`, `REDIS_QUEUE_URL` (optional), `WORKER_ENABLED_QUEUES`/`WORKER_EXCLUDED_QUEUES` (queue sharding), `DISABLE_CRON_JOBS_REGISTRATION`, `DISABLE_DB_MIGRATIONS`.
- **Auth / tokens**: `ACCESS_TOKEN_EXPIRES_IN` (30m), `LOGIN_TOKEN_EXPIRES_IN` (15m), `REFRESH_TOKEN_EXPIRES_IN` (90d), `FILE_TOKEN_EXPIRES_IN`, `EMAIL_VERIFICATION_TOKEN_EXPIRES_IN`, `PASSWORD_RESET_TOKEN_EXPIRES_IN`, `AUTH_PASSWORD_ENABLED`, `IS_MULTIWORKSPACE_ENABLED`, `IS_EMAIL_VERIFICATION_REQUIRED`.
- **Email / SMTP**: `EMAIL_DRIVER` (LOGGER|smtp), `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME`, `EMAIL_SMTP_HOST/PORT/USER/PASSWORD` (+ AWS SES group).
- **Storage**: `STORAGE_TYPE` (local|s3), `STORAGE_LOCAL_PATH`, `STORAGE_S3_REGION/NAME/ENDPOINT`.
- **AI / LLM**: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`; custom providers via `AI_PROVIDERS` (JSON); model selection `AI_MODELS_DEFAULT_FAST/SMART/RECOMMENDED/DISABLED`. `CODE_INTERPRETER_TYPE` (LOCAL/e2b), `LOGIC_FUNCTION_TYPE`. `IS_ONBOARDING_AI_CHAT_ENABLED`, enrichment `PEOPLE_DATA_LABS_API_KEY`.
- **Integrations**: Google (`AUTH_GOOGLE_ENABLED/CLIENT_ID/CLIENT_SECRET/CALLBACK_URL/APIS_CALLBACK_URL`, `MESSAGING_PROVIDER_GMAIL_ENABLED`, `CALENDAR_PROVIDER_GOOGLE_ENABLED`); Microsoft (`AUTH_MICROSOFT_*`, `MESSAGING_PROVIDER_MICROSOFT_ENABLED`, `CALENDAR_PROVIDER_MICROSOFT_ENABLED`); Stripe (`IS_BILLING_ENABLED`, `BILLING_PLAN_REQUIRED_LINK`); IMAP/SMTP/CalDAV (`IS_IMAP_SMTP_CALDAV_ENABLED`); Cloudflare (`CLOUDFLARE_API_KEY/ZONE_ID/WEBHOOK_SECRET`); Cal.com (`CALENDAR_BOOKING_PAGE_ID`); maps (`GOOGLE_MAP_API_KEY`).
- **Frontend**: `REACT_APP_SERVER_BASE_URL`, `REACT_APP_PORT` (3001), `VITE_BUILD_SOURCEMAP`, `VITE_ENABLE_SSL`, `VITE_HOST`, `IS_DEBUG_MODE`, `SENTRY_FRONT_DSN`.
- **Telemetry / logging**: `EXCEPTION_HANDLER_DRIVER` (sentry), `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `METER_DRIVER` (opentelemetry/console), `LOGGER_DRIVER` (CONSOLE), `LOG_LEVELS`, `ANALYTICS_ENABLED`, `CLICKHOUSE_URL`.
- **Security**: `APP_SECRET`, `ENTERPRISE_KEY`, `CAPTCHA_DRIVER/SITE_KEY/SECRET_KEY`, `API_RATE_LIMITING_TTL/LIMIT`, `MUTATION_MAXIMUM_AFFECTED_RECORDS`, `SSL_KEY_PATH`/`SSL_CERT_PATH`, `HTTP_TOOL_SAFE_MODE_ENABLED`/`OUTBOUND_HTTP_SAFE_MODE_ENABLED`, `SERVER_KEEP_ALIVE_TIMEOUT_MS` (65000, must exceed proxy idle timeout), `WORKSPACE_SCHEMA_DDL_LOCKED`.

## Feature flags (`core-modules/feature-flag`)

Per-workspace DB flags: `feature-flag.entity.ts` (`core.featureFlag`, columns `key: FeatureFlagKey`, `value: boolean`, unique `(key, workspaceId)`). `FeatureFlagKey` is a GraphQL enum. **Lab** flags: `constants/public-feature-flag.const.ts` exports `PUBLIC_FEATURE_FLAGS` (label/description/icon) — the user-toggleable "lab" features in Settings (e.g. `IS_AI_CHAT_PAGE_ENABLED`, `IS_LIST_VIEW_ENABLED`, `IS_JUNCTION_RELATIONS_ENABLED`). `is-public-feature-flag.validate.ts` gates which are publicly settable.

**Anchor files:** `engine/core-modules/twenty-config/config-variables.ts` + `enums/config-variables-group.enum.ts`, `engine/core-modules/feature-flag/constants/public-feature-flag.const.ts`, `packages/twenty-server/.env.example`, `packages/twenty-front/.env.example`.
