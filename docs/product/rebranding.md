# Product Rebranding

Stand: 2026-09-12, Branch `product/rebrand` (Basis: upstream `twentyhq/twenty` main `b782836bca`, = Release `twenty/v2.40.0` + 5 Commits).

Prinzip: **Upstream-Kompatibilität > kosmetische Abstraktion.** So wenig Core-Diff wie möglich, so viel sichtbares Rebranding wie nötig. Interne technische Namen (`twenty-server`, `twenty-front`, Paketnamen, Imports, DB-Namen, Klassen) bleiben unverändert.

## Architektur

Twenty besitzt **keinen** eingebauten White-Label-/Branding-Mechanismus (verifiziert auf v2.40: keine `appName`/`brandName`/`whiteLabel`-Felder in ClientConfig, keine Appearance-Einstellungen außer Dark/Light). Deshalb eine minimale eigene Schicht:

### Zentrale Branding-Konfiguration

**`packages/twenty-shared/src/constants/ProductBranding.ts`** (neue Datei, kein Konfliktpotenzial)

Exportiert `PRODUCT_BRANDING` mit: `name`, `shortName`, `description`, `websiteUrl`, `supportUrl`, `sourceCodeUrl`, `legalTermsUrl`, `legalPrivacyUrl`, `legalDpaUrl`, `supportEmail`, `emailLogoUrl`, `defaultWorkspaceLogoUrl`, `legalEntityLine`, `legalEntityLocationLine`.

`twenty-shared` wird von `twenty-front`, `twenty-server` und `twenty-emails` konsumiert — eine Quelle für alle drei Oberflächen. Nach Änderung: `npx nx build twenty-shared` (regeneriert auch den Barrel-Export).

Aktuelle Werte sind **Platzhalter** (`YourCRM`, `example.com`) — bewusst kein finaler Produktname erfunden.

### Statische Dateien (können nicht aus TS lesen)

- `packages/twenty-front/index.html` — `<title>`, Meta/OpenGraph/Twitter-Tags (Platzhalter `YourCRM` direkt eingetragen)
- `packages/twenty-front/public/manifest.json` — PWA `name`/`short_name`

Diese zwei Dateien müssen beim finalen Naming von Hand angefasst werden.

### Assets

Kanonische Austauschstelle: **`packages/twenty-front/public/images/brand/logo.svg`** (aktuell neutraler geometrischer Platzhalter, kein gestaltetes Logo).

Generator: **`packages/twenty-front/scripts/generate-brand-assets.mjs`** — regeneriert aus `logo.svg`:

- alle PWA-/App-Icons in `public/images/icons/{android,ios,windows11}/` (~120 PNGs, Pfade unverändert, in-place ersetzt)
- `public/images/integrations/twenty-logo.svg` (In-App-Marke: Onboarding-Header, Splash-Loader, Import-Badge, OAuth-Consent — Dateiname bewusst beibehalten, damit kein Code-Diff entsteht)
- `public/images/brand/social-card.png` (og:image/twitter:image)

Workflow beim finalen Logo: `logo.svg` ersetzen → `node packages/twenty-front/scripts/generate-brand-assets.mjs` → committen.

### Farbe / Theme

**Bewusst nicht geändert** (kein Brand-Farbwert definiert). Mechanismus ist vorhanden und dokumentiert:

- `packages/twenty-ui/design-tokens/accent.ts` — alle Accent-Slots aliasen `COLOR_TOKENS.blueN`. Eine Brand-Farbe = diese ~18 Zeilen auf eine andere Hue-Rampe zeigen (oder eigene Rampe in `design-tokens/color/` ergänzen), dann `npx nx generateTokens twenty-ui`.
- Generierte Dateien (`packages/twenty-ui/src/theme/constants/*`) nie von Hand editieren.
- Duplikat beachten: `index.html` inlined Pre-Hydration-Hintergrundfarben (`#1b1b1b`/`#fcfcfc`).

### E-Mail-Absender

`EMAIL_FROM_NAME` (Default `'Felix from Twenty'` in `config-variables.ts`) wurde **nicht** im Code geändert — per `.env` setzen:

