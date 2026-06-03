# POC Sample App — iParam Access With Sections

Internal feedback sample. Compare with [`poc-sample-app-with-direct-iparam-access`](../poc-sample-app-with-direct-iparam-access).

## Accessing iparams in the handler

```javascript
payload.iparams.processing_fee_configuration.fee_percentage
payload.iparams.processing_fee_configuration.fee_limit
payload.iparams.late_payment_fee_configuration.fee_percentage
```
Parameters are read through the section name. Both sections use the parameter name `fee_percentage`.



## `iparams.local.json`
```json
{
  "processing_fee_configuration": {
    "fee_percentage": 3,
    "fee_limit": 10000
  },
  "late_payment_fee_configuration": {
    "fee_percentage": 1.5
  }
}
```

## Duplicate parameter names across sections

**Allowed.** The same parameter name (e.g. `fee_percentage`) can be used in multiple sections because each value is scoped under its section key.
