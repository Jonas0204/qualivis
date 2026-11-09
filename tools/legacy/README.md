# Legacy build tools

Tools to run the original Angular production build (branch `gh-pages`) locally, **without**
installing its old dependencies, and to capture golden reference data from it.

> Local use only. The legacy build contains libraries with known vulnerabilities (among others
> `@babel/traverse` 7.7, CVE-2023-45133). Never serve it publicly and only feed it your own test
> projects. The server binds to `127.0.0.1`.

## Commands

| Command | Effect |
|---|---|
| `pnpm legacy:extract [ref]` | `git archive` of the legacy build commit `5f0155e` (branch `gh-pages`) → `.cache/legacy-build/` (needs `git` and `tar`; if the commit is missing locally: `git fetch origin gh-pages`) |
| `pnpm legacy:serve [port]` | serves the build at `http://127.0.0.1:4300/component-graph/` (default port 4300) |

## Server endpoints (`serve-legacy.mjs`)

| Request | Response |
|---|---|
| `GET /component-graph/*` | legacy build, unknown paths fall back to `index.html` |
| `GET /fixtures/<name>/manifest.json` | sorted list of the fixture's files (canonical order, ADR-006) |
| `GET /fixtures/<name>/<path>` | content of a fixture file from `testdata/fixtures/` |
| `POST /capture/<name>/<file>` | writes the request body to `testdata/golden/<name>/<file>` |
| `GET /` | redirect to `/component-graph/` |

Paths that leave the base directories are refused (HTTP 500). For tests the directories can be
overridden with `QV_LEGACY_BUILD_DIR`, `QV_FIXTURES_DIR` and `QV_CAPTURE_DIR`.

## Capturing goldens (`capture.browser.js`)

1. `pnpm legacy:extract`, then `pnpm legacy:serve`.
2. Open `http://127.0.0.1:4300/component-graph/` and run in the browser console first:
   `window.onbeforeunload = null; localStorage.clear(); location.href = '/component-graph/';`
   (the legacy app saves its state on `beforeunload` and restores it on start).
3. Paste the content of `capture.browser.js`, then run `await qvCapture('<fixture>')`.
   Expected result for `mini`: `{ fixture: 'mini', files: 8, componentViews: 4 }`.
4. Start again at step 2 for the next fixture.

Cluster colours (`capture-cluster-colors.browser.js`, P05-S02): after step 2 paste the script and
run `await qvCaptureClusterColors('mini')`. It loads the fixture itself, opens the component view
of `App`, switches the cluster colours on and writes only `legacy-cluster-colors.json`. Expected
result: 9 nodes with clusters 0–6. Do not run `qvCapture` for it: that rewrites all goldens, and
their positions depend on the window size.

Golden files are never edited by hand; see [testdata/README.md](../../testdata/README.md).

## Known limits

- Keep the browser window visible: hidden tabs throttle timers (`realworld` then takes minutes).
- The legacy build loads Roboto and Material Icons from the Google CDN. Offline only the fonts are
  missing; the captured data does not depend on them (except which labels are hidden because they
  overlap, which is not compared).
- Component views are opened by double click: the legacy deep link `?id=` does not work under the
  base path (functional inventory N4).
- A click on a node shows a one-time snackbar; this does not disturb the capture.
- Only default settings are captured. Variants (e.g. another size metric) are covered by unit
  tests of the rules (P05-S01).
- Positions (`x`, `y`) depend on the container size (1024 × 768 window → container 158 × 704 px);
  they are only used for the optional layout comparison G3.