```text
EMAIL_FROM_NAME="YourCRM"
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
```

## Austauschbare Werte (Checkliste fürs finale Branding)

| Was | Wo |
|---|---|
| Produktname | `ProductBranding.ts` + `index.html` + `manifest.json` |
| Logo | `public/images/brand/logo.svg` + Script laufen lassen |
| Favicon/App-Icons | automatisch aus Logo (Script) |
| Social Card | automatisch aus Logo (Script) |
| E-Mail-Logo (extern gehostete URL) | `PRODUCT_BRANDING.emailLogoUrl` |
| Default-Workspace-Logo in E-Mails | `PRODUCT_BRANDING.defaultWorkspaceLogoUrl` |
| Website/Support/Source/Legal-URLs | `ProductBranding.ts` |
| Absendername E-Mails | `.env` `EMAIL_FROM_NAME` |
| Farben | `twenty-ui/design-tokens/accent.ts` + `generateTokens` |

## Geänderte Twenty-Core-Dateien (Upstream-Kompatibilität)

Konfliktrisiko: LOW = trivial (1–3 Zeilen, stabiler Code), MEDIUM = Datei ändert sich upstream öfter oder Diff ist größer.

### Neu (kein Konfliktrisiko)

- `packages/twenty-shared/src/constants/ProductBranding.ts`
- `packages/twenty-front/public/images/brand/logo.svg`, `social-card.png`
- `packages/twenty-front/scripts/generate-brand-assets.mjs`
- `docs/product/rebranding.md`

### Frontend

| Datei | Grund | Art | Risiko |
|---|---|---|---|
| `index.html` | Titel/Meta/OG | Textwerte ersetzt | LOW |
| `public/manifest.json` | PWA-Name | 2 Werte | LOW |
| `src/utils/title-utils.ts` | Tab-Titel-Fallback | 1 Zeile + Import | LOW |
| `src/pages/not-found/NotFound.tsx` | 404-Titel | 1 String | LOW |
| `.../navigation-drawer/constants/DefaultWorkspaceLogo.ts` | Fallback-Logo (Favicon, Workspace-Switcher) | URL → lokaler Pfad | LOW |
| `src/modules/auth/sign-in-up/components/FooterNote.tsx` | Legal-Links + Brandname Login | 5 hrefs + 1 String | MEDIUM |
| `src/pages/auth/SignInUp.tsx` | "Welcome to Twenty" | 1 String | MEDIUM |
| `src/pages/settings/community/SettingsCommunity.tsx` | Marketing-Links → eigene Ziele, Source-Code-Karte | Kartenliste | MEDIUM |
| `.../applications/utils/getStandardApplicationDescription.ts` | Produktname in App-Beschreibung | 4 Stellen | MEDIUM |
| `src/pages/settings/ai/components/SettingsAiModelsTab.tsx` | 2 Beschreibungen | 2 Strings | MEDIUM |
| `.../MatchColumnsStep/components/ColumnGrid.tsx` | "Twenty fields" | 1 String | LOW |
| `.../timeline-activities/utils/getTimelineActivityAuthorFullName.ts` | System-Autor | 1 Zeile | LOW |
| `.../mcp-and-apis/constants/McpSetup.ts` | Connector-Anzeigename | 1 Wert | LOW |
| `.../mcp-and-apis/utils/mcpSetup.ts` | Beschreibung | 1 String | LOW |
| `.../mcp-and-apis/utils/buildMcpSetupCategories.tsx` | 12 Client-Beschreibungen | Strings parametrisiert | MEDIUM |
| `public/images/icons/**`, `public/images/integrations/twenty-logo.svg` | Icon-Assets | binär, per Script regenerierbar | LOW (bei Konflikt: ours + Script) |
| `src/locales/**` | Kataloge | generiert (`lingui extract/compile`) | bei Konflikt neu generieren |

### E-Mails (`packages/twenty-emails`)

