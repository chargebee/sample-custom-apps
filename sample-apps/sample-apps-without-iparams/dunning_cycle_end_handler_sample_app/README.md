# Dunning Cycle End Handler

This sample app listens for Chargebee `invoice_updated` events and takes action when dunning is exhausted for an invoice.

## What this app does

- Triggers on `invoice_updated`
- Checks `invoice.dunning_status` (or fallback `transaction.dunning_status`)
- If status is not `exhausted`, it skips
- If exhausted:
  - Finds subscription id from event payload
  - Calls Chargebee API to pause or cancel the subscription

Current action in code:

- `DUNNING_EXHAUSTED_ACTION = 'cancel'`
- Uses `subscription.cancelForItems(subId, { cancel_option: 'immediately' })`

You can switch behavior to pause by changing `DUNNING_EXHAUSTED_ACTION` in `handler/dunningInvoiceUpdated.js`.

## Event to handler mapping

Defined in `manifest.json`:

- `invoice_updated` -> `invoiceUpdatedHandler`

Handler flow:

1. `handler/handler.js` receives payload
2. Calls `handleInvoiceUpdated(payload)` from `handler/dunningInvoiceUpdated.js`
3. Creates Chargebee client from `handler/chargebeeClient.js`
4. Cancels or pauses subscription based on configured action

## Configuration

This app does not use `iparams`.

### System env vars

For local runs, set these in `.env`:

- `MKPLC_CB_READ_ONLY_API`
- `MKPLC_CB_READ_WRITE_API`
- `MKPLC_SITE_DOMAIN`

API host suffix is currently hardcoded as `.devcb.in` in `handler/chargebeeClient.js`.

## Local testing

1. Fill `.env` with Chargebee credentials
2. Run:

```bash
apps run .
```

3. Open `http://localhost:15000`
4. Select `invoice_updated`
5. Use `test_data/invoice_updated.json` (contains `dunning_status: exhausted`)
6. Verify logs and API action outcome

## Files of interest

- `manifest.json`
- `handler/handler.js`
- `handler/dunningInvoiceUpdated.js`
- `handler/chargebeeClient.js`
- `test_data/invoice_updated.json`
