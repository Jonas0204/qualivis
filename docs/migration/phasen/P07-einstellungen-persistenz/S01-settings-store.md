# P07-S01 – Einstellungen als persistiertes Jotai-Atom

Meilenstein M4 · Abhängig von: M3 · Umfang S

## Ziel
Einstellungen liegen in einem Atom, starten mit den Altsystem-Standardwerten, werden unter
`qualivis.settings` gespeichert und beim Start validiert wiederhergestellt.

## Kontext
- Funktionsinventar §7; Altcode `services/settings.service.ts`; ADR-010, ADR-013; Architektur §5, §8

## Dateien
`apps/web/src/lib/storage.ts` (+ Test), `apps/web/src/state/settingsAtoms.ts` (+ Test),
`apps/web/src/test/setup.ts`; alle Stellen, die bisher `defaultSettings` oder das vorläufige
Vollbild-Atom direkt nutzen.

## Schritte
1. `storage.ts`: `readJson<T>(key, validate)`, `writeJson(key, value): boolean`, `remove(key)` – alle
   mit `try/catch` (Privatmodus, Quota, defektes JSON). Schlüsselpräfix `qualivis.`. `writeJson` gibt
   bei Fehler `false` zurück (Aufrufer meldet einmalig, S05).
2. `settingsAtoms.ts`:
   - `validateSettings(value: unknown): Settings` – übernimmt aus einem Objekt nur bekannte Schlüssel
     mit `boolean`-Wert und ergänzt fehlende aus `defaultSettings` (Altsystem führt ebenfalls
     `{ ...defaultSettings, ...gespeichert }` zusammen, `settings.service.ts:25-32`).
   - Storage-Objekt für Jotai auf Basis von `lib/storage.ts`: `getItem(key, initial)` →
     `validateSettings(readJson(key) ?? initial)`, `setItem` → `writeJson`, `removeItem` → `remove`.
   - `settingsAtom = atomWithStorage('qualivis.settings', defaultSettings, settingsStorage, { getOnInit: true })`
     (aus `jotai/utils`; `getOnInit`, damit der gespeicherte Wert schon beim ersten Render gilt –
     Option in der Doku der installierten Jotai-Version prüfen).
   - Schreib-Atom `updateSettingsAtom` (Teilwerte zusammenführen, wie `settings.service.ts:34-38`).
3. Alle Verwender (`GraphView`, `GraphActions`, Vollbild) auf `settingsAtom` umstellen; das vorläufige
   Vollbild-Atom aus P05-S11 entfällt (`settings.fullScreen`).
4. `apps/web/src/test/setup.ts`: im vorhandenen `afterEach` zusätzlich `localStorage.clear()`
   (`atomWithStorage` schreibt auch beim Hydrieren durch den `TestProvider`, Teststrategie §2,
   Regel 5).
5. Tests: Standardwerte ohne Speicher; Zusammenführung mit gespeicherten Teilwerten; ungültige Werte
   (String statt Boolean, unbekannter Schlüssel, kaputtes JSON) werden ignoriert; Änderung wird
   gespeichert; `localStorage` wirft → kein Absturz. Komponenten mit Einstellungen starten im Test
   mit `initial(settingsAtom, { ...defaultSettings, … })` statt mit vorbefülltem `localStorage`.

## Akzeptanzkriterien
- [ ] Einstellung „Vollbild“ überlebt ein Neuladen.
- [ ] Tests grün; `pnpm check` grün.

## Commit-Vorschlag
`feat(web): add persisted settings atom`
