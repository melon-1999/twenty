# Pipedrive-Referenz Redesign — Übersicht

Ziel: Twenty-UI komplett umgestalten, **Pipedrive als Vorbild**, und die fehlenden Sales-Funktionen darauf aufbauen.

Entscheidung (Reihenfolge): **UI zuerst**. Erst das visuelle System + die Pipeline-orientierte Informationsarchitektur an Pipedrive angleichen, dann die neuen Features (Pipeline-Semantik, Insights, Activities, Leads/Inbox, Sequences, Deal-Ökonomie) auf dieser Basis korrekt bauen.

## Dokumente

| Datei | Inhalt |
|---|---|
| [01-pipedrive-reference.md](01-pipedrive-reference.md) | Pipedrive Feature-Map, Surface für Surface, mit Mobbin-Screens |
| [02-gap-analysis.md](02-gap-analysis.md) | Pipedrive vs Twenty: hat / teilweise / fehlt (docs-informiert), Prioritäten |
| [03-ui-plan.md](03-ui-plan.md) | Visuelle Richtung + Twentys Theme-System (echte Dateien) + phased UI-Plan |
| [04-feature-roadmap.md](04-feature-roadmap.md) | Features nach dem UI-Reskin, Core-vs-App-Aufteilung |

## Kern-Erkenntnis

Twenty hat die **Engine** schon (Workflows, AI-Agents, Apps/Logic-Functions, Email-Send, Permissions, Metadaten-getriebene Objekte). Die Lücke zu Pipedrive ist v.a. **sales-native UX + Pipeline-Semantik**, nicht rohe Fähigkeit. Deshalb:

- **Visual reskin** = zentral über Theme-Tokens (Accent blau → grün) + Komponenten-Politur, rein Frontend, additiv, risikoarm.
- **Sales-Features** = teils Core-FE + Metadaten (Pipeline/Won-Lost/Insights/Activities), teils als App/Skill (Enrichment/Scoring/Sequences via Logic-Functions + AI-Agents).

## Status

- [x] Pipedrive-Referenz gesammelt (Mobbin)
- [x] Gap-Analyse (docs.twenty.com abgeglichen)
- [x] UI-Plan skizziert
- [x] Feature-Roadmap skizziert
- [ ] UI-Reskin umsetzen (Phase 1)
- [ ] Sales-Features (Phase 2+)

Quelle Screens: Mobbin (Pipedrive, web). Quelle Twenty-Fähigkeiten: docs.twenty.com + Code.
