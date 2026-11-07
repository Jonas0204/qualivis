# Stil-Referenz (gemessen am Legacy-Build)

Alle Werte stammen aus dem kompilierten gh-pages-Build (CSS-Strings im Bundle und `styles.css`)
bzw. aus `getComputedStyle` im laufenden Build (Fenster 1024 × 768). Sie sind die Vorgabe für
`apps/web/src/styles/tokens.css`. Bei Zweifel: Legacy-Build lokal starten (P02-S01) und messen.

## 1. Farben (Design-Tokens)

### Grundfarben (aus `styles/variables.scss`, kompiliert)
| Token | Wert | Verwendung |
|---|---|---|
| `--qv-background` | `#fafafa` | Graph-Hintergrund, App-Hintergrund |
| `--qv-surface` | `#ffffff` | Panels (Split-Bereiche), Upload-Karte |
| `--qv-text` | `rgba(0,0,0,.87)` | Standardtext |
| `--qv-text-light-grey` | `#989898` | (Score, ungenutzt) |
| `--qv-selected` | `rgba(0,0,0,.08)` | ausgewählte Datei |
| `--qv-selected-hover` | `rgba(0,0,0,.12)` | ausgewählte Datei bei Hover |
| `--qv-file-tree-icon` | `rgba(0,0,0,.65)` | Icons im Dateibaum |
| `--qv-graph-button` | `#808080` (grey) | Buttons/Select über dem Graph |
| `--qv-metric-border` | `#bdbdbd` | Rahmen Metrik-Balken |
| `--qv-warn` | `#f2a60d` | Warn-Icons, Warn-Rand |
| `--qv-error` | `#f20d0d` | Fehler-Icons, Fehler-Rand |
| `--qv-success-muted` | `#b4f0a8` | Balken grün |
| `--qv-warn-muted` | `#f0d8a8` | Balken gelb |
| `--qv-error-muted` | `#f0a8a8` | Balken rot |
| `--qv-gutter` | `#eeeeee` | Split-Trenner |
| `--qv-cluster-button-on` | `#e6e6e6` | „Toggle cluster“ aktiv |

### Graph (kompilierte `color.scale`-Werte)
| Element | Komponente | Innere Funktion | React-Spezialfunktion |
|---|---|---|---|
| Rand (`circle-overlay`, `inner-circle`, `function`, Schraffur) | `#28bd8c` | `#7881e2` | `#2daed2` |
| Füllung `circle-node` | `#c5f3e4` | `#dde0f8` | `#caebf4` |
| Füllung `circle-node.selected` | `#8be6c8` | `#bcc0f1` | `#96d7e9` |
| Füllung Vorschaukreis `function` | `#baf0de` | `#d7d9f6` | `#c0e7f2` |
| Füllung Vorschaukreis `function.jsx` | `#3ad5a2` | `#8d94e7` | `#4cbbd9` |

Kanten `#999` mit Deckkraft 0.6; Pfeil `#999`. Indirekt verbundene Knoten beim Ausblenden: `#fafafa`.

### Material-Theme „deeppurple-amber“ (nur benötigte Teile)
| Token | Wert | Verwendung |
|---|---|---|
| `--qv-primary` | `#673ab7` | Toolbar, Fortschrittsbalken, „Save“-Button |
| `--qv-primary-light` | `#d1c4e9` | Puffer des Fortschrittsbalkens |
| `--qv-on-primary` | `#ffffff` | Text auf Primärfarbe |
| `--qv-accent` | `#ffd740` | Schalter an (Daumen), Snackbar-Aktion |
| `--qv-accent-track` | `rgba(255,215,64,.54)` | Schalter an (Bahn) |
| `--qv-toggle-thumb-off` | `#fafafa` | Schalter aus (Daumen) |
| `--qv-toggle-track-off` | `rgba(0,0,0,.38)` | Schalter aus (Bahn) |
| `--qv-snackbar-bg` | `#323232` | Snackbar |
| `--qv-snackbar-text` | `hsla(0,0%,100%,.7)` | Snackbar-Text |
| `--qv-tooltip-bg` | `rgba(97,97,97,.9)` | Tooltip (Schrift 10 px, weiß) |
| `--qv-dialog-shadow` | `0 11px 15px -7px rgba(0,0,0,.2), 0 24px 38px 3px rgba(0,0,0,.14), 0 9px 46px 8px rgba(0,0,0,.12)` | Dialog |
| `--qv-snackbar-shadow` | `0 3px 5px -1px rgba(0,0,0,.2), 0 6px 10px 0 rgba(0,0,0,.14), 0 1px 18px 0 rgba(0,0,0,.12)` | Snackbar |
| `--qv-option-hover` | `rgba(0,0,0,.04)` | Auswahl-Optionen Hover |
| `--qv-option-selected` | `rgba(0,0,0,.12)` | gewählte Option |

Clusterfarben (`constants/cluster-colors.ts`): `#8321d9 #6ad921 #d92121 #1d5ebf #bf731d #158c35
#734511 #381173 #731111 #5f7311 #731152 #d9bf57 #d957bf #bf6b4d #bf4d6b #abd98d #977cbf #5b828c
#734b65 #4b5573`, ab Index 20 `white`.

