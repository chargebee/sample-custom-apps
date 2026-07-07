# CRM Lead on Customer Created (v2)

This sample app listens for Chargebee `customer_created` events and creates a lead/contact in HubSpot using the Contacts API.

It mirrors `crm_lead_on_customer_created_sample_app` but uses the **section-based iparam structure** introduced in marketplace v2.

## What this app does

- Triggers on `customer_created`
- Reads `crm_webhook_url` and `crm_auth_token` from `payload.iparams.crm_integration`
- Maps Chargebee customer fields to HubSpot contact properties:
  - `email`
  - `firstname`
  - `lastname`
  - `company`
  - `phone`
  - `lifecyclestage` (set to `lead`)
- Sends `POST` request to HubSpot Contacts endpoint with Bearer token auth

## Iparams: v1 vs v2

| | v1 (`crm_lead_on_customer_created_sample_app`) | v2 (this app) |
|---|---|---|
| `iparams.json` | Flat parameter array | `installation_parameters.sections` |
| Handler access | `payload.iparams.crm_webhook_url` | `payload.iparams.crm_integration.crm_webhook_url` |
| `iparams.local.json` | Flat keys | Nested by section name |

## Event to handler mapping

Defined in `manifest.json`:

- `customer_created` -> `customerCreatedHandler`

Handler flow:

1. `handler/handler.js` receives payload
2. Calls `postLeadToCrm(payload)` from `handler/crmLead.js`
3. Validates required iparams from the `crm_integration` section
4. Posts contact to HubSpot

## Required configuration

### Iparams

Defined in `iparams.json` under the `crm_integration` section:

- `crm_webhook_url` (`URL`, required)
  - Example: `https://api.hubapi.com/crm/v3/objects/contacts`
- `crm_auth_token` (`SECRET`, required)
  - HubSpot private app token sent as `Authorization: Bearer <token>`

Local values in `iparams.local.json` are keyed by section name:

```json
{
  "crm_integration": {
    "crm_webhook_url": "https://api.hubapi.com/crm/v3/objects/contacts",
    "crm_auth_token": "REPLACE_WITH_YOUR_HUBSPOT_PRIVATE_APP_TOKEN"
  }
}
```

### System env vars

For local runs, set these in `.env`:

- `MKPLC_CB_READ_ONLY_API`
- `MKPLC_CB_READ_WRITE_API`
- `MKPLC_SITE_DOMAIN`

## Local testing

1. Fill `.env` with your Chargebee values
2. Fill `iparams.local.json` with HubSpot API URL and token under `crm_integration`
3. Run:

```bash
apps run <app_dir>
```

4. Open `http://localhost:15000`
5. Select `customer_created`
6. Use `test_data/customer_created.json`
7. Verify terminal logs for success/failure response

## Files of interest

- `manifest.json`
- `handler/handler.js`
- `handler/crmLead.js`
- `iparams.json`
- `iparams.local.json`
- `test_data/customer_created.json`
