# Technologie-Stack (verifiziert im Spike, Stand 07.11.2026)

Alle Versionen sind **fest gepinnt** (keine `^`/`~`-Bereiche). Aktualisierungen erfolgen bewusst,
später z. B. per Renovate (ADR-014). Die App muss auf **Windows und macOS** entwickelt werden können.

## 1. Laufzeit und Werkzeuge

| Werkzeug | Version | Hinweis |
|---|---|---|
| Node.js | 24 (LTS) | `.node-version` = `24`; `engines.node` = `>=24`. (Der Spike lief unter Node 26 auf Windows; Node 24 auf dem Mac erfüllt alle Anforderungen von Vite 8, Vitest 5, TypeScript 7.) |
| pnpm | 12.16.1 | `packageManager: "pnpm@12.16.1"`; npm/yarn werden nicht benutzt |
| TypeScript | 7.0.2 (nativer Compiler) | nur `tsc --noEmit` zur Prüfung; Vite transpiliert selbst |
| Vite | 8.3.5 (Rolldown) | Dev-Server nur `127.0.0.1` (Sicherheitsmeldungen betreffen den Dev-Server) |
| Vitest | 5.0.5 | Testrunner; Umgebungen `node` (core) und `jsdom` (web), siehe `06-teststrategie.md` §2 |
| Biome | 2.6.4 | ersetzt ESLint + Prettier; `linter.rules.preset: "recommended"` |
| Playwright | 1.64.1 (nur `e2e/`, ab P09) | Systembrowser (Windows `msedge`, macOS `chrome`), **kein** Browser-Download |

## 2. Laufzeit-Abhängigkeiten

| Paket | Version | Paket im Workspace | Zweck |
|---|---|---|---|
| `@babel/parser` | 7.29.12 | core | AST |
| `@babel/traverse` | 7.29.12 | core | AST-Traversierung |
| `@babel/types` | 7.29.11 | core | AST-Prüfungen |
| `typhonjs-escomplex-project` | 0.1.0 | core | Metriken (+ 2 pnpm-Patches, §5) |
| `jlouvain` | 2.0.0 | core | Louvain-Cluster |
| `path-browserify` | 1.0.1 | core, web | Nodes `path.posix` als Paket – für escomplex in Node **und** Browser (ADR-005) |
| `webcola` | 3.4.0 | web | geschichtetes Layout (nur `dist/src/layout`) |
| `d3-force` | 3.0.0 | web | Kraft-Layout |
| `react`, `react-dom` | 19.3.1 | web | UI |
| `jotai` | 3.0.1 | web | Zustandsverwaltung (ADR-013) |
| `@codemirror/state` | 6.7.6 | web | Quelltext-Anzeige |
| `@codemirror/view` | 6.43.15 | web | 〃 |
| `@codemirror/language` | 6.13.1 | web | 〃 |
| `@codemirror/lang-javascript` | 6.2.5 | web | 〃 |
| `@codemirror/search` | 6.7.2 | web | Suche (Strg/Cmd+F) |
| `@fontsource/roboto` | 5.3.0 | web | Schrift lokal |
| `@fontsource/material-icons` | 5.3.0 | web | Icons lokal |

## 3. Entwicklungs-Abhängigkeiten

`typescript 7.0.2`, `@biomejs/biome 2.6.4`, `vitest 5.0.5`, `jsdom 30.1.3`,
`@vitejs/plugin-react 6.1.2`, `vite 8.3.5`, `@testing-library/react 16.3.3`,
`@testing-library/dom 10.4.2`, `@testing-library/user-event 14.6.8`, `@types/react 19.3.0`,
`@types/react-dom 19.3.0`, `@types/babel__traverse 7.28.0`, `@types/d3-force 3.0.10`,
`@types/node 24.19.2`. Nur in `e2e/`: `@playwright/test 1.64.1`.

**Bewusst nicht verwendet:** UI-Bibliotheken (MUI: 31 Pakete + Emotion), d3-zoom/-drag/-selection/
-transition/-color (durch eigenen Code ersetzt, ADR-003), Router-Pakete, `@testing-library/jest-dom`
(normale Assertions genügen), happy-dom (8 Sicherheitsmeldungen, 3 kritisch), Vitest-Browser-Modus
(5 Meldungen, 3 kritisch), ESLint/Prettier (≈ 100 Pakete), Coverage-Werkzeuge (kein Zusatzpaket).

