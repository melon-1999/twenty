# 13 — CLI

> **`packages/twenty-cli` is DEPRECATED** — a tombstone (`package.json` description `[DEPRECATED] Use twenty-sdk instead`; `deprecate.js` prints "npm install -g twenty-sdk" and exits 1). **The real, working CLI ships inside `twenty-sdk`** (`packages/twenty-sdk/src/cli/`), binary name unchanged (`twenty`).

## 1. Entry & structure

`twenty-sdk/src/cli/cli.ts` — commander program `twenty`, global `-r/--remote`, a `preAction` hook resolving the active remote from `~/.twenty/config.json`. Commands registered in `src/cli/commands/index.ts` across five groups.

## 2. Commands

**Dev / build / sync** (`commands/dev/`):
- `twenty dev [appPath]` — watch, build, sync local changes (live `ink` UI).
- `twenty plan` — preview the metadata diff without applying.
- `twenty apply` — apply after showing the plan (replaces the deprecated `dev --once`).
- `twenty dev:build` (`--tarball`), `dev:typecheck`, `dev:add <entityType>` (scaffold an entity), `dev:generate-client` (regenerate typed API client), `dev:translations-extract`, `dev:catalog-sync`.
- `dev:function:logs`, `dev:function:exec` (`--postInstall`/`--preInstall`/`--uninstall`, `-n name`/`-u uid`, `-p payload`) — stream/run logic functions.

**App publish / install** (`commands/app/`):
- `twenty app:publish [appPath]` — build + publish; **default = npm** (public marketplace), `--private` pushes to a Twenty server registry, `--tag` for npm dist-tag. Uploads tarball via `apiService.uploadAppTarball`. Each publish requires a strictly higher semver.
- `twenty app:install [appPath]` — install a deployed app on the server.
- `twenty app:uninstall [appPath]` (`-y`).

**Auth / remotes** (`commands/remote/`): `remote:add` (OAuth by default, API-key fallback), `remote:list`, `remote:use`, `remote:status`, `remote:remove`. Credentials stored per remote in `~/.twenty/config.json` (`twentyCLIAccessToken` for OAuth, or `apiKey`).

**Local server (Docker)** (`commands/docker/`): `docker:start|stop|logs|status|reset|upgrade` — manages a disposable local Twenty container (`twentycrm/twenty-app-dev`, default port 2020; test instance 2021).

**Deprecated aliases** (`commands/deprecated.ts`): old flat names (`build`, `deploy`, `install`, `publish`, `remote add`, `server start`, `dev --once`) forward to the new namespaced commands with a warning.

## 3. create-twenty-app (scaffolder)

`packages/create-twenty-app` (`npx create-twenty-app@latest my-app`). `src/create-app.command.ts`:
1. Copies the bundled template (`src/constants/template/`), substituting name/displayName/description.
2. `yarn install`, `git init` + initial commit.
3. If no `--url`: checks Docker, pulls `twentycrm/twenty-app-dev:latest`, starts a local server, authenticates with the dev API key. With `--url`: OAuth against the given instance.
4. Runs the initial sync (`yarn twenty dev --once`) and opens the app's main page-layout in the browser.

Generated template contains `src/application-config.ts`, `src/constants/universal-identifiers.ts`, `src/page-layouts/main-page.page-layout.ts`, `src/default-role.ts`, `package.json` (deps `twenty-sdk`, `twenty-client-sdk`, `twenty-ui`, `react`), `.github/workflows/{ci,cd,publish}.yml`, `AGENTS.md`. It reuses `twenty-sdk/cli` programmatic exports (`authLogin`, `serverStart`, `ConfigService`).

## 4. Lifecycle: create & publish an app

```bash
npx create-twenty-app my-app        # scaffold + local server + auth + first sync
cd my-app
yarn twenty dev                     # watch/build/sync loop (or: plan → apply)
yarn twenty dev:function:exec ...   # test logic functions
yarn twenty app:publish             # → npm (public marketplace)
# or: yarn twenty app:publish --private --remote prod   # → server registry
yarn twenty app:install             # install a published app onto an instance
```

## 5. Server-side CLI (`twenty-server` commands)

Separate from the app CLI: `twenty-server/src/command/` (`nest-commander`) provides operator commands — `database:init/migrate/reset`, `cache:flush`, `upgrade`, `run-instance-commands`, `cron:register:all`, workspace commands. Invoked via `nx` targets or `yarn command:prod <name>` in Docker. See [19-DEVELOPMENT-WORKFLOW.md](19-DEVELOPMENT-WORKFLOW.md) and [06-DATABASE-DATA-MODEL.md](06-DATABASE-DATA-MODEL.md).

**Anchor files:** `twenty-sdk/src/cli/cli.ts`, `twenty-sdk/src/cli/commands/{index,app,dev,remote,docker,deprecated}.ts`, `create-twenty-app/src/create-app.command.ts`, `twenty-cli/deprecate.js` (tombstone).
