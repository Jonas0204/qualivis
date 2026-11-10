# P05.5 – Monorepo-Unterstützung (eingeschoben, ADR-019)

**Ziel:** Aus einem Monorepo lässt sich eine einzelne App analysieren, auch wenn sie Komponenten
einer Bibliothek aus demselben Repo nutzt. Der Nutzer zieht den Monorepo-Ordner hinein und wählt den
App-Ordner. Der Graph zeigt dann die Komponenten der App und die Bibliothekskomponenten, die sie
direkt oder indirekt nutzt, samt Kanten. Unbenutzte Bibliothekskomponenten und Testdateien fehlen.

Die Phase liegt zwischen P05 und P06 und hat keinen eigenen Meilenstein; sie endet mit der Abnahme
am echten Monorepo des Nutzers (S08). Branch `rewrite/p05.5-monorepo`, Beginn nach dem Merge von P05.

**Grundidee (ADR-019):** Eine neue Vorstufe `packages/core/src/workspace/` vor dem unveränderten
Kern (R5):
1. Pakete (`package.json`) und Pfad-Aliase (`tsconfig.json`/`jsconfig.json`) aus dem Upload lesen.
2. Import-Angaben auflösen: relativ, über `paths` der tsconfig, über den Paketnamen.
3. Vom App-Ordner aus alle erreichbaren Dateien sammeln, ohne Tests.
4. In diesen Dateien jede auflösbare Import-Angabe durch einen relativen Pfad **mit Dateiendung**
   ersetzen (gleiche Zeile). Das versteht der alte Kern, und die Endung umgeht K12.
5. Mit dem alten Kern analysieren und den Originalcode wieder ins Ergebnis setzen.

Ohne Auswahl („Whole project“) und bei Uploads mit nur einem Paket läuft alles wie bisher; G1/G2
bleiben unberührt.

| Schritt | Titel | Umfang |
|---|---|---|
| [S01](S01-testprojekt.md) | Testprojekt `monorepo` | S |
| [S02](S02-upload-konfiguration.md) | Upload: Konfigurationsdateien lesen, ausgeschlossene Ordner überspringen | S |
| [S03](S03-pakete-tsconfig.md) | Kern: Pakete und tsconfig-Pfade lesen | M |
| [S04](S04-importe-aufloesen.md) | Kern: Import-Angaben auflösen | M |
| [S05](S05-erreichbare-dateien.md) | Kern: erreichbare Dateien auswählen | M |
| [S06](S06-umschreiben-analysieren.md) | Kern: Importe umschreiben und analysieren | M |
| [S07](S07-app-auswahl.md) | Upload: App-Ordner wählen | M |
| [S08](S08-abnahme.md) | Abnahme am echten Monorepo | S |

Referenz: ADR-019, Analyse-Kern §1 (Pipeline), K4 und K12, Architektur §2–§4. Die Struktur des
Ziel-Monorepos stammt aus einem anonymisierten Strukturbericht des Nutzers (09.11.2026): pnpm-
Workspaces mit mehreren Apps und gemeinsamen Paketen; die App importiert die Bibliothek fast nur
über tiefe Unterpfade (`@scope/pkg/components/…`), die `paths` der App-tsconfig und ein Vite-Alias
auf `src` abbilden; die Bibliothek hat keine Einstiegsfelder in der `package.json` und keine
`index`-Sammeldateien; TypeScript, ESM, Tests in `__tests__/`; die Bibliothek hat mehrere hundert
Quelldateien.
