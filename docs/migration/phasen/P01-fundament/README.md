# P01 – Fundament (Meilenstein M0) – erledigt

Umgesetzt am 08.11.2026 auf Branch `rewrite/m0-fundament` (zusammen mit P02, ein Commit, PR nach
`rewrite/react`). Die Schritt-Karten S01–S04 wurden danach entfernt, weil der Code jetzt im Repo
steht. Ältere Fassungen liegen in der Git-Historie (Commit `e771129`).

## Ergebnis

| Was | Wo |
|---|---|
| Angular-App unverändert (per `git mv`), dazu 1:1-Kopien von `.editorconfig` und der alten `.gitignore` | `legacy/angular/` (`LEGACY.md`) |
| pnpm-Workspace: feste Versionen im Catalog, `saveExact`, `minimumReleaseAge: 4320`, `trustPolicy`, `blockExoticSubdeps`, `strictDepBuilds`, `allowBuilds` | `pnpm-workspace.yaml` |
| Root-Paket mit allen Befehlen (`pnpm check`, `pnpm legacy:*` …), Node ≥ 24, pnpm 12.16.1 | `package.json`, `.node-version` |
| TypeScript-Basis, Biome, Vitest-Projekte (`tools`) | `tsconfig.base.json`, `biome.json`, `vitest.config.ts` |
| Zeilenenden LF, `testdata/**` ohne Umwandlung | `.gitattributes` |
| pnpm-Patches für escomplex (Pfade umgeschrieben, identisch zum Spike) | `patches/*.patch` |
| Kurzbeschreibung des Repos | `README.md` |

`pnpm check` ist grün: Biome, TypeScript (noch keine Pakete), Vitest mit 3 Testdateien
(`tools/environment.test.mjs`, Legacy-Server, Diff-Werkzeug).

## Abweichungen vom ursprünglichen Plan

- **`patchedDependencies` auskommentiert:** pnpm lehnt Patches für Pakete ab, die noch nicht
  installiert sind. Die Zeilen werden in P03-S01 zusammen mit escomplex aktiviert.
- **Biome prüft kein Markdown:** Biome 2.6 formatiert auch `*.md` (es hätte alle Plan-Tabellen
  umgebrochen). Deshalb ist `!**/*.md` in `biome.json` eingetragen. YAML formatiert Biome mit; seitdem stehen
  die Catalog-Schlüssel in doppelten Anführungszeichen.
- **`tools/legacy/capture.browser.js`:** Für diese Datei sind in Biome `useOptionalChain` und die
  Komplexitätsgrenze ausgeschaltet. Der automatische Fix würde aus `x && x.y` ein `x?.y` machen,
  und dann stünde `undefined` statt `null` im JSON. Damit änderten sich die Goldens.
