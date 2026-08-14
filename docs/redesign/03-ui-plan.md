# UI-Reskin Plan (Phase 1, UI zuerst)

Ziel: Twentys Erscheinungsbild + Informationsarchitektur an Pipedrive angleichen, **bevor** neue Features gebaut werden — damit diese direkt ins richtige visuelle System passen.

## Twentys aktuelles System (echte Dateien)

- **Styling**: Linaria (zero-runtime CSS-in-JS), styled-components-Pattern.
- **Theme-Tokens**: `packages/twenty-ui/src/theme/constants/*` — je Light/Dark:
  - `AccentLight.ts` / `AccentDark.ts` — **Primary/Accent** (aktuell **blau**: `primary: COLOR_LIGHT.blue5`, accent* = Radix `indigoP3`).
  - `BackgroundLight/Dark`, `BorderLight/Dark`, `MainColorsLight` (Palette inkl. `green: greenP3.green9`), `SecondaryColorsLight`, `GrayScaleLight/Dark`, `FontLight/Dark`, `Text.ts`.
- **Konsum**: `themeCssVariables` (`packages/twenty-ui/src/theme-constants/themeCssVariables.ts`) + `useTheme()`. Komponenten lesen `themeCssVariables.accent.*` / `.background.*` / `.font.*` etc.
- **Folge**: Accent zentral in 2 Dateien (`AccentLight/Dark`) ändern → **ganze App folgt** (alle CTAs/Links/Highlights).

## Visuelle Richtung (Pipedrive)

| Aspekt | Pipedrive | Twenty heute | Änderung |
|---|---|---|---|
| Primary/Accent | **Grün** (CTA, Highlights) | Blau/Indigo | Accent-Token blau → grün (Palette hat `green` schon) |
| Canvas | hell, weiß | eher dunkel/minimal | Light als Default-Referenz; Dark parallel pflegen |
| Linke Nav | navy Icon-Rail + ausklappbar | Icon-Rail vorhanden | Rail-Farbe/Dichte an Pipedrive |
| Datendichte | dicht (Tabellen/Cards) | luftiger | Row-Höhe/Padding reduzieren, dichtere Cards |
| Status | Status-Pills, Progress-Bars, Warn-Icons | teils vorhanden | Pill-/Progress-/Badge-Komponenten standardisieren |
| Primary-CTA | grüner Button überall | vorhanden | Button-Variante „primary" = grün |

## Phasen (klein, testbar, additiv)

**Phase 1a — Token-Reskin (risikoarm, rein Theme)**
- Accent-Tokens blau → grün in `AccentLight.ts` + `AccentDark.ts` (Radix `greenP3` statt `indigoP3`; `primary/secondary/tertiary/quaternary` auf green-Stufen).
- Prüfen: Kontrast/A11y, Dark-Variante, Storybook.
- Ergebnis: gesamte App in Pipedrive-Grün ohne Komponenten-Rewrite.

**Phase 1b — Kern-Komponenten polieren**
- **Button**: primary=grün, klare Hierarchie (primary/secondary/tertiary).
- **StatusPill / Tag**: einheitliche farbige Pills (Won/Lost/Cold/Open …).
- **ProgressBar**: neue Komponente (Stage-Progress, days-in-stage) — noch ohne Sales-Logik, nur UI.
- **Card**: dichtere Record-/Deal-Card (Titel, Sub, Wert, Meta, Warn-Slot).
- **DataTable-Row**: kompaktere Zeilenhöhe/Spacing (Pipedrive-Dichte).

**Phase 1c — Shell / IA**
- Linke Icon-Rail an Pipedrive angleichen (Farbe, Gruppierung, Dichte).
- Top-Bar: globale Suche + Quick-Add + AI-Chat-Trigger konsistent.
- Record-Detail-Layout: Summary-Sidebar + zentrale Tabs + History als wiederverwendbares Muster (Basis für spätere Deal-Detail-Features).

**Phase 1d — Board/Kanban-Politur**
- Record-Board optisch an Pipedrive-Pipeline: Stage-Header mit Aggregat-Slot (Count/Summe), dichtere Cards, Warn-Slot.
- Noch **ohne** Sales-Semantik (rotting/won-lost kommen in Phase 2) — nur die UI-Hülle, damit die Features andocken.

## Nicht-Ziele in Phase 1
- Keine neue Sales-Logik (rotting, won/lost, probability, scoring) — das ist Phase 2 ([04-feature-roadmap.md](04-feature-roadmap.md)).
- Keine Enterprise-Dateien (`/* @license Enterprise */`) anfassen.
- Dark-Theme nicht brechen — jede Token-Änderung Light **und** Dark.

## Vorgehen
- Pro Phase eigener Branch, subagent-driven (wie bei den Deploy-Config-Slices): plan → implementer + review je Task → final review → merge.
- Phase 1a zuerst als kleinster risikoarmer Schritt (Token-Swap), sofort sichtbar, leicht zu bewerten/zurückzudrehen.
- Vor Phase 1b: kurze `brainstorming`-Runde zur genauen Komponenten-Politur (Radien, Dichte, Pill-Farbsystem), damit die Richtung sitzt.
