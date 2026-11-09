# P05.5-S07 – Upload: App-Ordner wählen

Ohne Meilenstein (P05.5) · Abhängig von: P05.5-S06 · Umfang M

## Ziel
Enthält ein Upload mehrere Pakete mit Quelldateien, fragt die Upload-Ansicht, welcher Ordner die
App ist, und analysiert dann mit `analyzeWorkspaceAsync`. „Whole project“ (vorausgewählt) und
Uploads mit nur einem Paket laufen wie bisher.

## Kontext
- ADR-019; Architektur §4 (Datenfluss), §5 (Zustand)
- `apps/web/src/features/upload/UploadView.tsx`, `apps/web/src/features/analysis/runAnalysis.ts`
- UI-Bausteine aus P05-S11: `ui/Select.tsx`, `ui/Button.tsx`; Stil-Referenz §1/§3 (Farben,
  Schrift, Karte der Upload-Ansicht)

## Dateien
`packages/core/src/workspace/appCandidates.ts` (+ Test), `packages/core/src/index.ts`,
`apps/web/src/features/upload/ProjectChoice.tsx` (+ CSS-Modul, + Test), `UploadView.tsx` (+ Test),
`apps/web/src/features/analysis/runAnalysis.ts` (+ Test), Empfänger von `onFiles`.

## Schritte
1. Kern `appCandidates.ts`:
   ```ts
   /** Packages that can be chosen as the app: they own a source file (no tests); not the workspace root. */
   export function findAppCandidates(project: ProjectFiles): WorkspacePackage[]
   ```
   Eine Datei gehört zum tiefsten Paketordner, der sie enthält. Das Paket, dessen Ordner alle
   anderen Paketordner enthält (Workspace-Wurzel), ist kein Kandidat; dafür gibt es „Whole project“.
2. `ProjectChoice({ candidates, onAnalyze, onCancel })` ersetzt nach dem Einlesen die Karte der
   Upload-Ansicht, wenn `findAppCandidates` mindestens zwei Pakete liefert:
   - Überschrift „Which folder is the app?“, darunter „Only the files the app uses are analysed.“
   - `Select` (`aria-label="App folder"`): „Whole project“ (Wert `''`, vorausgewählt), dann je
     Kandidat `name (dir)` bzw. nur `dir` ohne Namen, sortiert nach `dir`.
   - Buttons „Cancel“ (Text, zurück zur Karte) und „Analyze“ (Raised, Primärfarbe).
3. `runAnalysis(project, appDir, store)`: mit `appDir` → `analyzeWorkspaceAsync(project, { appDir })`,
   sonst `analyzeProjectAsync(project.sources)` wie bisher. Fortschritt und Fehler unverändert.
4. Tests: `findAppCandidates(monorepo)` → `web-a`, `web-b`, `@demo/ui`, `@demo/tokens` (nicht
   `demo-root`); Upload mit `mini` zeigt keine Auswahl und analysiert sofort; Upload mit `monorepo`
   zeigt die Auswahl, „Analyze“ mit `web-a` ruft `analyzeWorkspaceAsync` mit `appDir`, „Whole
   project“ ruft den alten Weg, „Cancel“ zeigt wieder die Karte.
5. Im Browser mit `monorepo` prüfen (Bild an den Nutzer): Auswahl, Graph von `web-a` mit den
   erwarteten Knoten und Kanten.

## Akzeptanzkriterien
- [ ] Auswahl erscheint nur bei mindestens zwei Kandidaten; Vorauswahl „Whole project“.
- [ ] Graph von `web-a` wie in `monorepo.NOTES.md`; `mini`/`realworld` unverändert.
- [ ] `pnpm check` grün.

## Prüfen
`pnpm check`, `pnpm test:parity`, `pnpm dev` (Browser)

## Fallstricke
- Neu gegenüber dem Altsystem, also ohne Vorbild in der Stil-Referenz: Karte, Abstände und Schrift
  der Upload-Ansicht übernehmen, nichts Eigenes erfinden.
- Der Nutzer wünschte ein Pop-up; ein Dialog-Baustein kommt erst in P07-S02. Die Auswahl ist deshalb
  ein Schritt der Upload-Ansicht. Für den Drop auf den Graphen (P07-S05) braucht es dieselbe Auswahl
  (Hinweis in jener Karte).

## Nicht tun
- Keine gespeicherte Auswahl (P07-S05, O19) und keine Anzeige der Auswahl im Graphen.
- Keine Option „Tests einbeziehen“; Tests fallen im neuen Weg immer weg.

## Commit-Vorschlag
`feat(web): ask for the app folder when a monorepo is uploaded`
