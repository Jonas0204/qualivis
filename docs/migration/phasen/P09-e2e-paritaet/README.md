# P09 – End-to-End-Tests und Parität (Meilenstein M6)

**Ziel:** Automatisierte Tests im echten Browser für die Hauptflüsse, automatisierte Erfassung der
Goldens aus dem Altsystem und ein Paritätstest, der dieselbe DOM-Semantik in alter und neuer App
vergleicht. Ein Sichtvergleichsbericht unterstützt die menschliche Abnahme (G5).

> Kompakte Karten; vor Beginn zu Einzeldateien verfeinern (S00, wie P08).

## S00 – Phase verfeinern (S)

## S01 – Paket `e2e` mit Playwright (S)
- `e2e/package.json` (`@qualivis/e2e`, privat, `devDependencies: { "@playwright/test": "catalog:" }`),
  in `pnpm-workspace.yaml` die Zeile `- e2e` aktivieren und `@playwright/test` im Catalog eintragen.
  Vor der Installation dem Nutzer Paket, Version und Zweck nennen und die Zustimmung abwarten.
- `playwright.config.ts`: Viewport 1280 × 800,
  `webServer: { command: 'pnpm --filter @qualivis/web preview', url: 'http://127.0.0.1:4173' }`,
  zweites `webServer` für `pnpm legacy:serve` (Port 4300) nur für Paritäts-Projekte.
- Root-Skript `e2e`: `pnpm --filter @qualivis/e2e exec playwright test`.

## S02 – Automatisierte Legacy-Erfassung (M)
- `e2e/capture/capture-legacy.spec.ts` (eigenes Projekt `capture`, nicht im normalen Lauf): öffnet den
  Legacy-Build, setzt den Ausgangszustand (`tools/legacy/README.md`, Schritt 2), lädt `tools/legacy/capture.browser.js` per
  `page.addScriptTag`, ruft `qvCapture(fixture)` für alle Fixtures auf.
- Ergebnis muss **identisch** zu den manuell erfassten Goldens sein (`git diff testdata/golden` leer);
  sonst Ursache klären, nicht überschreiben.

## S03 – Paritätstest DOM-Semantik (M)
- Die neue App bekommt dieselbe Ladefunktion: `e2e/support/loadFixture.ts` erzeugt einen synthetischen
  Drop (wie `capture.browser.js`) bzw. nutzt `setInputFiles` auf dem versteckten Input (Ordner-Upload).
- Ein Extraktor liest aus der **neuen** App dieselbe Struktur wie `snapshot()` in `tools/legacy/capture.browser.js` – über
  `data-*`-Attribute statt `__data__` (z. B. `data-node-id`, `data-width`, `data-warn`), die `GraphNode`
  **nur** setzt, wenn `import.meta.env.MODE !== 'production'` oder ein Testflag aktiv ist.
- Vergleich mit `legacy-dom-*.json` nach den G2-Regeln (Positionen ausgenommen); Panels nach G4.

## S04 – Nutzerflüsse (M)
- Upload über Ordnerauswahl → Graph → Knotenklick → Panels gefüllt → Doppelklick → KV → Browser-Zurück
  → AV → Einstellungen ändern → Neuladen → Einstellungen und Analyse sind wiederhergestellt; Deep-Link.
- Drop auf Graph-Seite; Vollbild; Zoom-Buttons; Suche im Quelltext (Strg+F).

## S05 – Sichtvergleich G5 (S)
- `e2e/visual/compare.spec.ts`: Screenshots von Alt und Neu für definierte Zustände (Upload, AV `mini`,
  KV `App`, Einstellungsdialog, Panel mit Icons) bei 1280 × 800, abgelegt unter `.cache/visual/`, plus
  `report.html` mit Bildern nebeneinander. Kein Pixel-Vergleich (Layout darf abweichen).
- Nutzer prüft den Bericht; Abweichungen werden Aufgaben oder als akzeptiert dokumentiert.
