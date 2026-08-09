# Screenshots — provenance

Two capture sources:

1. **Public marketing/product pages** (saved as PNG files here, via automated browser):
   - `00-home.png` — pipedrive.com home
   - `01-pipeline-feature.png` — features/pipeline-management
   - `03-insights-feature.png` — features/insights-and-reports
   - `04-automation-feature.png` — features/workflow-automation

2. **Authenticated live app** (`komdis.pipedrive.com`, real account, read-only walk in the user's Chrome). These were inspected live and documented in the analysis docs; they were **not** saved as files here because the browser tooling for the authenticated session could not write image files to disk. The screens inspected live: Deals pipeline (Kanban), a Deal detail page, Contacts (People) list, Activities list, Leads inbox, Insights, Settings → Data fields (custom fields). Structural findings from these live screens are captured in `01-PIPEDRIVE-PRODUCT.md`, `02-DEALS-PIPELINE.md`, `03-CONTACTS-LEADS.md`, `04-ACTIVITIES.md`, `06-CUSTOMIZATION.md`.

`pipedrive.com/en/pricing` is Cloudflare bot-protected (HTTP 403 to automated browsers); it was not screenshotted and bot-detection was not bypassed. Pricing is documented in `10-PRICING.md` from corroborated third-party sources.

The account inspected contains real customer data; the written docs describe UI structure and interaction patterns only, not that account's customer records.