## 4. `pnpm-workspace.yaml` (Vorlage)

```yaml
packages:
  - packages/*
  - apps/*
  # - e2e          (activated in P09-S01)

# Exact versions when adding packages (pnpm add writes "1.2.3", not "^1.2.3")
saveExact: true

# Supply-chain hardening
minimumReleaseAge: 4320          # 3 days: new versions are installable 3 days after release
trustPolicy: no-downgrade        # refuse versions with weaker provenance than earlier ones
blockExoticSubdeps: true         # no git/tarball transitive dependencies
strictDepBuilds: true            # fail on install scripts that are not reviewed below
allowBuilds:
  core-js: false                 # postinstall banner (pulled in by escomplex via babel-runtime 6)
  fsevents: false                # macOS file watcher; ships a prebuilt binary, no build needed

patchedDependencies:
  typhonjs-escomplex-commons@0.1.1: patches/typhonjs-escomplex-commons@0.1.1.patch
  typhonjs-plugin-manager@0.2.0: patches/typhonjs-plugin-manager@0.2.0.patch

catalog:
  '@babel/parser': 7.29.12
  '@babel/traverse': 7.29.12
  '@babel/types': 7.29.11
  '@types/babel__traverse': 7.28.0
  typhonjs-escomplex-project: 0.1.0
  jlouvain: 2.0.0
  path-browserify: 1.0.1
  webcola: 3.4.0
  d3-force: 3.0.0
  '@types/d3-force': 3.0.10
  react: 19.3.1
  react-dom: 19.3.1
  '@types/react': 19.3.0
  '@types/react-dom': 19.3.0
  jotai: 3.0.1
  '@codemirror/state': 6.7.6
  '@codemirror/view': 6.43.15
  '@codemirror/language': 6.13.1
  '@codemirror/lang-javascript': 6.2.5
  '@codemirror/search': 6.7.2
  '@fontsource/roboto': 5.3.0
  '@fontsource/material-icons': 5.3.0
  vite: 8.3.5
  '@vitejs/plugin-react': 6.1.2
  vitest: 5.0.5
  jsdom: 30.1.3
  '@testing-library/react': 16.3.3
  '@testing-library/dom': 10.4.2
  '@testing-library/user-event': 14.6.8
  '@biomejs/biome': 2.6.4
  typescript: 7.0.2
  '@types/node': 24.19.2
  '@playwright/test': 1.64.1
```

### Erläuterungen zur Vorlage

- **Catalog:** Die Versionen stehen **einmal** hier; die `package.json` der Pakete schreiben nur
  `"react": "catalog:"`. Ein Update (manuell oder Renovate) ändert nur diese Datei.
- **Anführungszeichen** um Schlüssel wie `'@babel/parser'`: In YAML hat `@` am Anfang eines Werts eine
  reservierte Bedeutung, deshalb müssen Paketnamen mit Scope in Anführungszeichen stehen. Namen ohne
  `@` (z. B. `react`) brauchen keine.
- **Unbekannte Schlüssel** (geprüft im Spike): Weil `package.json` pnpm per `packageManager` auf eine
  Version festlegt, bricht pnpm 12 bei einem falsch geschriebenen oder unbekannten Schlüssel mit
  `ERR_PNPM_UNRECOGNIZED_WORKSPACE_SETTINGS` ab (z. B. bei `bogusSettingXyz`). Tippfehler fallen also
  sofort auf. `saveExact` und `minimumReleaseAge: 4320` wurden im Spike als gültig erkannt.
- **`minimumReleaseAge` und feste Versionen:** Alle Versionen oben waren am 07.11.2026 älter als
  3 Tage. Wer später eine Version anhebt, wählt eine, die mindestens 3 Tage alt ist. Bietet pnpm an,
  eine zu junge Version auszunehmen (`minimumReleaseAgeExclude`): **ablehnen** – im Spike führte das
  zu zwei gemischten parse5-Versionen und einem kaputten jsdom (`anhang/A6`, F1).