| Datei | Grund | Risiko |
|---|---|---|
| `src/components/Logo.tsx` | Logo-URL + alt | LOW |
| `src/components/Footer.tsx` | 4 Links + Legal-Zeile | MEDIUM |
| `src/components/BaseHead.tsx` | E-Mail-Titel | LOW |
| `src/components/WhatIsTwenty.tsx` | Copy parametrisiert | LOW |
| `src/constants/DefaultWorkspaceLogo.ts` | Fallback-Logo | LOW |
| `src/emails/send-invite-link.email.tsx` | Titel-String | LOW |
| `src/emails/send-email-verification-link.email.tsx` | 2 Copy-Strings | LOW |
| `src/emails/password-update-notify.email.tsx` | CTA-Label | LOW |
| `src/emails/clean-suspended-workspace.email.tsx` | Copy + CTA-href | LOW |
| `src/locales/**` | Kataloge | generiert, neu generieren |

### Server (`packages/twenty-server`)

| Datei | Grund | Risiko |
|---|---|---|
| `.../workspace-invitation/services/workspace-invitation.service.ts` | Betreff + "(via …)" | MEDIUM |
| `.../email-verification/services/email-verification.service.ts` | Betreff | MEDIUM |
| `.../approved-access-domain/services/approved-access-domain.service.ts` | "(via …)" | LOW |
| `.../two-factor-authentication/two-factor-authentication.service.ts` | TOTP-Issuer (Authenticator-App) | MEDIUM |
| `.../api/mcp/constants/mcp-server-info.const.ts` | MCP-Servername | LOW |
| `.../well-known/utils/build-mcp-server-card.util.ts` | öffentliche Server-Card | LOW |
| `.../open-api/utils/base-schema.utils.ts` | API-Titel, Kontakt, externalDocs (Lizenz-Links unverändert) | MEDIUM |
| `.../caldav/services/caldav-create-event.service.ts` | ICS prodId | LOW |
| `.../i18n/locales/**` | Kataloge | generiert, neu generieren |

Merge-Strategie bei Upstream-Updates: Kataloge und Icon-PNGs immer neu generieren statt mergen; die Code-Dateien sind jeweils 1–5-Zeilen-Diffs, die sich trivial neu anwenden lassen.

## Bewusst NICHT geändert

- **Docs-Links** (`docs.twenty.com`, `DOCUMENTATION_BASE_URL`): technische Doku, bleibt korrekt (Kategorie B).
- **Billing-UI-Toasts** ("contact Twenty team"), Plan-Vergleich (`yourco.twenty.com`): nur mit Twenty-Cloud-Billing sichtbar, Self-Host zeigt sie nie. Dahinterliegende Server-Billing-Engine ist Enterprise.
- **DPA-Feature** (Settings → Legal): generiert rechtliche Dokumente von Twenty.com PBC mit deren Signatar — Rebranding wäre Verfälschung fremder Rechtsdokumente. Unberührt; bei Bedarf später ausblenden.
- **SettingsEnterprise-Copy**, `ENTERPRISE_API_URL`, Enterprise-Key-Validierung: betrifft Twentys Lizenzsystem.
- **`twenty-icons.com`** (Favicon-Service für Firmenlogos): funktionaler Dienst, per `ALLOW_REQUESTS_TO_TWENTY_ICONS=false` abschaltbar.
- **Interne Fehlermeldungen/Logs** ("Twenty server", CORS-Warnung), AI-System-Prompts, `IconTwentyStar` (generisches Stern-Glyph), Dev-Seeder-Daten, Vimeo-Tutorial-Videos, Admin-Panel-Docker-Hub-Link.
- **Theme-Farben** (siehe oben).
- **`EMAIL_FROM_NAME`-Default** in `config-variables.ts` (per env übersteuern, Datei mit hoher Upstream-Churn).

## Enterprise (`@license Enterprise`)

**Keine Enterprise-lizenzierte Datei wurde verändert.** Keine Guards/Checks entfernt, nichts freigeschaltet.

Beim Rebranding gestreift und bewusst vermieden:

- `billing-reminder.service.ts` (Enterprise): enthält 3 Betreffzeilen mit "Twenty" ("Your Twenty trial is ending soon" u. a.). **Nicht geändert.** Nur relevant bei aktiviertem Twenty-Cloud-Billing. Open-Source-Alternative: keine nötig (Self-Host sendet diese Mails nicht). Empfehlung: unangetastet lassen.
- SSO-Login-UI (`SignInUpSsoIdentityProviderSelection.tsx` u. a., Enterprise): enthält kein Branding, unberührt. Die AGPL-Datei `FooterNote.tsx` auf demselben Screen wurde geändert.
- Custom-Domain-, RLS-, Billing-Module: nicht berührt.

