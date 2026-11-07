# Test data

| Folder | Content |
|---|---|
| `fixtures/` | analysis input: test projects as they would be dropped into the app |
| `golden/` | reference output of the legacy build for each fixture ([golden/README.md](golden/README.md)) |

## Fixtures

| Fixture | Files | Content |
|---|---|---|
| `mini` | 8 | own test project covering the important detection cases: class component, inheritance from an own base class, `React.Component` as member, lifecycle incl. a deprecated method, `bind` alias, function in the constructor, arrow class property, pipe alias, getter (ignored), empty method, method without `this`, method returning JSX, function component in TSX with hooks and inner functions, arrow component with fragment, `connect()(X)`, function expression component, `React.lazy(() => import())`, default export variants, `*.test.js` (must be ignored) |
| `realworld` | 38 | `src/` of gothinkster/react-redux-realworld-example-app, MIT ([realworld.SOURCE.md](fixtures/realworld.SOURCE.md)) |

## Rules

- Fixture folders contain **only** analysis input. Licenses and notes go next to the folder
  (`<name>.LICENSE.md`, `<name>.SOURCE.md`), never inside it.
- Files stay byte-identical: line numbers feed into the metrics. `.gitattributes` disables line
  ending conversion for `testdata/**`; switch off editor auto-format here. Biome, TypeScript and
  Vitest ignore this folder.
- Nothing in a fixture is installed or executed.
- Golden files are **never** edited by hand and never changed to make a test pass
  (`docs/migration/00-grundlagen/06-teststrategie.md` §3). New captures only with the procedure in
  [tools/legacy/README.md](../tools/legacy/README.md) and with the owner's approval.
