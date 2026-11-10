# P05.5-S03 – Kern: Pakete und tsconfig-Pfade lesen

Ohne Meilenstein (P05.5) · Abhängig von: P05.5-S02 · Umfang M

## Ziel
Der Kern findet die Pakete eines Uploads (Ordner mit `package.json`) und ermittelt für jede Datei die
Pfad-Aliase (`paths`) der zuständigen tsconfig/jsconfig, mit `extends` und JSONC, so wie TypeScript
sie anwendet.

## Kontext
- ADR-019; Architektur §2–§3 (Kern ohne DOM, nur über `index.ts` exportieren)
- TypeScript-Doku zu `extends`, `baseUrl` und `paths` (Version der installierten TS-Doku)
- Testprojekt `monorepo` (S01)

## Dateien
`packages/core/src/workspace/jsonc.ts`, `packages.ts`, `tsconfig.ts` (je + Test),
`packages/core/src/index.ts`.

## Schritte
1. `jsonc.ts`: `parseJsonc(text: string): unknown`. Entfernt `//`- und `/* */`-Kommentare und Kommas
   vor `}`/`]` außerhalb von Zeichenketten (Escapes beachten), dann `JSON.parse`. Fehler werfen.
   Keine neue Abhängigkeit (R7).
2. `packages.ts`:
   ```ts
   export type WorkspacePackage = {
       /** Folder of the package.json, e.g. '/repo/shared/ui'. */
       dir: string;
       name?: string;
       entries: { source?: string; module?: string; main?: string };
   };
   /** One entry per package.json among the configs, sorted by dir. Invalid JSON: console.warn, skipped. */
   export function findPackages(configs: readonly SourceFile[]): WorkspacePackage[]
   ```
3. `tsconfig.ts`:
   ```ts
   /** Where `paths` targets are resolved from, and the patterns. */
   export type PathMapping = { baseDir: string; paths: Readonly<Record<string, readonly string[]>> };
   /** Path aliases that apply to a file: from the nearest tsconfig.json (else jsconfig.json) above it. */
   export function pathMappingFor(filePath: string, configs: readonly SourceFile[]): PathMapping | undefined
   ```
   Regeln (wie TypeScript):
   - Zuständig ist die nächste `tsconfig.json` im Ordner der Datei oder darüber, in einem Ordner ohne
     sie die `jsconfig.json`.
   - `extends`: Zeichenkette oder Liste; relativ zur Datei, ohne Endung wird `.json` ergänzt. Ein
     Paketname (z. B. `@tsconfig/…`) ist im Upload nicht auflösbar → `console.warn`, übergehen.
     Zyklen abbrechen.
   - `compilerOptions` werden flach zusammengeführt, das Kind gewinnt. `paths` kommt vollständig aus
     der nächsten Datei der Kette, die `paths` hat (keine Mischung mit dem Elternteil).
   - `baseDir`: der Ordner von `baseUrl` (relativ zu der Datei, die `baseUrl` setzt), wenn eine Datei
     der Kette `baseUrl` hat, sonst der Ordner der Datei, die `paths` setzt.
   - Hat die Kette keine `paths`, aber die Datei hat `references`: die erste referenzierte
     Konfiguration mit `paths` (Vite-Vorlagen legen sie in `tsconfig.app.json`).
   - Pfade mit `path-browserify` (`posix`) bilden; sie bleiben absolut mit `/`.
4. Exporte in `index.ts`.
5. Tests: JSONC (Kommentare, nachgestellte Kommas, `"//"` in einer Zeichenkette bleibt erhalten);
   `findPackages` auf `monorepo` (5 Pakete inkl. Wurzel, Namen, keine Einträge bei `@demo/ui`);
   `pathMappingFor` für `apps/web-a/components/page/Page.tsx` (Muster `@demo/ui/*` und `@data/*`,
   `baseDir` = `/monorepo/apps/web-a`), für `shared/ui/src/…` (nur `@data/*` aus der Basis,
   `baseDir` = `/monorepo`), `paths` des Kindes ersetzt die der Basis, `baseUrl` verschiebt
   `baseDir`, unbekanntes `extends` warnt, `references` mit `tsconfig.app.json`.

## Akzeptanzkriterien
- [ ] Alle Fälle oben getestet und grün; keine DOM-Typen im Kern.
- [ ] `pnpm check` grün.

## Prüfen
`pnpm check`

## Fallstricke
- tsconfig-Dateien sind JSONC; `package.json` ist strenges JSON. Beide gehen durch `parseJsonc`.
- Ein Wurzel-`package.json` mit `workspaces` ist auch ein Paket; welche Pakete zur Auswahl stehen,
  entscheidet erst S07.
- Die Upload-Pfade beginnen mit `/` und dem Namen des hineingezogenen Ordners; Relativpfade in
  `extends` und `paths` können über ihn hinaus zeigen (zwei getrennt hineingezogene Ordner). Dann
  gibt es die Datei einfach nicht; nicht raten.

## Nicht tun
- Kein Lesen von `pnpm-workspace.yaml` oder `workspaces`: Pakete sind alle `package.json`-Ordner.
- Keine Auswertung von Vite-, webpack- oder Babel-Alias-Konfigurationen (Code, nicht Daten).

## Commit-Vorschlag
`feat(core): read workspace packages and tsconfig path aliases`
