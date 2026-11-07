# Golden reference data

Output of the **legacy** Angular build for the fixtures in `../fixtures/`. The new implementation
must reproduce it (comparison rules: `docs/migration/01-referenz-altsystem/05-golden-daten.md` §4).

**Never edit these files by hand** and never change them to make a test pass. Re-capture only with
the procedure below and with the owner's approval.

## Origin

| Item | Value |
|---|---|
| Legacy source | commit `a071f27` (2020-05-18), see `legacy/angular/` |
| Legacy build | branch `gh-pages`, commit `5f0155e` (2020-05-18), extracted with `pnpm legacy:extract` |
| Captured | 2026-11-08 with `tools/legacy/capture.browser.js` via `pnpm legacy:serve` |
| Browser | Chromium 152 (Claude desktop browser pane), window 1024 × 768, graph container 158 × 704 px |
| Settings | legacy defaults (`localStorage` cleared before each fixture) |
| Input order | canonical: fixture paths sorted with the JS default sort (ADR-006) |

Both captures were cross-checked against the independent spike capture of 2026-11-07: `mini` is
byte-identical in all 13 files; for `realworld` the report, file map and app graph are identical.

## Files per fixture

| File | Content |
|---|---|
| `legacy-report.json` | `localStorage['report']`, escomplex project report |
| `legacy-filemap.json` | `localStorage['components']`, file map (components, graphs, reports per node) |
| `legacy-appgraph.json` | `localStorage['graph']`, app graph |
| `legacy-dom-app.json` | node and edge data of the app view after the visual rules (D3 `__data__` + DOM) |
| `legacy-panels-app.json` | code quality panel for every node of the app view |
| `legacy-dom-component-<id>.json` | the same for each component view (every component with functions) |
| `legacy-panels-component-<id>.json` | panels of all nodes of that component view |

`<id>` is the node id with every run of non-alphanumeric characters replaced by `_`
(e.g. `mini_src_App_js_App`).

| Fixture | Files | Component views |
|---|---|---|
| `mini` | 13 | 4 (App, BaseWidget, Counter, Header) |
| `realworld` | 45 | 20 |

## Procedure

See [tools/legacy/README.md](../../tools/legacy/README.md) ("Capturing goldens"). Before every
fixture reset the app state (`window.onbeforeunload = null; localStorage.clear(); …`). Keep the
browser window visible: hidden tabs throttle timers and make the capture slow (the `realworld`
capture takes a few minutes). Positions (`x`, `y`) depend on the container size and are only
needed for the optional layout comparison G3.