## 2. Typografie

- Schrift **Roboto** (300, 400, 500), Fallback `"Helvetica Neue", sans-serif`; Icons **Material
  Icons** (Ligaturen). Beide werden **lokal** ausgeliefert (`@fontsource/roboto`,
  `@fontsource/material-icons`), nicht vom Google-CDN (ADR-009).
- `body`: `margin 0`, `font-family Roboto, "Helvetica Neue", sans-serif`, `box-sizing border-box` vererbt.
- Toolbar-Titel: 500 20px/32px, weiß, ohne Unterstreichung; Fokus sichtbar: unterstrichen.
- Panel-Überschrift „Code Quality“: 500 16px/28px, Rand unten 16 px; Name daneben 400 15px/24px.
- Metrik-Zeile: Name/Wert 13 px, Wert Gewicht 500 und `rgba(0,0,0,.87)`.
- Icon-Beschreibung: Icon 20 px, Text 14 px, Abstand oben 12 px, Icon rechts 8 px.
- Dateibaum: 13 px, Icon 20 px mit 4 px Innenabstand.
- Graph-Label 14 px; Icons im Graph 14 px; Legende Überschrift 16 px, Einträge 12 px/300.
- Buttons über dem Graph: 500 14px, Höhe 40 px; Select-Wert 16 px, Breite 180 px.
- Dialog-Titel 500 20px/32px.

## 3. Maße und Abstände

| Element | Wert |
|---|---|
| Toolbar | Höhe 64 px (≤ 599 px Breite: 56 px), Innenabstand `0 16px`, `position: sticky`, `z-index 1` |
| Zahnrad-Button | 40 × 40 px, rund |
| Split | links 275 px, rechts 575 px, Mitte Rest; rechts vertikal oben 363 px; Trenner 8 px |
| Aktionsleisten über Graph | `position:absolute; top:8px; left/right:8px`; Elemente 40 px hoch; Cluster-Button `margin-right 16px` |
| Code-Quality-Panel | Innenabstand 8 px; Metrikzeilen 24 px hoch, Abstand 8 px, Innenabstand `0 8px` |
| Metrik-Balken | absolut über die ganze Zeile, Rand 1 px `#bdbdbd`, Puffer weiß |
| Icon-Beschreibungen | Abstand oben 16 px |
| Upload-Karte | max. 640 × 400 px, Rand 2 px gestrichelt `#bdbdbd`, Radius 16 px, Text `#616161`; Hover/Drag: Rand `#9e9e9e`, Text `#424242`, `scale(1.05)`, Übergang 150 ms; Icon 104 px; Text 20 px, Abstand 24 px |
| Drop-Overlay (Graph-Ansicht) | `rgba(0,0,0,.55)`, „Drop files here“, 32 px weiß, zentriert, `z-index 999` |
| Fortschrittsbalken | oben, volle Breite, `z-index 3`, Höhe 4 px (Material) |
| Dialog | Breite 480 px, Radius 4 px, Innenabstand 24 px; Schalterzeile 40 px hoch, Label links/Schalter rechts; Aktionen rechtsbündig |
| Schalter | Bahn 36 × 14 px, Radius 8 px; Daumen 20 × 20 px, Schatten wie Material |
| Snackbar | unten zentriert, Radius 4 px, Innenabstand `14px 16px`, min. Breite 344 px, max. 568 px; Aktion fett 500 |
| Legende | 196 px breit (siehe `03-visuelle-regeln.md` §15) |

## 4. Quelltext-Theme „neo“ (aus `src/assets/neo.css`)

```
Hintergrund #ffffff, Text #2e383c, Zeilenhöhe 1.4375
Kommentar #75787b · Keyword/Property #1d75b3 · Atom/Number #75438a
Tag/Node #9c3328 · String #b35e14 · Variable/Qualifier #047d65
Gutter: kein Rand, 10 px transparenter Abstand rechts, Hintergrund transparent
Zeilennummer #e0e2e5 (sehr hell!), Innenabstand 0 · Cursor #676767
```
CodeMirror-6-Umsetzung: `EditorView.theme(...)` + `HighlightStyle.define(...)` mit diesen Farben
(P06-S05). Schrift: Monospace-Standard des Browsers (wie CodeMirror 5), Höhe 100 % des Panels.

## 5. Verwendete Material-Icon-Namen

`settings`, `note_add`, `folder`, `code`, `arrow_back`, `all_out`, `fullscreen`,
`fullscreen_exit`, `warning`, `delete`, `content_cut`, `device_hub`, `report`,
sowie Pfeil der Auswahlbox (Dreieck, CSS).

## 6. Responsives Verhalten

Nur zwei Regeln im Altsystem: Upload-Karte ohne Max-Größe und ohne Skalierung bei ≤ 599 px; Toolbar
56 px bei ≤ 599 px. Sonst ist die App auf Desktop ausgelegt (feste Pixel-Splits). Die neue App
übernimmt das; eine mobile Optimierung ist kein Ziel (siehe `00-grundlagen/01-ziele-und-scope.md`).
