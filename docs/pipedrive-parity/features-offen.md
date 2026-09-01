# Offene Features (Pipedrive-Vergleich)

Stand: 2026-08-26. Dieses Dokument beschreibt, was Pipedrive bietet und in diesem Fork noch
fehlt — sortiert grob nach Aufwand. Jeder Punkt nennt, was das Feature tut, warum es nützlich
ist und wie groß der Bau ungefähr wäre.

## Kleine Ergänzungen

### Board-Drag Won/Lost
**Was:** Eine Opportunity-Karte per Drag-and-drop in eine "Gewonnen"- oder "Verloren"-Zone am
Rand des Boards ziehen, statt den Status über die Kopf-Buttons zu setzen.
**Nutzen:** Schnellerer, intuitiver Abschluss direkt im Kanban — Pipedrive-typische Geste.
**Aufwand:** Klein. Status/Won/Lost existieren bereits; nur die Board-Drag-Interaktion und die
Zonen fehlen. Für "Verloren" idealerweise mit dem bestehenden Verlustgrund-Dropdown gekoppelt.

### Verlustgrund-Report
**Was:** Eine Auswertung, die zeigt, aus welchen Gründen Deals verloren gehen — Anzahl und
Wert je Grund, optional über Zeit.
**Nutzen:** Macht den bereits erfassten Verlustgrund analytisch nutzbar (welche Gründe kosten
am meisten Umsatz).
**Aufwand:** Klein bis mittel. Das Feld `lostReason` existiert; es braucht eine
Aggregations-Seite ähnlich der Forecast-Ansicht.

## Mittlere Features

### Days-in-Stage / Phasen-Konversion-Analytics
**Was:** Kennzahlen zur Pipeline-Geschwindigkeit — durchschnittliche Verweildauer je Phase,
Konversionsraten zwischen den Phasen, Trichter-Darstellung.
**Nutzen:** Zeigt Engpässe im Vertriebsprozess (wo bleiben Deals hängen, wo brechen sie ab).
**Aufwand:** Mittel. Der Zeitstempel `stageChangedAt` wird bereits gepflegt und ist die
Grundlage; es fehlt die Historie der Phasenwechsel und die Auswertungs-Seite. Passt als
Analytics-Schicht neben Forecast und Verlustgrund-Report.

### Aktivitäts-Reminder und Benachrichtigungen
**Was:** Erinnerungen an fällige Aktivitäten/Aufgaben, Benachrichtigungen bei Ereignissen.
**Nutzen:** Verhindert, dass Deals liegen bleiben (in Pipedrive ein Kernbaustein der täglichen
Arbeit).
**Aufwand:** Mittel. Tasks existieren; es fehlen Fälligkeits-Trigger und ein
Benachrichtigungs-Kanal.

### Web-Forms / Lead-Capture
**Was:** Einbettbare Formulare, die eingehende Interessenten direkt als Lead/Kontakt anlegen.
**Nutzen:** Deals kommen automatisch in die Pipeline, statt manuell erfasst zu werden.
**Aufwand:** Mittel. Braucht ein öffentliches Formular-Frontend plus einen Ingest-Endpunkt.

### Goals / Verkaufsziele
**Was:** Ziele je Nutzer/Team/Zeitraum (z. B. Umsatz pro Quartal) mit Fortschrittsanzeige.
**Nutzen:** Verknüpft die Pipeline mit konkreten Zielvorgaben.
**Aufwand:** Mittel. Neues Ziel-Objekt plus Fortschritts-Berechnung gegen die Pipeline-Daten.

## Große / strukturelle Features

### Mehrere Pipelines
**Was:** Mehrere unabhängige Pipelines mit je eigenen Phasen und Wahrscheinlichkeiten (z. B.
"Neukunden" vs. "Bestandskunden").
**Nutzen:** Unterschiedliche Vertriebsprozesse sauber getrennt abbilden.
**Aufwand:** Groß und strukturell. Heute gibt es genau ein Phasen-Set; Phasen,
Rotting-Schwellen und Wahrscheinlichkeiten müssten pro Pipeline geführt werden — das berührt
Datenmodell, Board und die bestehenden Vertriebs-Features.

### Produkte + Line-Items am Deal
**Was:** Ein Produktkatalog und Positionen (Produkt, Menge, Preis) an jedem Deal; der
Deal-Wert ergibt sich aus der Summe der Positionen.
**Nutzen:** Präzise Deal-Werte und Umsatz-Auswertung nach Produkt.
**Aufwand:** Groß. Neues Produkt- und Positions-Objekt, Verknüpfung zum Deal, Summenlogik und
UI zum Bearbeiten der Positionen.

### Leads-Inbox (getrennt von Deals)
**Was:** Ein separater Eingang für unqualifizierte Leads, die erst nach Prüfung in echte Deals
umgewandelt werden (Pipedrive "LeadBooster").
**Nutzen:** Hält die Pipeline sauber; Leads verstopfen nicht das Board.
**Aufwand:** Groß. Neues Lead-Objekt mit eigenem Arbeitsbereich und einem
Konvertierungs-Ablauf zum Deal.

## Nicht relevant für einen self-hosted Fork

Einige Pipedrive-Bausteine ergeben hier wenig Sinn und stehen bewusst nicht auf der Liste:
integrierter Telefon-Caller, mobile Begleit-App als Produktbestandteil, sowie proprietäre
Cloud-Add-ons. Diese lassen sich bei Bedarf über die offene API anbinden.

## Empfohlene Reihenfolge

1. **Days-in-Stage-Analytics** oder **Verlustgrund-Report** — bauen die Analytics-Schicht neben
   Forecast aus und nutzen bereits vorhandene Daten (`stageChangedAt`, `lostReason`).
2. **Board-Drag Won/Lost** — schnelles UX-Win auf bestehender Won/Lost-Logik.
3. Danach die großen Struktur-Themen: **mehrere Pipelines**, **Produkte/Line-Items**,
   **Leads-Inbox** — je nach Priorität, jeweils als eigenes Sub-Projekt.
