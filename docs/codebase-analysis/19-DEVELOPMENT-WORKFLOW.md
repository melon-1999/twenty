# 19 — Development Workflow

All commands are real (from `package.json`, `nx.json`, `project.json`, CLAUDE.md). Nx + Yarn 4 (corepack), Node `^24.5.0`.

## One-shot bootstrap

```bash
bash packages/twenty-utils/setup-dev-env.sh
```
Idempotent. Steps: (1) start Postgres + Redis — auto-detects local PG16 + `redis-server`, else Docker via `docker-compose.dev.yml` (`--docker` forces Docker); waits for readiness. (2) create `default` and `test` databases. (3) copy env (`nx reset:env twenty-front`/`twenty-server` = `cp .env.example .env`). (4) init schema if `core` schema absent (`nx database:init twenty-server`). Flags: `--down` (stop), `--reset` (wipe + restart). Skip it for read-only tasks (architecture questions, review, docs).

## Run

```bash
yarn start   # concurrently: nx run-many -t start (twenty-server + twenty-front), then worker once :3000 is up
```
Individually:
```bash
npx nx start twenty-front              # Vite dev, HMR → :3001
npx nx start twenty-server             # nest start --watch → :3000
npx nx run twenty-server:worker        # nest start --watch --entryFile queue-worker/queue-worker
```

## Database / migrations

```bash
npx nx database:reset twenty-server                  # reset DB
npx nx run twenty-server:database:init:prod          # init
npx nx run twenty-server:database:migrate:prod       # run instance commands (fast only)
npx nx run twenty-server:database:migrate:generate --name <name> --type <fast|slow>
```
`database:init = setup-db.js + nx database:migrate -- --include-slow`. `database:migrate = command.js run-instance-commands --force`. Fast instance commands = schema change; slow adds `runDataMigration`. Never delete/rewrite committed `up`/`down`. Docs: `packages/twenty-server/docs/UPGRADE_COMMANDS.md`.

## GraphQL codegen (after schema changes)

```bash
npx nx run twenty-front:graphql:generate                       # /graphql (data)
npx nx run twenty-front:graphql:generate --configuration=metadata
npx nx run twenty-front:graphql:generate --configuration=admin
```

## Lint / typecheck / format / build

```bash
npx nx lint:diff-with-main twenty-front                        # fastest — only files changed vs main
npx nx lint:diff-with-main twenty-front --configuration=fix    # auto-fix
npx nx lint twenty-front                                       # full (slower)
npx nx typecheck twenty-front                                  # uses tsgo, not tsc
npx nx fmt twenty-front                                        # oxfmt
npx nx build twenty-shared && npx nx build twenty-front        # twenty-shared first
```
Lint uses **oxlint + oxfmt** (not ESLint/Prettier), with the custom `twenty-oxlint-rules` plugin. Nx: `build`/`start`/`lint`/`typecheck` all `dependsOn: ["^build"]`.

## Typical change loop

clone → `yarn install` → `bash packages/twenty-utils/setup-dev-env.sh` → `yarn start` → develop → `graphql:generate` after schema changes → `lint:diff-with-main <pkg>` + `typecheck <pkg>` → `nx test <pkg>` (or single-file jest) / integration / e2e → `nx build <pkg>`.

## Before making changes (from CLAUDE.md)

1. Run lint (`lint:diff-with-main`) + typecheck after changes.
2. Test with relevant suites (prefer single-file).
3. Generate an instance command for entity changes.
4. Keep GraphQL schema changes backward-compatible.
5. Run `graphql:generate` after schema changes.

**Note:** CI (GitHub Actions) manages services via Actions service containers and runs setup steps individually — it does not use `setup-dev-env.sh`.

**Anchor files:** `package.json` (root `start`), `packages/twenty-utils/setup-dev-env.sh`, `packages/twenty-server/project.json`, `packages/twenty-front/project.json`, `nx.json`, `CLAUDE.md`.
