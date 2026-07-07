# Schedule Advance Invoice on Subscription Created (v2)

This sample app listens for Chargebee `subscription_created` events and schedules advance invoices using the Chargebee API.

It uses the **section-based iparam structure** introduced in marketplace v2.

## What this app does

- Triggers on `subscription_created`
- Builds a Chargebee client using:
  - `MKPLC_SITE_DOMAIN`
  - `MKPLC_CB_READ_WRITE_API`
  - `api_host_suffix` from `payload.iparams.advance_invoice_configuration`
- Schedules future renewals with one of two modes:
  - `fixed` -> fixed intervals before renewal (`fixed_intervals`)
  - `specific` -> specific date (`specific_dates`)

## Iparams: v1 vs v2

| | v1 (flat array) | v2 (this app) |
|---|---|---|
| `iparams.json` | Flat parameter array | `installation_parameters.sections` |
| Handler access | `payload.iparams.schedule_type` | `payload.iparams.advance_invoice_configuration.schedule_type` |
| `iparams.local.json` | Flat keys | Nested by section name |

## Event to handler mapping

Defined in `manifest.json`:

- `subscription_created` -> `subscriptionCreatedHandler`

Handler flow:

1. `handler/handler.js` receives payload
2. Calls `scheduleAdvanceInvoice(payload)` from `handler/advanceInvoiceSchedule.js`
3. Reads scheduling mode from the `advance_invoice_configuration` section
4. Calls `chargebee.subscription.chargeFutureRenewals(...)`

## Required configuration

### Iparams

Defined in `iparams.json` under the `advance_invoice_configuration` section:

- `api_host_suffix` (`TEXT`, default `.devcb.in`)
- `schedule_type` (`DROPDOWN`, required): `fixed` or `specific`
- `days_before_renewal` (`NUMBER`, default `7`) - used for `fixed`
- `terms_to_charge` (`NUMBER`, default `1`)
- `specific_invoice_date` (`DATE`) - required when `schedule_type=specific`

Local values in `iparams.local.json` are keyed by section name:

```json
{
  "advance_invoice_configuration": {
    "api_host_suffix": ".devcb.in",
    "schedule_type": "specific",
    "days_before_renewal": 7,
    "terms_to_charge": 1,
    "specific_invoice_date": "2026-06-15"
  }
}
```

### System env vars

For local runs, set these in `.env`:

- `MKPLC_CB_READ_ONLY_API`
- `MKPLC_CB_READ_WRITE_API`
- `MKPLC_SITE_DOMAIN`

## Local testing

1. Fill `.env` with Chargebee credentials
2. Configure `iparams.local.json` under `advance_invoice_configuration`:
   - For fixed schedule: set `schedule_type` to `fixed`
   - For specific schedule: set `schedule_type` to `specific` and provide `specific_invoice_date`
3. Run:

```bash
apps run <app_dir>
```

4. Open `http://localhost:15000`
5. Select `subscription_created`
6. Use `test_data/subscription_created.json`
7. Check logs for scheduled invoice API response

## Files of interest

- `manifest.json`
- `handler/handler.js`
- `handler/advanceInvoiceSchedule.js`
- `iparams.json`
- `iparams.local.json`
- `test_data/subscription_created.json`
