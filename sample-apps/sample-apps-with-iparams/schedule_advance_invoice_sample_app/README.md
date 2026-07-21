# Schedule Advance Invoice on Subscription Created

This sample app listens for Chargebee `subscription_created` events and schedules advance invoices using the Chargebee API.

## What this app does

- Triggers on `subscription_created`
- Builds a Chargebee client using:
  - `CB_APPS_SITE_DOMAIN`
  - `CB_APPS_READ_WRITE_API`
  - `api_host_suffix` from `payload.iparams.chargebee_api_configuration`
- Schedules future renewals with one of two modes:
  - `fixed` -> fixed intervals before renewal (`fixed_intervals`)
  - `specific` -> specific date (`specific_dates`)

## Event to handler mapping

Defined in `manifest.json`:

- `subscription_created` -> `subscriptionCreatedHandler`

Handler flow:

1. `handler/handler.js` receives payload
2. Calls `scheduleAdvanceInvoice(payload)` from `handler/advanceInvoiceSchedule.js`
3. Reads API host from `chargebee_api_configuration` and schedule settings from `advance_invoice_configuration`
4. Calls `chargebee.subscription.chargeFutureRenewals(...)`

## Required configuration

### Iparams

Defined in `iparams.json`:

**`chargebee_api_configuration`**

- `api_host_suffix` (`TEXT`, default `.devcb.in`)

**`advance_invoice_configuration`**

- `schedule_type` (`DROPDOWN`, required): `fixed` or `specific`
- `days_before_renewal` (`NUMBER`, default `7`) - used for `fixed`
- `terms_to_charge` (`NUMBER`, default `1`)
- `specific_invoice_date` (`DATE`) - required when `schedule_type=specific`

Local values in `iparams.local.json` are keyed by section name:

```json
{
  "chargebee_api_configuration": {
    "api_host_suffix": ".devcb.in"
  },
  "advance_invoice_configuration": {
    "schedule_type": "specific",
    "days_before_renewal": 7,
    "terms_to_charge": 1,
    "specific_invoice_date": "2026-06-15"
  }
}
```

### System env vars

For local runs, set these in `.env`:

- `CB_APPS_READ_ONLY_API`
- `CB_APPS_READ_WRITE_API`
- `CB_APPS_SITE_DOMAIN`

## Local testing

1. Fill `.env` with Chargebee credentials
2. Configure `iparams.local.json`:
   - Set `chargebee_api_configuration.api_host_suffix` if needed
   - Under `advance_invoice_configuration`:
     - For fixed schedule: set `schedule_type` to `fixed`
     - For specific schedule: set `schedule_type` to `specific` and provide `specific_invoice_date`
3. Run:

```bash
chargebee-apps run <app_dir>
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
