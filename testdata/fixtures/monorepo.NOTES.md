# Notes on the `monorepo` fixture

Own test project (no external source, no license file). It recreates the patterns of a pnpm
monorepo in which one app uses components of a shared library (ADR-019, phase P05.5). The legacy
app cannot analyse monorepos, so there are no goldens; the expected results below were derived by
hand from the files.

Paths below are relative to the fixture folder. In tests the files are loaded as
`/monorepo/<path>`, like a dropped folder.

## Structure and patterns

| File | Pattern |
|---|---|
| `package.json` | workspace root `demo-root`, private |
| `pnpm-workspace.yaml` | packages `apps/web-a`, `apps/web-b`, `shared/ui`, `shared/tokens` |
| `tsconfig.base.json` | JSONC (comment, trailing commas); `paths` `@data/*` → `dev-data/*` |
| `dev-data/sample.ts` | data only, no component; outside every package |
| `apps/web-a/package.json` | the app `web-a`, depends on `@demo/ui` (`workspace:*`) |
| `apps/web-a/tsconfig.json` | `extends` the base; own `paths` replace the base ones: `@demo/ui/*` → `../../shared/ui/src/*`, `@data/*` → `../../dev-data/*` |
| `apps/web-a/src/main.tsx` | function component `Root` renders `<Page/>` (relative `../components/page/Page`) |
| `apps/web-a/src/routes.ts` | imports `@data/sample` (tsconfig alias), no component |
| `apps/web-a/components/page/Page.tsx` | `memo(function Page …)`; renders `<Header/>` (`./Header`) and `<Card/>` (`@demo/ui/components/card/Card`); `import type` from `@demo/ui/types` |
| `apps/web-a/components/page/Header.tsx` | renders `<Button/>` (`@demo/ui/components/button/Button`); imports `./Header.styles` |
| `apps/web-a/components/page/Header.styles.ts` | neighbour with the same name prefix as `Header.tsx` (K12) |
| `apps/web-a/components/__tests__/PageTest.tsx` | test file: helper component `PageWrapper` (renders only `children`); the test function renders `<Page/>` |
| `apps/web-b/package.json` | second app `web-b`, depends on `@demo/tokens`; no tsconfig |
| `apps/web-b/components/Other.tsx` | renders `<Swatch/>` via the package name with `src/` in the path (`@demo/tokens/src/Swatch`), no tsconfig alias |
| `shared/ui/package.json` | library `@demo/ui` without `main`, `module` or `exports` |
| `shared/ui/tsconfig.json` | `extends` the base |
| `shared/ui/src/types.ts` | `enum Size`, an object with `satisfies`; no component |
| `shared/ui/src/hooks/useToggle.ts` | hook, no component |
| `shared/ui/src/components/button/Button.tsx` | `function Button`; renders `<Icon/>` (`../icon/Icon`); uses `useToggle` (`../../hooks/useToggle`) and `./Button.styles` |
| `shared/ui/src/components/button/Button.styles.ts` | neighbour with the same name prefix as `Button.tsx` (K12) |
| `shared/ui/src/components/icon/Icon.tsx` | `export const Icon = memo(() => …)` |
| `shared/ui/src/components/card/Card.tsx` | `export const Card = forwardRef(…)`; renders `<Icon/>`; type import of `../../types` |
| `shared/ui/src/components/unused/Unused.tsx` | component that nothing imports |
| `shared/ui/src/components/__tests__/ButtonTest.tsx` | test file: helper component `ButtonWrapper` (renders only `children`); the test function renders `<Button/>` |
| `shared/tokens/package.json` | library `@demo/tokens` |
| `shared/tokens/src/Swatch.tsx` | component `Swatch` |

Every component has its own name, so tests can find nodes by name. The two test helpers are
therefore called `PageWrapper` and `ButtonWrapper` instead of `Wrapper` twice.

## Expected results

**App `web-a`** (new way, app folder `apps/web-a`):
- Nodes: `Root`, `Page`, `Header`, `Card`, `Button`, `Icon`.
- Links: `Root → Page`, `Page → Header`, `Page → Card`, `Header → Button`, `Button → Icon`,
  `Card → Icon`.
- Not included: `Unused`, `Swatch`, `Other`, `PageWrapper`, `ButtonWrapper`.
- Selected files: the app files `src/main.tsx`, `src/routes.ts`, `components/page/Page.tsx`,
  `components/page/Header.tsx`, `components/page/Header.styles.ts` (all source files of the app
  without tests) and the reached files `dev-data/sample.ts`, `shared/ui/src/components/card/Card.tsx`,
  `shared/ui/src/components/button/Button.tsx`, `shared/ui/src/components/button/Button.styles.ts`,
  `shared/ui/src/components/icon/Icon.tsx`, `shared/ui/src/hooks/useToggle.ts`. The type imports of
  `types.ts` do not count.

**App `web-b`** (new way, app folder `apps/web-b`):
- Nodes: `Other`, `Swatch`. Link: `Other → Swatch` (package name with `src/` in the path).

**"Whole project"** (old way, all files to the unchanged core):
- Nodes: every component of every file, 11 in all: `Root`, `Page`, `Header`, `Card`, `Button`,
  `Icon`, `Unused`, `Swatch`, `Other`, `PageWrapper`, `ButtonWrapper`. The test functions are no
  components.
- Links only from relative imports without a K12 conflict: `Root → Page`, `Button → Icon`,
  `Card → Icon`.
- `Page → Header` is missing: `./Header` matches `Header.styles.ts` first (K12). Without the
  `.styles.ts` files the link appears. All imports via package names or tsconfig aliases are
  missing (K4 only looks for `/src/` in the path of the first file, `PageTest.tsx`).

**Resolution in the new way:** `@demo/ui/components/button/Button` gives `Button.tsx`, not
`Button.styles.ts`; `./Header` gives `Header.tsx`.

The "Whole project" result was checked against the core on 10.11.2026: same nodes and links.
