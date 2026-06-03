# POC Sample App — Direct iParam Access

Internal feedback sample. Compare with [`poc-sample-app-iparam-access-with-section`](../poc-sample-app-iparam-access-with-section).

## Accessing iparams in the handler

```javascript
payload.iparams.processing_fee_percentage
payload.iparams.processing_fee_limit
payload.iparams.late_payment_fee_percentage
```
Parameters are defined inside sections in `iparams.json`, but read as flat keys (no section prefix).


## `iparams.local.json`

```json
{
  "processing_fee_percentage": 3,
  "processing_fee_limit": 10000,
  "late_payment_fee_percentage": 1.5
}
```
Flat key-value — keys match the parameter names used in the handler.

## Duplicate parameter names across sections

**Not allowed.** Each parameter must have a unique name app-wide (e.g. `processing_fee_percentage` and `late_payment_fee_percentage`).
