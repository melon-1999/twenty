# 10 — Dependencies

Capability dependencies are declared centrally in the catalog (`dependsOn`), discovered from real Twenty relations/behavior — not assumed.

## Discovered dependencies (from code / data model)

| Capability | Depends on | Evidence |
|---|---|---|
| Deals (Opportunity) | Companies, Contacts | Opportunity has relation fields to Company/Person (standard object relations); a deal links a contact/org |
| Dashboards | CRM records (Contacts/Companies/Deals/Activities) | dashboard widgets aggregate over object records; empty without them |
| Email | Contacts | synced messages match participants to Person records (message-participant matching); linking targets contacts |
| Calendar | Activities | calendar events surface as/with activities; activity timeline integration |
| Automations | CRM records | workflow triggers are database events on records; actions create/update records |
| AI Assistant | — (none hard) | AI tools operate over whatever objects exist + permissions; degrades gracefully |
| Products (future) | Deals | line items attach to an Opportunity |
| Reports (future) | CRM records | reports read records |

Core capabilities (Contacts/Companies/Activities) have no dependencies; Deals depends on Companies/Contacts but all are core (always on), so the dependency is trivially satisfied.

## Behavior when a dependency is disabled (§15)

Chosen: **predictable, confirmation-based, never silent data loss.**
- **Enabling** a capability whose dependency is disabled → prompt to also enable the dependency ("Products needs Deals — enable Deals too?"), then enable both. (Auto-enable-with-confirm.)
- **Disabling** a capability that a dependent needs → block, and offer to also disable the dependents ("Deals is used by Products — disable Products too?"). (Cascade-disable-with-confirm.) If declined, the disable is cancelled.
- Core dependencies can never be disabled, so most chains resolve trivially.
- No combination may leave a capability enabled with a disabled dependency (validated in `setEnabled`). Invalid states are impossible, not merely discouraged.

## Cycle safety

The catalog is validated at load: `dependsOn` must be acyclic. A cycle is a startup error (fail fast), not a runtime surprise.

## Where it lives

- Declaration: catalog `dependsOn` (source of truth, [03](03-CAPABILITY-MODEL.md)).
- Enforcement: `WorkspaceCapabilityService.setEnabled` (server) validates; the Settings UI ([13](13-SETTINGS-UX.md)) surfaces the confirmations.
- Resolution: `enabled(ws, cap)` requires all `dependsOn` enabled (recursive), so even a directly-stored `isEnabled=true` resolves to usable only if deps hold — defense in depth.