## Lizenz / Open Source

- `license`-Datei, alle Copyright-Hinweise, AGPL-/MIT-/Enterprise-Marker: **unverändert**.
- OpenAPI-Schema behält AGPL-Lizenz-Link und Code-of-Conduct-Link auf `github.com/twentyhq/twenty` (Kategorie A).
- Sichtbarer Source-Link (AGPL §13): "Source code"-Karte in Settings → Community sowie "Source code"-Link im Footer jeder Transaktions-E-Mail, beide auf `PRODUCT_BRANDING.sourceCodeUrl` (aktuell `github.com/melon-1999/twenty` — muss öffentlich bleiben bzw. auf ein öffentliches Repo mit dem laufenden Stand zeigen, solange die Instanz von Dritten genutzt wird).
- Es wurden keine Lizenz-/Copyright-Informationen entfernt oder verfälscht.

## Branch-Schutz und Sync-Prozess

`main` spiegelt ausschließlich den offiziellen Twenty-Upstream. Branch-Protection ist auf GitHub aktiv (per API gesetzt, Stand 2026-09-12):

- Force-Pushes verboten, Löschen verboten, lineare History erzwungen, gilt auch für Admins (`enforce_admins`).
- Direkte Feature-Commits auf `main` sind damit technisch nur als Fast-Forward möglich; per Konvention ist der einzige erlaubte Push der Upstream-Sync:

```bash
git fetch upstream
git push origin upstream/main:main
```

Feature-/Produktarbeit ausschließlich auf `product/*`-Branches.

## CI und Release

- **`.github/workflows/ci-product.yaml`** (neu): läuft bei Push/PR auf `product/**`. Baut twenty-shared/-emails/-server/-front, Typecheck front+server, Lint (diff-with-main + shared/emails), Branding-Unit-Tests, und verifiziert, dass der Production-Branding-Guard aktiv ist (Build ohne Opt-out-Flag muss fehlschlagen, solange Platzhalter aktiv sind).
- **`.github/workflows/release-product.yaml`** (neu): läuft bei Tags `product/v*`. Prüft Tag == `product/v${PRODUCT_VERSION}`, baut front OHNE `ALLOW_PLACEHOLDER_BRANDING` (Production-Gate: Release schlägt fehl, solange Platzhalter aktiv — bei `product/v0.1.0` gewollt rot), erstellt bei Erfolg ein GitHub-Release.

## Production Branding Guard

- Logik: `packages/twenty-shared/src/utils/branding/findPlaceholderBrandingViolations.ts` (+ Tests). Erkennt `YourCRM`, `example.com`, `support@example.com` und `raw.githubusercontent.com`-URLs, die auf bewegliche Refs statt `product/v*`-Tags zeigen.
- Enforcement: Vite-Plugin `packages/twenty-front/src/config/assertProductionBrandingPlugin.ts`, eingehängt in `vite.config.ts` (2-Zeilen-Diff). Blockt `vite build` im Mode `production` und prüft zusätzlich `index.html` und `public/manifest.json`.
- Dev-Server (`nx start twenty-front`) ist nie betroffen. CI-/Test-Builds setzen `ALLOW_PLACEHOLDER_BRANDING=true`; Deployment-Pipelines dürfen das Flag nicht setzen.

## Versionierung / Source-Link

- `PRODUCT_VERSION` in `ProductBranding.ts` ist die Produktversion; `PRODUCT_RELEASE_TAG` = `product/v${PRODUCT_VERSION}`.
- `PRODUCT_BRANDING.sourceCodeUrl` zeigt auf `…/tree/product/v<version>` (exakt deployter Stand, AGPL §13), `repositoryUrl` auf das Repo-Root (Releases-Link, MCP-Server-Card).
- `emailLogoUrl`/`defaultWorkspaceLogoUrl` sind an denselben Tag gepinnt statt an einen Branch.
- Release-Ablauf: `PRODUCT_VERSION` bumpen → committen → `git tag product/v<version>` auf den Commit → Tag pushen. Der Release-Workflow validiert die Übereinstimmung.