- **`strictDepBuilds`/`allowBuilds`:** Pakete mit Install-Skript werden nur gebaut, wenn sie hier
  erlaubt sind. Meldet pnpm ein weiteres Paket: stoppen, dem Nutzer Paket und Skript nennen,
  Entscheidung abwarten. Vite 8 (Rolldown) und Biome liefern Binärpakete über
  `optionalDependencies` ohne Install-Skript.
- **macOS:** `fsevents` liegt als fertiges Binary im Paket; ob die Dateiüberwachung von `pnpm dev`
  auf dem Mac funktioniert, wird in P01-S04 geprüft.
- **Nicht im Spike installiert** (beim ersten Install auf Auflösung achten): `@codemirror/search`,
  `@fontsource/*`, `jotai`, `path-browserify`, `@playwright/test` – alle ohne Abhängigkeiten bzw.
  aus demselben Projekt.

## 5. Patches – was das ist und warum

Zwei der alten escomplex-Pakete haben Fehler, die das Altsystem mit **patch-package** direkt in
`node_modules` korrigiert hat (`legacy/angular/patches/*.patch`). Ohne diese Korrekturen stürzt die
Analyse bei bestimmten Code-Konstrukten ab bzw. lässt sich nicht bündeln:

| Paket | Problem | Korrektur |
|---|---|---|
| `typhonjs-escomplex-commons@0.1.1` (`utils/ast/astSyntax.js`) | Bei Zuweisungen mit einem AST-Knotentyp, den escomplex nicht kennt (neuere Syntax), wird eine nicht existierende Funktion aufgerufen → Absturz | Zwei Abfragen `if (typeof this[node.right.type] === 'function')` |
| `typhonjs-plugin-manager@0.2.0` (`dist/PluginManager.js`) | Lädt Plugins per dynamischem `require(pfad)`; das bricht Bundler im Browser | Vier `require(...)`-Aufrufe auskommentiert (werden nicht gebraucht) |

pnpm kann solche Korrekturen selbst anwenden (**ohne** patch-package): Die Patch-Dateien liegen in
`patches/`, und `patchedDependencies` in `pnpm-workspace.yaml` sagt pnpm, welche Datei zu welchem
Paket gehört. Bei jedem `pnpm install` wendet pnpm sie an; der Hash steht im Lockfile. Passt ein
Patch nicht (z. B. nach einem Versionswechsel), bricht die Installation ab.

Umstellung (P01-S03): Die alten Dateien haben Pfade wie `a/node_modules/typhonjs-plugin-manager/dist/…`;
pnpm erwartet Pfade relativ zum Paket (`a/dist/…`). Also in jeder Zeile `a/node_modules/<paket>/` →
`a/` und `b/node_modules/<paket>/` → `b/`. Dateinamen: `patches/<paket>@<version>.patch`. Spätere
Änderungen an einem Patch: `pnpm patch <paket>@<version>` (öffnet eine Kopie zum Bearbeiten), danach
`pnpm patch-commit <pfad>` – beides führt wegen des Hooks der Nutzer aus.

## 6. Wichtige Befehle (Root, auf Windows und macOS gleich)

| Befehl | Zweck |
|---|---|
| `pnpm install` | **nur der Nutzer** (Hook, siehe README R4) |
| `pnpm dev` | Web-App starten (`apps/web`, `http://127.0.0.1:5173`) |
| `pnpm build` | Produktions-Build der Web-App |
| `pnpm preview` | gebaute App lokal ausliefern (`http://127.0.0.1:4173`) |
| `pnpm lint` / `pnpm format` | `biome check .` / `biome check --write .` |
| `pnpm typecheck` | `pnpm -r --if-present run typecheck` |
| `pnpm test` | `vitest run` (alle Projekte) |
| `pnpm test:parity` | nur Golden-Tests |
| `pnpm check` | `pnpm lint && pnpm typecheck && pnpm test` |
| `pnpm legacy:extract` / `pnpm legacy:serve` | Altsystem lokal bereitstellen |
| `pnpm audit --prod` | Sicherheitsmeldungen der Laufzeit-Abhängigkeiten |
