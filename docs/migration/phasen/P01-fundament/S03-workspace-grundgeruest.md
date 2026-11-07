# P01-S03 – Workspace-Grundgerüst (pnpm, TypeScript, Biome, Vitest)

Meilenstein M0 · Abhängig von: P01-S02 · Umfang M

## Ziel
Im Root liegen alle gemeinsamen Konfigurationsdateien. Noch keine Pakete; es gibt genau einen
kleinen Test (Node-Version), damit `pnpm check` sinnvoll grün werden kann.

## Kontext
- `00-grundlagen/04-technologie-stack.md` (Catalog, Sicherheitseinstellungen, Befehle)
- `00-grundlagen/05-konventionen.md` (Formatierung)
- `anhang/A6-spike-protokoll.md` (F1, F2, F5)

## Dateien
`package.json`, `pnpm-workspace.yaml`, `.node-version`, `tsconfig.base.json`, `biome.json`,
`vitest.config.ts`, `tools/environment.test.mjs`, `patches/typhonjs-escomplex-commons@0.1.1.patch`,
`patches/typhonjs-plugin-manager@0.2.0.patch`, `README.md` (neu, kurz).

## Schritte
1. `package.json`:
   ```json
   {
     "name": "qualivis",
     "private": true,
     "type": "module",
     "packageManager": "pnpm@12.16.1",
     "engines": { "node": ">=24" },
     "scripts": {
       "dev": "pnpm --filter @qualivis/web dev",
       "build": "pnpm --filter @qualivis/web build",
       "preview": "pnpm --filter @qualivis/web preview",
       "lint": "biome check .",
       "format": "biome check --write .",
       "typecheck": "pnpm -r --if-present run typecheck",
       "test": "vitest run",
       "test:parity": "vitest run --project core test/golden",
       "check": "pnpm lint && pnpm typecheck && pnpm test",
       "legacy:extract": "node tools/legacy/extract-legacy-build.mjs",
       "legacy:serve": "node tools/legacy/serve-legacy.mjs"
     },
     "devDependencies": {
       "@biomejs/biome": "catalog:",
       "@types/node": "catalog:",
       "typescript": "catalog:",
       "vitest": "catalog:"
     }
   }
   ```
2. `pnpm-workspace.yaml`: Vorlage aus `04-technologie-stack.md` §4 1:1 übernehmen (feste
   Versionen, `saveExact`, `minimumReleaseAge: 4320`; `e2e` bleibt auskommentiert).
3. `.node-version` mit Inhalt `24`.
4. `tsconfig.base.json`:
   ```json
   {
     "compilerOptions": {
       "target": "es2023",
       "lib": ["es2023"],
       "module": "esnext",
       "moduleResolution": "bundler",
       "moduleDetection": "force",
       "jsx": "react-jsx",
       "strict": true,
       "noUncheckedIndexedAccess": true,
       "noImplicitOverride": true,
       "noFallthroughCasesInSwitch": true,
       "isolatedModules": true,
       "verbatimModuleSyntax": false,
       "esModuleInterop": true,
       "skipLibCheck": true,
       "noEmit": true,
       "types": []
     }
   }
   ```