## SaaS Product Cleanup (v0.2.0)

Kundenoberfläche vollständig von Twenty-/OSS-Projekt-Spuren bereinigt:

- **Community-Seite entfernt**: `/settings/community` leitet auf den neuen Legal-Bereich um; Nav-Item ersetzt. `SettingsCommunity.tsx` bleibt als Datei (kein Route-Konsument mehr) — bewusst nicht gelöscht, um Upstream-Diff klein zu halten. Labs (`SettingsLabContent`) war nur dort eingebunden und ist damit unerreichbar; `PUBLIC_FEATURE_FLAGS` serverseitig unangetastet.
- **Legal-Bereich** (`/settings/legal`, Nav "Other → Legal"): Datenschutz, Nutzungsbedingungen, Software-Lizenzen-Hinweis (AGPL-3.0/MIT) + "Quellcode dieser Version herunterladen" über `PRODUCT_BRANDING.sourceDownloadUrl` (eigene Domain, Platzhalter `legal.example.com` → Production-Guard blockt bis echt). Versionsanzeige ohne GitHub-Branding. DPA-Routen (`/settings/legal/dpa*`, `/dpa`) leiten auf Legal um — die Twenty-PBC-DPA-Dokumente (Servercode unangetastet) sind für Kunden unerreichbar.
- **GitHub für Kunden unsichtbar**: E-Mail-Footer Source-Link → `sourceDownloadUrl`; harte `docs.twenty.com`-Footer-Links entfernt (ersetzt durch Support); MCP-Server-Card ohne `repository`-Block, Name `com.<slug>/<slug>`; MCP-Client-Slug `twenty` → `PRODUCT_BRANDING.slug`; ChatGPT-Karte (Twenty-App auf chatgpt.com) entfernt; Beispieldaten (`tim@twenty.com`, `github.com/twentyhq`) neutralisiert; Dev-Scaffolding-Abschnitte (`create-twenty-app`, twenty.com-Doku-Links) aus App-Beschreibungen entfernt. `sourceCodeUrl` (GitHub-Tag) bleibt als interne Operator-Referenz ohne Kunden-Konsument.
- **Navigation "Documentation"** (docs.twenty.com) entfernt. Verstreute kontextuelle "Learn more"-Doku-Links (z. B. Workflow-Form-Builder) bewusst belassen — funktionierende technische Doku; eigener Docs-Ersatz ist Open Item.
- **Enterprise/Billing**: Route-/Komponenten-Gates ergänzt, keine Guards entfernt: `ChooseYourPlan` (`/plan-required`) leitet ohne aktiviertes Billing auf die App um; `SettingsUsage`/`SettingsUsageUserDetail` erhalten denselben `isBillingEnabled`-Redirect wie die übrigen Billing-Seiten. Enterprise-Seite/-Tab war bereits über `canAccessFullAdminPanel`-Routen-Existenz gegated (verifiziert). **0 `@license Enterprise`-Dateien geändert.**
- **Externe Requests**: `TELEMETRY_ENABLED` Default `false` (vorher: PII — Name/E-Mail jedes Signups — an twenty-telemetry.com); `MARKETPLACE_CATALOG_SYNC_CRON_ENABLED` Default `false` (vorher: automatischer Import der `@twentyhq/*`-Apps mit Twenty-Support-/Terms-/GitHub-Links von npmjs.org — Marketplace jetzt kuratiert/opt-in); `search_help_center`-AI-Tool nicht mehr automatisch registriert (sendete Kunden-Suchanfragen an twenty-help-search.com; Toolklasse bleibt, nur Announcement entfernt). Bewusst aktiv gelassen: `twenty-icons.com` (Company-Logo-Auflösung, per `ALLOW_REQUESTS_TO_TWENTY_ICONS=false` abschaltbar), Docker-Hub-Versionscheck (nur Admin-Panel/Operator).
- **Produkt-Polish**: 6 Twenty-Vimeo-Walkthrough-Videos aus Settings-Hero-Karten entfernt (`tabs={[]}`, Muster existierte upstream); "Beta"-Badge im Onboarding-Schritt "Install your first apps" entfernt; SOC2/GDPR-Trust-Badges aus dem Import-Onboarding entfernt (nicht belegte Compliance-Claims).
- **Review-Fixes**: OpenAPI `termsOfService` zeigt auf `PRODUCT_BRANDING.legalTermsUrl` (der AGPL-`license`-Link auf github.com/twentyhq bleibt als einzige bewusste GitHub-Referenz im OpenAPI-Schema); Standard-"Helper"-Agent neutral umformuliert (hing am entfernten `search_help_center`-Tool); Cmd+K-Eintrag "Community" → "Legal"; og:image absolut auf Platzhalter-Domain (Guard-gesichert); Release-Workflow prüft Branding-Platzhalter zusätzlich serverseitig (twenty-shared, unabhängig vom Front-Build).
- **Bewusst tote Dateien** (kein Route-Konsument mehr, für minimalen Upstream-Diff behalten): `SettingsCommunity.tsx`, `SettingsLegalDpa.tsx`, `SettingsLegalDpaNew.tsx`, `OnboardingTrustBadges.tsx`.
- **Bewusste Ausnahme**: `<!-- BEGIN: Twenty Config -->`-Marker in `index.html` bleibt (Server-Env-Injection matcht auf den String; nur im View-Source sichtbar).
- **Regressionstest**: `packages/twenty-shared/src/utils/branding/__tests__/customerVisibleBrandingLeaks.test.ts` scannt eine feste Liste kundensichtbarer Quelldateien auf `twentyhq`, `twenty.com`, `github.com`, `discord`, ChatGPT-App-Links und "Powered by" — bewusst NICHT global auf "Twenty" (interne Namen und Lizenztexte bleiben legitim).

