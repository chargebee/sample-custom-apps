# Schedule Advance Invoice on Subscription Created

This sample app listens for Chargebee `subscription_created` events and schedules advance invoices using the Chargebee API.

## What this app does

- Triggers on `subscription_created`
- Builds a Chargebee client using:
  - `MKPLC_SITE_DOMAIN`
  - `MKPLC_CB_READ_WRITE_API`
  - `api_host_suffix` from `iparams`
- Schedules future renewals with one of two modes:
  - `fixed` -> fixed intervals before renewal (`fixed_intervals`)
  - `specific` -> specific date (`specific_dates`)

## Event to handler mapping

Defined in `manifest.json`:

- `subscription_created` -> `subscriptionCreatedHandler`

Handler flow:

1. `handler/handler.js` receives payload
2. Calls `scheduleAdvanceInvoice(payload)` from `handler/advanceInvoiceSchedule.js`
3. Reads scheduling mode from `iparams`
4. Calls `chargebee.subscription.chargeFutureRenewals(...)`

## Required configuration

### Iparams

Defined in `iparams.json`:

- `api_host_suffix` (`TEXT`, default `.devcb.in`)
- `schedule_type` (`DROPDOWN`, required): `fixed` or `specific`
- `days_before_renewal` (`NUMBER`, default `7`) - used for `fixed`
- `terms_to_charge` (`NUMBER`, default `1`)
- `specific_invoice_date` (`DATE`) - required when `schedule_type=specific`

### System env vars

For local runs, set these in `.env`:

- `MKPLC_CB_READ_ONLY_API`
- `MKPLC_CB_READ_WRITE_API`
- `MKPLC_SITE_DOMAIN`

## Local testing

1. Fill `.env` with Chargebee credentials
2. Configure `iparams.local.json`:
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
