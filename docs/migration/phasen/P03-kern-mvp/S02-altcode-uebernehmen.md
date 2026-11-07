# P03-S02 – Analysehelfer 1:1 übernehmen (vorerst `@ts-nocheck`)

Meilenstein M1 · Abhängig von: P03-S01 · Umfang S

## Ziel
Die Analysehelfer des Altsystems liegen unverändert (bis auf Importe) in
`packages/core/src/legacy/`. Damit sie sofort lauffähig sind, haben sie vorübergehend
`// @ts-nocheck`; die Typisierung folgt in S06 – abgesichert durch G1.

## Kontext
- `01-referenz-altsystem/02-analyse-kern.md` §2, §3 (Anpassungen 1, 2, 7), §6 (Eigenheiten)
- `anhang/A4-posix-path-und-interop.md` (`cjsDefault`)

## Dateien
Kopieren aus `legacy/angular/src/app/helper/` nach `packages/core/src/legacy/` (Dateinamen
unverändert): `parser.ts`, `traverse.ts`, `traverseClassComponent.ts`,
`traverseFunctionComponent.ts`, `traverseHelper.ts`, `findReport.ts`, `generateAppGraph.ts`,
`extractFileTree.ts`, `isComponentFile.ts`, `nestedStringAccess.ts`.
Neu: `packages/core/src/analysis/interop.ts`, `packages/core/src/analysis/interop.test.ts`,
`packages/core/src/legacy/README.md`.

## Schritte
1. Dateien kopieren (Inhalt byte-gleich).
2. Je Datei als **erste Zeile**:
   `// @ts-nocheck -- legacy code copied 1:1 from legacy/angular; typed in P03-S06`
3. Importe umstellen (nur Pfade/Namen, keine Logik):
   | Alt | Neu |
   |---|---|
   | `'../interfaces'` | `'../model/graph'` bzw. `'../model/fileMap'` (je nach Typ) |
   | `'../types'` | `'../model/types'` |
   | `'../constants/special-methods'` | `'../model/specialMethods'` |
   | `'../constants/files'` | `'../model/files'` |
   | `'./getFilesAsync'` (Typ `FileWithPath`) | `import type { FileWithPath } from '../model/files'` |
   | `import { NodePath } from 'babel-traverse'` | `import type { NodePath } from '@babel/traverse'` |
4. In `traverse.ts` und `traverseHelper.ts` den Default-Import von `@babel/traverse` ersetzen:
   ```ts
   import _babelTraverse from '@babel/traverse';
   import { cjsDefault } from '../analysis/interop';

   const babelTraverse = cjsDefault(_babelTraverse);
   ```
5. `analysis/interop.ts` aus A4. Test `interop.test.ts`: (a) Funktion → dieselbe Funktion;
   (b) `{ default: fn, __esModule: true }` → `fn`; (c) Objekt ohne `default` → dasselbe Objekt;
   (d) Klasse (Funktion) → dieselbe Klasse.
6. `legacy/README.md`: „Copied 1:1 from `legacy/angular/src/app/helper` (commit a071f27). Do not
   change behaviour. Allowed: import paths, type annotations, casts. Behaviour is pinned by the
   golden test G1. Known quirks: see docs/migration/01-referenz-altsystem/02-analyse-kern.md §6.“
7. Biome-Override für den Altcode in `biome.json` ergänzen (kein Umbau des Altcodes durch Lint):
   ```json
   {
     "includes": ["packages/core/src/legacy/**"],
     "formatter": { "enabled": false },
     "linter": { "rules": {
       "complexity": { "noExcessiveCognitiveComplexity": "off", "useOptionalChain": "off", "useMathMinMax": "off" },
       "style": { "useTemplate": "off", "noParameterAssign": "off", "useImportType": "error" },
       "suspicious": { "noExplicitAny": "off", "noImplicitAnyLet": "off", "useIterableCallbackReturn": "off", "noConsole": "off", "noTsIgnore": "off", "noDoubleEquals": "off" },
       "correctness": { "noUnusedFunctionParameters": "off", "noUnusedVariables": "off" }
     } }
   }
   ```
   Danach `pnpm exec biome check packages/core/src/legacy`. Bleiben Fehler übrig, die eine
   **Logikänderung** verlangen würden: die betreffende Regel im Override abschalten (nicht den Code
   ändern) und in `legacy/README.md` notieren. `useImportType` darf per `biome check --write`
   automatisch korrigiert werden (reine Typimporte).

## Akzeptanzkriterien
- [ ] Zehn Dateien in `src/legacy/`, Inhalt bis auf Zeile 1 und Importe identisch mit dem Original
      (`git diff --no-index legacy/angular/src/app/helper/traverse.ts packages/core/src/legacy/traverse.ts`
      zeigt nur diese Zeilen).
- [ ] `interop`-Tests grün; `pnpm check` grün.

## Prüfen
`pnpm check`; Diff wie oben für jede Datei.

## Fallstricke
- `findReport.ts` importiert Typen aus `interfaces` – auf `model/graph`/`model/fileMap` aufteilen.
- `getFilesAsync.ts`, `generateLinkReferences.ts`, `isColliding.ts`, `looksLike.ts`, `cookie.ts`,
  `debounce.ts` **nicht** in den Kern kopieren (siehe Analyse-Kern §2).

## Nicht tun
- Keine „offensichtlichen“ Fehler beheben (K1–K11 sind gewollt).
- Kein Umformatieren des Altcodes.

## Commit-Vorschlag
`feat(core): copy legacy analysis helpers 1:1`
