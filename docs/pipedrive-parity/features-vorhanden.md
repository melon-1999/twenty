# Vorhandene Features (Pipedrive-Vergleich)

Stand: 2026-08-26. Dieser Fork von Twenty CRM ist als deutschsprachige, selbstgehostete
Pipedrive-Alternative aufgebaut. Dieses Dokument beschreibt, was heute funktioniert — sowohl
die selbst gebauten Vertriebs-Features als auch die von Twenty mitgebrachte Basis.

## Pipeline-Kern (selbst gebaut)

Das ist die Schicht, die aus dem generischen CRM eine echte Vertriebs-Pipeline im Pipedrive-Stil macht.

### Won / Lost Lifecycle
Jede Opportunity hat einen Status: **Offen**, **Gewonnen** oder **Verloren**, plus ein
Abschlussdatum (`closedAt`). Im Kopfbereich der Opportunity zeigt eine farbige Statusplakette
den aktuellen Zustand. Aus einem offenen Deal führen zwei Aktionen heraus — "Als gewonnen
markieren" (grün) und "Als verloren markieren" (rot); ein geschlossener Deal lässt sich per
"Wieder öffnen" zurück in den offenen Zustand holen. Der jeweilige Übergang setzt Status und
Abschlussdatum in einem Schritt. Bestehende Deals wurden per Upgrade-Kommando (Version 2.31)
rückwirkend mit Status "Offen" befüllt.

### Verlustgrund (lostReason)
Beim Markieren als verloren öffnet sich ein Dropdown mit sechs Gründen — Zu teuer,
Konkurrenz, Kein Budget, Timing, Keine Entscheidung, Sonstiges — plus einer Option "Ohne
Grund". Die Auswahl setzt Status, Abschlussdatum und Verlustgrund gemeinsam. Der Grund
erscheint als deutsches Label im Kopfbereich des verlorenen Deals und lässt sich als Feld in
Tabellen- und Board-Ansichten einblenden. Intern sind die Werte englisch gespeichert
(`LOST_TO_COMPETITOR` etc.), angezeigt wird deutsch — so bleiben spätere Auswertungen stabil.
Wieder-Öffnen und Gewinnen setzen den Grund automatisch zurück. Ausgerollt per Kommando 2.35.

### Deal-Aging / Rotting (faule Deals)
Deals, die zu lange in derselben Phase liegen, werden als "faul" markiert. Pro Phase lässt
sich in den Einstellungen eine Schwelle in Tagen festlegen (z. B. Neu 7 Tage, Angebot 21
Tage). Ein Zeitstempel `stageChangedAt` hält fest, wann der Deal zuletzt die Phase gewechselt
hat; ein Server-Prozess aktualisiert ihn bei jedem Phasenwechsel. Überschreitet ein offener
Deal die Schwelle seiner aktuellen Phase, zeigt die Detailseite eine rote Plakette
("N Tage in Phase"), und in Tabelle wie Board erscheint ein rotes Uhr-Symbol auf der Zeile
bzw. Karte. Geschlossene Deals verrotten nie. Ausgerollt per Kommando 2.32.

### Wahrscheinlichkeit + gewichteter Wert
Jeder Deal trägt eine Gewinnwahrscheinlichkeit in Prozent. Pro Phase gibt es einen
Standardwert (Einstellungen, z. B. Neu 20 %, Angebot 80 %), den ein neuer Deal erbt und der
sich pro Deal überschreiben lässt. Zieht ein unveränderter Deal in eine neue Phase, wird die
Wahrscheinlichkeit auf den neuen Phasen-Standard zurückgesetzt; ein manuell gesetzter Wert
bleibt erhalten. Aus Betrag und Wahrscheinlichkeit ergibt sich der gewichtete Wert
(`amount x probability / 100`), der auf der Detailseite ("Gewichtet: 8.000 € (80 %)") und als
Prozent-Badge auf der Board-Karte erscheint; das gespeicherte gewichtete Feld erlaubt zudem
eine gewichtete Spaltensumme im Board. Ausgerollt per Kommando 2.34.

### Forecast-Ansicht
Eine eigene Seite unter `/opportunities/forecast` (Nav-Link "Prognose") gruppiert alle
offenen Deals nach erwartetem Abschlussmonat. Pro Monat zeigt sie die Anzahl der Deals, die
ungewichtete Summe (Betrag) und die gewichtete Summe (Betrag × Wahrscheinlichkeit), plus eine
Gesamtzeile. Die Monatsnamen erscheinen deutsch ("Januar 2026"). Der gewichtete Wert wird
dabei direkt aus Betrag und Wahrscheinlichkeit berechnet, ist also unabhängig von
Hintergrund-Prozessen immer aktuell.

## Basis-CRM (aus Twenty)

Diese Funktionen bringt Twenty mit und sie sind auf Deutsch nutzbar:

- **Kontakte und Organisationen** — Personen und Unternehmen mit Verknüpfungen zu Deals.
- **Aktivitäten, Aufgaben und Zeitleiste** — Notizen, Tasks und eine chronologische
  Aktivitätshistorie an jedem Datensatz.
- **E-Mail-Sync und Kalender** — Anbindung an Postfach und Kalender (per Konfiguration
  freischaltbar).
- **Workflow-Automation** — regelbasierte Automatisierungen, und zwar auf beliebigen Objekten,
  nicht nur auf Deals (per Konfiguration freischaltbar).
- **Reports / Dashboards** — Auswertungs- und Dashboard-Bausteine (per Konfiguration
  freischaltbar).
- **Custom Fields und Rollen/Rechte** — eigene Felder und ein Berechtigungssystem.

## Plattform-Vorteile gegenüber Pipedrive

Diese Punkte hat der Fork, die Pipedrive so nicht bietet:

- **Open Source und selbstgehostet** — volle Datenhoheit, kein Abo-Zwang, kein Vendor-Lock-in.
- **Custom Objects** — beliebige Objekttypen statt eines festen Deals/Kontakte-Schemas;
  Kanban-Board und Automatisierung funktionieren auf jedem Objekt.
- **Metadata-getriebene GraphQL-API** — flexibler als Pipedrives festes REST-Schema.
- **Rich-Text-Notizen mit Zeitleiste** an jedem Objekt.

## Sprache

Die Instanz läuft auf Deutsch (Locale de-DE). Oberflächen-Texte kommen aus dem Lingui-Katalog,
Standard-Feldbezeichnungen werden serverseitig übersetzt (z. B. "Lost reason" → "Verlustgrund").
Bei Auswahlfeldern für den Vertriebs-Kern sind die deutschen Anzeige-Labels direkt hinterlegt,
während die intern gespeicherten Werte englisch bleiben, damit die Feature-Logik stabil ist.
