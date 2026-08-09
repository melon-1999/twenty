# 20 — Code Conventions

Sources: `CLAUDE.md`, `.cursor/rules/*.mdc` (16 files), `tsconfig.base.json` + per-package tsconfig, the custom oxlint plugin `packages/twenty-oxlint-rules`.

## Linting: custom oxlint plugin (not ESLint)

Uses **oxlint** + **oxfmt** (formatting). Plugin `oxlint-plugin.ts` → `dist/oxlint-plugin.mjs`, referenced by per-package `.oxlintrc.json` (`jsPlugins`). Custom `twenty/*` rules (each with `.spec.ts`), enforced as errors — notable ones:
- `effect-components` (guard useEffect usage), `no-hardcoded-colors` (colors from theme), `matching-state-variable` (Jotai state naming), `styled-components-prefixed-with-styled` (Linaria `styled` must be named `Styled*`), `sort-css-properties-alphabetically`.
- `no-state-useref`, `no-jotai-store-in-selector`, `no-direct-atom-family-in-selector`.
- `component-props-naming` (props type suffixed `Props`), `no-navigate-prefer-link`, `folder-structure`, `enforce-module-boundaries`, `max-consts-per-file` ({max:1}).
- Server: `inject-workspace-repository`, `prefer-workspace-scoped-repository`, `graphql-resolvers-should-be-guarded`, `rest-api-methods-should-be-guarded`, `no-data-mutation-in-fast-instance-command`, `upgrade-command-filename`.
- Docs/MDX: `no-angle-bracket-placeholders`, `mdx-component-newlines`, `no-storybook-a11y-disable`.

Front oxlint also has `no-restricted-imports` messages (import icons from `twenty-ui`; use `useScopedHotkeys` wrapper). Named-exports-only / no-default-exports is a documented convention (not found as an explicit oxlint rule in the sampled configs).

No husky/lint-staged — enforcement is via CI/Nx lint targets, not pre-commit hooks. Jest sets `prettierPath: null` (oxfmt is the formatter for source).

## TypeScript

`tsconfig.base.json`: `target es2018`, `module esnext`, `strict: true`. Path aliases are per-package: `twenty-front/tsconfig.json` defines `@/* → ./src/modules/*` and `~/* → ./src/*`. No `any`. `types` over `interface` (except extending third-party). String-literal unions over enums (except GraphQL enums, which use `registerEnumType`).

## Naming

- Variables/functions **camelCase**; constants **SCREAMING_SNAKE_CASE**; types/classes **PascalCase** (props suffixed `Props`); files/directories **kebab-case** with descriptive suffixes (`.component.tsx`, `.service.ts`, `.entity.ts`, `.dto.ts`, `.module.ts`).
- No abbreviations (`user` not `u`, `fieldMetadata` not `fm`). TS generics descriptive (`TData` not `T`).

## React

Functional components only. Named exports only (no default exports). Props-down/events-up (unidirectional). Composition over inheritance. **Event handlers over `useEffect`** for state updates. State: Jotai via the `createAtom*` helper wrappers (`@/ui/utilities/state/jotai/utils`); component-instance-scoped state via `createAtomComponentState`.

## NestJS / backend

Modules per feature. TypeORM entities → generate an instance command on change. GraphQL code-first; keep schema backward-compatible; guard resolvers/REST methods (oxlint-enforced). Use workspace-scoped repositories (`@InjectWorkspaceScopedRepository`) / the workspace ORM, never a raw datasource query.

## File structure

Components < 300 lines, services < 500. Components in their own directories with tests + stories. `index.ts` barrel exports. Import order: external libraries → internal (`@/`) → relative. Use `twenty-shared` helpers (`isDefined`, `isNonEmptyString`, `isNonEmptyArray`) over manual type guards.

## i18n & styling

- **Lingui** for i18n (`useLingui()` + `msg`/`t` macros; catalogs `src/locales/*.po` → `generated/*.ts`; `lingui:extract`/`lingui:compile` targets).
- **Linaria** for styling in twenty-front (zero-runtime CSS-in-JS, `styled` prefixed `Styled`, colors from `themeCssVariables`, no hardcoded colors). twenty-ui uses CSS Modules + SCSS (see [03](03-FRONTEND.md)).

## Comments

Short `//` only (no JSDoc blocks). Explain WHY (business logic), not WHAT. Don't comment obvious code. Multi-line = multiple `//`.

## .cursor/rules reference

`README`, `architecture`, `code-style`, `file-structure`, `typescript-guidelines`, `react-general-guidelines`, `react-state-management`, `nx-rules`, `server-migrations`, `creating-syncable-entity`, `testing-guidelines`, `translations`, `changelog-process`, `feedback-incorporation`, `github-actions-security`, `sdk-esm-dependencies`.

**Anchor files:** `packages/twenty-oxlint-rules/rules/`, `.oxlintrc.json` + `packages/twenty-front/.oxlintrc.json`, `tsconfig.base.json`, `.cursor/rules/*.mdc`, `CLAUDE.md`.
