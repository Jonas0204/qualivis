# P07-S02 – Einstellungsdialog, Schalter, Dialog-Baustein

Meilenstein M4 · Abhängig von: P07-S01 · Umfang M

## Ziel
Zahnrad rechts in der Toolbar öffnet „Settings“ mit den sieben Schaltern in Altsystem-Reihenfolge;
„Cancel“ verwirft, „Save“ übernimmt.

## Kontext
- Funktionsinventar §7 (Labels exakt, Reihenfolge, Einrückung, Tooltip); Stil-Referenz §1/§3
  (Dialog, Schalter, Farben)
- Altcode: `components/settings-modal/*`, `app.component.ts:30-39`

## Dateien
`apps/web/src/ui/Dialog.tsx`, `SlideToggle.tsx` (+ CSS-Module, + Tests),
`apps/web/src/features/settings/SettingsDialog.tsx` (+ Test), `apps/web/src/app/Toolbar.tsx`.

## Schritte
1. `Dialog({ open, title, onClose, actions, children })` auf Basis des nativen `<dialog>`
   (`showModal()`; Escape schließt = Cancel; Hintergrund abgedunkelt `rgba(0,0,0,.32)`; Breite 480 px;
   Radius 4 px; Innenabstand 24 px; Schatten `--qv-dialog-shadow`; Titel 500 20px/32px;
   Aktionen rechtsbündig). Startfokus auf Element mit `data-autofocus` (Altsystem: „Save“).
2. `SlideToggle({ checked, onChange, label, title?, indent? })`: `<button role="switch" aria-checked>`;
   Label links, Schalter rechts (Zeile 40 px, `justify-content: space-between`); Bahn 36 × 14 px, Daumen
   20 px; an: Daumen `--qv-accent`, Bahn `--qv-accent-track`; aus: Daumen `--qv-toggle-thumb-off`, Bahn
   `--qv-toggle-track-off`; Übergang 80 ms. Cursor: Label `default`, Schalter `pointer`.
3. `SettingsDialog`: lokaler Formularzustand = Kopie der aktuellen Einstellungen beim Öffnen
   (kontrolliert); Schalter in Reihenfolge §7; „Show indirect connected nodes“ mit 16 px Einrückung;
   „Highlight nodes …“ mit identischem `title`. „Cancel“ (Text-Button) schließt ohne Änderung,
   „Save“ (Raised, Primärfarbe) → `updateSettingsAtom` mit dem Formular und schließen. Abstand unter den Schaltern 16 px.
4. Toolbar: rechts `IconButton` `settings`, `aria-label="Settings"` → Dialog öffnen.
5. Tests (mit `renderWithState`, Startwerte per `initial(settingsAtom, …)`, `06-teststrategie.md` §2):
   Dialog zeigt sieben Schalter mit exakten Labels in Reihenfolge und aktuellen Werten;
   Umschalten + Cancel ändert nichts; Umschalten + Save speichert (`store.get(settingsAtom)` +
   `localStorage`); Escape = Cancel; Fokus startet auf „Save“.

## Akzeptanzkriterien
- [ ] Optik und Verhalten wie Altsystem.
- [ ] Tests grün; `pnpm check` grün.

## Fallstricke
- jsdom unterstützt `HTMLDialogElement.showModal` je nach Version nur teilweise – im Test bei Bedarf
  `showModal`/`close` auf dem Prototyp stubben (nur im Test-Setup).

## Commit-Vorschlag
`feat(web): add settings dialog with slide toggles`