## Marketing-Website (`packages/twenty-website`)

Die Next.js-Marketing-Site wurde als eigene Kunden-Surface bereinigt:

- **Navbar/Footer**: nur noch Product + Pricing (+ Login/Get started auf `SITE_URLS.appWelcome`-Platzhalter); GitHub-Stars-/Discord-Member-Zähler samt `platform/community/`-Modul (GitHub-/Discord-API-Polling) vollständig entfernt; keine Social-Links; Footer-Legal-Links auf `PRODUCT_BRANDING.legal*Url`; Copyright über `legalEntityLine`.
- **Zentrale URLs**: `src/platform/site-urls.ts` enthält nur noch `appWelcome`/`docsApi`/`docsMcp` als eigene Platzhalter-Domains — keine Twenty-Ziele mehr.
- **Retired Routen** (308 → `/`, de-indexed in `static-website-routes.ts`): `why-twenty`, `partners*`, `releases`, `customers*`, `apps*`, `compare-pricing/*`, `enterprise/*`, `terms`, `privacy-policy`, `halftone` sowie die Legacy-`/user-guide|/developers|/twenty-ui`-Doku-Redirects. Damit ist auch Twentys Enterprise-Checkout (`/enterprise/activate`, Stripe-`success_url`) bewusst stillgelegt — unser Produkt verkauft keine Twenty-Enterprise-Keys. Seiten-/Sektionscode bleibt für minimalen Upstream-Diff im Repo.
- **SEO/Meta**: `SITE_NAME`/Titles/Descriptions über `PRODUCT_BRANDING`, Twitter-Handle entfernt, `getSiteUrl`-Default `https://www.example.com` (per `NEXT_PUBLIC_WEBSITE_URL` setzen), Sitemap nur `/`, `/product`, `/pricing`.
- **Assets**: Website-Logo (`src/icons/TwentyLogo.tsx` — Name intern beibehalten), `favicon.ico` und `public/images/og/default.png` durch die Placeholder-Marke ersetzt; Twenty-Wortmarken-SVGs gelöscht; Homepage-Sektionen mit Twenty-Kundenzitaten (TrustedBy/Helped/Testimonials) entfernt; Twenty-Demo-Firma in Mockups durch Figma ersetzt; `twenty-icons.com`-Favicon-Fallback der Mockups entfernt (lokale Logos/Initialen); fremde Domain-Verifikationsdateien (`openai-apps-challenge`, `microsoft-identity-association.json`) gelöscht; `llms.txt`, `security.txt`, MCP-`server-card.json` neutralisiert.
- **Guard**: `next.config.ts` wirft bei Production-Build mit Platzhalter-Branding (gleicher Opt-out `ALLOW_PLACEHOLDER_BRANDING=true` wie die App).
- **Funktionale Twenty-Kopplungen (Open Items)**: Apps-Marketplace-Daten (`TWENTY_MARKETPLACE_API_URL`, Default api.twenty.com) und Partner-API betreffen nur retired Routen; Cal.com-Buchung zentral in `contact-cal-config.ts` mit Platzhalter-Formular-ID; `/api/enterprise/*`-Backend unangetastet (nur unerreichbar aus der UI).
- **Bewusst intern bleibend**: `twenty-sdk`-Demo-Code im Homepage-Terminal-Mockup (reales Paket, Fiction-Code), Paket-/Ordnernamen, Lingui-Kataloge enthalten Strings retirte Routen (nicht gerendert; Pruning = Open Item), "Twenty CLI"-OAuth-App-Name (reales CLI-Paket).