5. `biome.json` (Biome 2.6: `preset` statt `recommended: true`):
   ```json
   {
     "$schema": "./node_modules/@biomejs/biome/configuration_schema.json",
     "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
     "files": {
       "includes": ["**", "!legacy", "!testdata", "!.cache", "!**/dist", "!pnpm-lock.yaml"]
     },
     "formatter": { "indentStyle": "space", "indentWidth": 2, "lineWidth": 100 },
     "javascript": {
       "formatter": { "quoteStyle": "single", "arrowParentheses": "asNeeded", "trailingCommas": "es5", "semicolons": "always" }
     },
     "assist": { "actions": { "source": { "organizeImports": "on" } } },
     "linter": {
       "rules": {
         "preset": "recommended",
         "complexity": {
           "noExcessiveCognitiveComplexity": { "level": "error", "options": { "maxAllowedComplexity": 15 } }
         },
         "style": {
           "useImportType": "error",
           "noParameterAssign": "error",
           "noDefaultExport": "error",
           "useConsistentTypeDefinitions": { "level": "error", "options": { "style": "type" } }
         },
         "suspicious": { "noConsole": "error", "noExplicitAny": "error", "noDoubleEquals": "error" }
       }
     },
     "overrides": [
       {
         "includes": ["**/*.config.ts", "**/vite.config.ts", "**/vitest.config.ts", "**/playwright.config.ts"],
         "linter": { "rules": { "style": { "noDefaultExport": "off" } } }
       },
       {
         "includes": ["tools/**", "**/*.test.ts", "**/*.test.tsx", "**/test/**"],
         "linter": { "rules": { "suspicious": { "noConsole": "off" } } }
       }
     ]
   }
   ```
   (Konfiguration inkl. Ignore-Mustern und `useConsistentTypeDefinitions` im Spike geprüft,
   `anhang/A6` V20/V24. `**/*.d.ts` mit `declare module` bleibt erlaubt: Die Regel betrifft nur
   `interface` vs. `type`.)
6. `vitest.config.ts` (Projekte werden später ergänzt):
   ```ts
   import { defineConfig } from 'vitest/config';

   export default defineConfig({
     test: {
       projects: [
         { test: { name: 'tools', environment: 'node', include: ['tools/**/*.test.mjs'] } },
         // 'packages/core' is added in P03-S01, 'apps/web' in P04-S01
       ],
     },
   });
   ```
7. `tools/environment.test.mjs`:
   ```js
   import { describe, expect, it } from 'vitest';

   describe('development environment', () => {
     it('runs on Node.js 24 or newer', () => {
       expect(Number(process.versions.node.split('.')[0])).toBeGreaterThanOrEqual(24);
     });
   });
   ```
8. Patches: beide Dateien aus `legacy/angular/patches/` kopieren und umschreiben (in jeder Zeile
   `a/node_modules/<paket>/` → `a/`, `b/node_modules/<paket>/` → `b/`), Dateinamen
   `patches/typhonjs-escomplex-commons@0.1.1.patch` und `patches/typhonjs-plugin-manager@0.2.0.patch`.
   Erste Zeile danach z. B. `diff --git a/dist/PluginManager.js b/dist/PluginManager.js`.
9. Root-`README.md` (kurz): „Qualivis“ – Projektzweck (ein Satz + Verweis auf das Paper),
   Voraussetzungen (Node 24, pnpm 12, Windows oder macOS), Befehle (`pnpm install`, `pnpm dev`,
   `pnpm check`), Verweis auf `docs/migration/README.md` und `legacy/angular/LEGACY.md`. Keine
   Klarnamen.

## Akzeptanzkriterien
- [ ] Alle Dateien vorhanden, JSON/YAML syntaktisch gültig.
- [ ] Patch-Dateien beginnen mit `diff --git a/dist/` bzw. `diff --git a/dist/utils/ast/astSyntax.js`.
- [ ] Keine Datei unter `legacy/` wurde geändert.

## Prüfen
Erst nach P01-S04 (Installation) ausführbar.

## Fallstricke
- **Biome-Ignore:** Ob `!legacy` und `!testdata` ganze Ordner ausschließen, nach der Installation mit
  `pnpm exec biome check . --verbose` prüfen (die Liste geprüfter Dateien darf nichts aus `legacy/`
  enthalten). Falls doch: in Biome 2.2+ `"!!legacy"` (doppeltes Ausrufezeichen) verwenden.
- **Inline-Projekt in Vitest:** im Spike nur mit Pfad-Projekten geprüft. Falls Vitest das Objekt
  nicht akzeptiert: `tools/vitest.config.ts` mit `defineProject` anlegen und `'tools'` eintragen.
- `noDefaultExport` greift auch bei Vite-/Vitest-Konfigurationen – deshalb das Override.

## Nicht tun
- Kein `pnpm install` selbst ausführen (Hook, README R4).
- Keine weiteren Abhängigkeiten.

## Commit-Vorschlag
`build(repo): add pnpm workspace, TypeScript, Biome and Vitest configuration`
