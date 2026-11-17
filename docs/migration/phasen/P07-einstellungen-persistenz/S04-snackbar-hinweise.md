# P07-S04 – Snackbar und einmalige Hinweise

Meilenstein M4 · Abhängig von: P07-S03 · Umfang S

## Ziel
Eine Snackbar zeigt Hinweise (8 s, optional mit Aktion). Der Tipp zum Doppelklick erscheint je
Browser nur einmal (den Tipp zum Fluss-Layout gibt es nicht mehr, ADR-011 A25); Fehler (Analyse, Speichern) werden ebenfalls als Snackbar gezeigt.

## Kontext
- Funktionsinventar G2, G16, P2
- Altcode: `graph.component.ts:145-164, 1036-1046`, `helper/cookie.ts`

## Dateien
`apps/web/src/ui/Snackbar.tsx` (+ CSS, + Test), `apps/web/src/state/snackbarAtoms.ts` (+ Test),
`apps/web/src/lib/onceFlags.ts` (+ Test), Anbindung in `GraphView`, `runAnalysis` (Fehler).

## Schritte
1. `snackbarAtom` + Schreib-Atom `showSnackbarAtom`: Warteschlange; `show({ message, action?: { label, run }, durationMs = 8000 })`;
   eine Meldung gleichzeitig (Material-Verhalten: neue ersetzt alte).
2. `Snackbar`: unten zentriert, `role="status"` (`aria-live="polite"`), Hintergrund `#323232`, Text
   `hsla(0,0%,100%,.7)`, Aktion in `--qv-accent` (Gewicht 500); schließt nach Dauer oder Aktion.
3. `onceFlags`: `runOnce(key, fn)` → wenn `qualivis.once.<key>` fehlt: setzen und `fn()` ausführen
   (Ersatz für `registerCookie`). Schlüssel: `toastDoubleClickComponent`.
4. Tipps:
   - Klick auf Komponente mit Funktionen → einmalig „Tip: You can double click a component that has
     inner functions to open it!“ (ohne Aktion).
   - Den Tipp „Try out disabling flow layout on large graphs“ (KV mit > 30 Knoten) gibt es nicht
     mehr (ADR-011 A25).
5. Fehler: `runAnalysis`-Fehler → Snackbar „Analysis failed: …“ (ersetzt die Fehlerzeile mit `role="alert"` in `UploadView.tsx`);
   Speicherfehler (S05) → „Could not save the analysis in this browser (storage full or disabled).“
6. Tests: Tipp nur einmal (zweiter Klick zeigt nichts); Snackbar verschwindet nach 8 s (Fake-Timer).

## Akzeptanzkriterien
- [ ] Texte exakt; Verhalten wie Altsystem (außer ADR-011 A25).
- [ ] Tests grün; `pnpm check` grün.

## Commit-Vorschlag
`feat(web): add snackbar, one-time tips and error messages`