Operator-Hinweise (kein Code-Change):

- **Erster Signup erhält Server-Admin**: Twentys Bootstrap vergibt `canAccessFullAdminPanel`+`canImpersonate` an den ersten registrierten User der Instanz (`sign-in-up.service.ts`). Vor Kundenöffnung zwingend zuerst den Operator-Account anlegen.
- Admin Panel (Server Health, Config, Version, Enterprise) ist bereits sauber operator-gated (`canAccessFullAdminPanel`) — Customer-Settings und Operator-Bereich sind getrennt, keine neue Admin-Architektur nötig.

## Open Items

1. Finaler Produktname → `ProductBranding.ts`, `index.html`, `manifest.json`, `.env EMAIL_FROM_NAME`
2. Finales Logo → `public/images/brand/logo.svg` + Script
3. Eigene Website-/Support-/Community-URLs (aktuell `example.com`-Platzhalter)
4. Eigene Legal-Dokumente (Terms/Privacy/DPA) + URLs — bis dahin zeigen Login-Footer-Links auf Platzhalter
5. `emailLogoUrl`/`defaultWorkspaceLogoUrl` auf eigenes Hosting umziehen (aktuell raw.githubusercontent.com des Forks)
6. Brand-Farbe entscheiden → `design-tokens/accent.ts`
7. DPA-Feature ggf. ausblenden (zeigt Twenty-PBC-Dokumente)
8. AGPL §13: öffentliches Repo mit laufendem Stand sicherstellen, sobald die Instanz produktiv extern genutzt wird

9. `sourceDownloadUrl`: Quellcode-Tarball der deployten Version auf eigener Domain bereitstellen (z. B. `https://legal.<domain>/source/product-v0.2.0.tar.gz`); Release-Prozess: Tarball aus dem Release-Tag generieren und hochladen, bevor die Version deployt wird
10. Eigene Doku-Domain für kontextuelle "Learn more"-Links (aktuell docs.twenty.com): `SettingsApplicationsDeveloperTab`, `SettingsClaimApplicationSection`, `AiChatApiKeyNotConfiguredMessage`, `SettingsBillingCreditsSection`, `WorkflowEditActionFormBuilder` sowie `DOCUMENTATION_BASE_URL`
11. Operator-Runbook: ersten Account (Server-Admin-Bootstrap) immer selbst anlegen
12. Übersetzungen der neuen/umformulierten Branding-Strings in weiteren Sprachen nachziehen (de-DE ist gepflegt, Rest fällt auf Englisch zurück)
13. `og:image`-URL und `manifest`-Werte beim finalen Branding zusammen mit `index.html` aktualisieren

Punkte 1, 3, 5 und 9 werden vom Production Branding Guard erzwungen: solange sie offen sind, schlagen Production-Builds und `product/v*`-Releases absichtlich fehl.
