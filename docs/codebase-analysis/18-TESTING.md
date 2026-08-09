# 18 — Testing

Test pyramid target (CLAUDE.md): 70% unit / 20% integration / 10% E2E. Principle: **test behavior, not implementation**; query by user-visible elements over test IDs.

## Unit (Jest)

- Config per package: `packages/twenty-server/jest.config.mjs`, `packages/twenty-front/jest.config.mjs` (also twenty-ui/twenty-shared). Server: `testEnvironment: node`, `setupFilesAfterEach: ['./setupTests.ts']`, `testRegex: .*\.spec\.ts$`, transform via `@swc/jest` (decorators + metadata for Nest), `clearMocks: true`, `errorOnDeprecated: true`. Nx `test` target: `@nx/jest:jest`, coverage on, CI `maxWorkers:1`.
- Commands: `npx nx test twenty-front` / `npx nx test twenty-server`; single file (fast) `npx jest path/to/x.test.ts --config=packages/PROJECT/jest.config.mjs`; server CI `test:ci = jest --config ./jest.config.mjs --ci --runInBand`.

## Integration (twenty-server)

- Configs `jest-integration.config.ts` + `jest-integration-secure.config.ts`. Targets (`project.json`): `test:integration` (`NODE_ENV=test nx jest --config ./jest-integration.config.ts --logHeapUsage`), `test:integration:secure`. Assets under `test/` (`integration/`, `utils/`, `constants/`). GraphQL integration client codegen `generate:integration-test`.
- **DB-reset variant**: `npx nx run twenty-server:test:integration:with-db-reset`. `database:reset` (seed/no-seed) → `node dist/database/scripts/truncate-db.js` + `nx database:init` + `cache:flush` (+ `workspace:seed:dev` for seed).

## E2E (`packages/twenty-e2e-testing`, Playwright)

`playwright.config.ts`: `testDir: ./tests`, `testIdAttribute: data-testid`, single worker (not parallel), `baseURL http://localhost:3001`, CI retries 2, `trace: retain-on-failure`, `screenshot: on`. A `setup` project (`login.setup.ts` → `.auth/user.json`) that the `chrome` project depends on via `storageState`. Tests: `create-record.spec.ts`, `create-kanban-view.spec.ts`, `workflow-*.spec.ts`, `authentication/`. Targets: `setup`, `test`, `test:ui`, `test:debug`, `test:report`. Commands: `npx nx setup twenty-e2e-testing`, `npx nx test twenty-e2e-testing`. (When testing the UI E2E: click "Continue with Email" and use the prefilled credentials.)

## Storybook (twenty-front)

Nx targets: `storybook:build` (`storybook build --test`, 10GB heap), `storybook:serve:dev`, `storybook:serve:static` (6006), `storybook:test` (`vitest run --coverage --shard=`), `storybook:coverage`. Config in `.storybook/`. Run `npx nx storybook:build twenty-front` / `npx nx storybook:test twenty-front`.

## Utilities / fixtures / mocks

- Nx `namedInputs` (`excludeTests`/`excludeStories`) keep spec/story/mocks out of build/prod inputs.
- Server has `__mocks__` dirs (e.g. `engine/core-modules/__mocks__`). Postgres MCP (read-only, configured in `.mcp.json`) helps verify migration/data results while developing.
- Read-only DB inspection during dev via the configured Postgres MCP server (workspace/metadata schema inspection, migration verification).

## Expected developer testing flow

Prefer single-file runs (fast); run relevant unit tests for the change; use integration tests (with DB reset) for backend query/permission logic; E2E for cross-cutting UI flows; storybook tests for UI components. Always run `lint:diff-with-main` + `typecheck` after changes (see [19](19-DEVELOPMENT-WORKFLOW.md)).

**Anchor files:** `packages/twenty-server/jest.config.mjs` + `jest-integration.config.ts`, `packages/twenty-front/jest.config.mjs`, `packages/twenty-e2e-testing/playwright.config.ts`, `nx.json` (targetDefaults).
