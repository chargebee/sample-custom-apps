---
name: app-review
description: Review a Chargebee sample custom app's handler code (manifest.json + handler/*.js + iparams.json) for error-handling correctness, null-pointer/unguarded-access risk, API call volume, list pagination correctness, code standards, iparams SECRET-type misclassification, unsafe global/module-level state, and general Node.js best practices. Use when the user asks to "review this app", "review the handler", or points at a sample custom app directory/zip and asks for feedback. Takes a path to an app directory (or unzipped app) as input.
argument-hint: <path-to-app-directory>
---

# App Review

Review a sample custom app against seven fixed dimensions. The target
is always a directory containing `manifest.json` and a `handler/` folder
(one or more `*.js` files). If given a `.zip`, unzip it to a scratch dir
first.

## Steps

1. Read `manifest.json` — note the event → handler mapping and the
   `dependencies.chargebee` SDK version.
2. Read every file under `handler/` (follow local `require('./...')` chains
   inside the handler dir).
3. If `iparams.json` exists, read it too — it explains what
   `payload.iparams.<field>` values are available and whether any are
   `SECRET`.
4. Evaluate the seven dimensions below. Cite every finding as `file:line`.
   Don't flag something as wrong without pointing at the exact line.
5. Report back organized under the seven headings, in prose/bullets (not via
   the ReportFindings tool — that's for the /code-review skill's diff review,
   not apps). End with a short "priority fix" callout if anything
   is severe.

## The seven dimensions

### 1. Error handling
Chargebee event handlers must classify failures correctly:

| Handler behavior | Platform retries? |
|---|---|
| returns `undefined` / `{statusCode: 2xx}` | No |
| returns `{statusCode: 4xx}` (except 429) | No — permanent skip |
| returns `{statusCode: 5xx}` | No — explicit failure |
| `throw`s | Yes — transient, retry |

Check for:
- A `try/catch` around every Chargebee/external API call.
- 4xx (excluding 429) classified as permanent → `return {statusCode, body}`,
  not thrown.
- 429/5xx/network errors re-thrown as the **original** error object (never
  wrapped in `new Error(...)`, which discards `http_status_code` and the
  stack trace).
- A descriptive `body` on every returned error response (it's the only
  thing visible in execution logs).
- Consistency: does the handler's success path and error path return
  compatible shapes (always `undefined`, or always `{statusCode, body}` —
  not an unexplained mix)?

### 2. Null pointer / unguarded access
- Flag every deep property chain read off `payload` (e.g.
  `payload.event.content.transaction.id`, `payload.iparams.section.field`)
  that has **no optional chaining and no try/catch around it**. This is the
  most common recurring bug in these apps: extraction of IDs/config happens
  *before* the `try` block, so a malformed/unexpected payload shape crashes
  the handler unhandled instead of being classified as a 4xx/5xx per
  dimension 1.
- Flag accesses to fields that come back from list/retrieve API responses
  (`invoice.amount_due`, `entry.invoice`, `customer.balances[0]`, etc.)
  without a fallback (`|| 0`, `?.`, `?? {}`) when the field is genuinely
  optional in the Chargebee API response.
- Don't flag optional chaining that's already there — only flag the gaps.

### 3. Performance — number of API calls
- Count API calls per handler invocation, and specifically look for calls
  made **inside** a loop that don't need to be there — most commonly:
  re-`retrieve`-ing the same resource on every loop iteration instead of
  tracking its state locally and decrementing/updating in memory.
  This is an N+1 pattern: a customer with N outstanding invoices can turn a
  single event into 2N+ API calls.
- Look for calls whose result was already available on data fetched
  earlier in the same function (e.g. re-fetching a resource whose relevant
  field was already returned by the `list()` call a few lines above).
- Look for a call that will foreseeably always fail the same way (e.g. a
  "remove" call immediately after logic that already established the
  removal target isn't present) — a caught-and-ignored error status is a
  sign the call is dead weight, not a sign it's safe.
- Sequential vs parallel loops aren't automatically a problem — sequential
  awaiting inside a loop against a rate-limited API is often the *safer*
  choice. Only flag it if it risks a function timeout (very large expected
  N) or duplicates work.

### 4. List / pagination
- Confirm the standard offset pattern: `let offset; do { ...; if (offset)
  params.offset = offset; const result = await x.list(params); ...;
  offset = result.next_offset; } while (offset);` — flag any deviation
  (missing `next_offset` read, wrong param name, infinite-loop risk if
  `offset` is always reassigned even when falsy).
- **Mutation-during-pagination hazard**: if the loop body writes to /
  changes the status of items that are part of the `list()` filter (e.g.
  paying off an invoice matched by `status[in]: [not_paid,...]`), later
  pages of the *same* paginated query can skip items, because offset-based
  pagination assumes a stable underlying result set. Flag this whenever a
  mutating call happens inside a loop that's still paginating over a
  filter the mutation could affect. Read-only loops (compute a sum, then
  mutate after pagination finishes) don't have this problem.
- `limit` should be present and ≤ 100 (Chargebee's list API max).

### 5. Code standards
- Duplicated error-classification/try-catch logic across multiple handlers
  in the same file — should be a shared helper (e.g. extract
  `handleChargebeeError` once and reuse it from every handler).
- `require('chargebee')` placement — note if it's inside the handler
  function vs module scope, but don't treat this as a hard defect; multiple
  reviewed apps do this deliberately.
- Env var validation: are `CB_APPS_SITE_DOMAIN` / `CB_APPS_READ_WRITE_API`
  (or other `process.env.*` reads) checked before use, or will a missing
  var surface as an opaque SDK error?
- Currency/amount assumptions: flag `amount / 100` style conversions that
  assume a 2-decimal-place currency, if the app could run on multi-currency
  sites.
- Custom field type mismatches: flag writing a formatted string (e.g.
  `"$12.34"`) into a custom field without confirming the field is a TEXT
  field, not NUMBER/DECIMAL.
- Note (don't necessarily flag) good practice already present: e.g.
  `'chargebee-event-actions': 'all-disabled'` on writes to suppress
  feedback-loop events — call this out as correct when you see it, not as
  a finding.

### 6. iparams SECRET-type audit
If `iparams.json` is present, check every declared installation parameter
whose `name` or `display_name` contains a sensitive-sounding term —
`password`, `passwd`, `pwd`, `secret`, `key` (`api_key`, `apikey`,
`secret_key`, `private_key`, `access_key`, `encryption_key`), `token`,
`credential`, `auth`, `client_secret`, `access_code`, `pin` — against its
declared `"type"`.

- If the field name/display name matches one of these terms but
  `"type"` is not `"SECRET"` (e.g. it's `"TEXT"`), flag it: this field's
  value will be readable/loggable wherever `payload.iparams.<field>` is
  used in the handler, and the [chargebee-apps](https://www.npmjs.com/package/@chargebee/chargebee-apps)
  CLI's secret-in-log protections only apply to fields actually declared
  `SECRET` — a misclassified field gets no protection at all.
- Cross-check the handler code too: if a field *is* correctly typed
  `SECRET` but the handler still logs it (`console.log(payload.iparams.<field>)`
  or similar), call that out as well even though `chargebee-apps run` /
  `chargebee-apps package` should already catch this — it's worth
  surfacing directly in the review.
- Don't flag generic non-sensitive fields (e.g. `coupon_id`,
  `custom_field_for_subs`) even if they happen to contain "id"/"field" —
  only match on the sensitive-term list above, applied to the field's
  `name` and `display_name`, case-insensitively, as a whole-word/substring
  match (e.g. `api_key` matches "key", `subs_key_field` would too — when in
  doubt, err toward flagging and let the human reviewer dismiss it).

### 7. Global variable usage & other best practices
Handler modules can be reused across "warm" invocations of the same
container — module-level state doesn't reliably reset between events the
way a fresh function scope does.

- Flag module-level (outside any function) `let`/`var` declarations, or
  module-level `const` objects/arrays/Maps that are **mutated** inside a
  handler (`.push`, `[key] = value`, property assignment, `.set(...)`)
  anywhere in the file. This is unsafe shared mutable state: a value set
  while processing one event/customer can leak into the processing of a
  later, unrelated event on a warm container, or race under concurrent
  invocations.
- Module-level `const` that is **never reassigned/mutated** after
  declaration is fine and not a finding — named constants, lookup tables
  (e.g. `CUSTOMER_ID_EXTRACTORS`), regexes, a memoized Chargebee client
  built once from env vars. Caching the SDK client itself at module scope
  is a *good* practice (avoids reconstructing it — and its cold-start
  cost — on every invocation); only flag it if that cached client (or any
  other module-level value) is also written to with per-request data.
- Any module-level cache keyed by request-specific data (customer id,
  transaction id, etc.) needs to be explicitly scoped/cleared per key —
  flag if it looks like it could serve stale data from a different
  customer's invocation.

Other best practices to check while reading the handler:
- **Idempotency**: since the platform retries transient failures (and
  users can trigger the same event twice), does a mutating call have a
  pre-check ("already applied"/"already exists") before acting? Acknowledge
  it as good when present; flag a mutating call with no such guard as a
  double-processing risk.
- **Fire-and-forget async calls**: any `chargebee.*` (or other async) call
  invoked without `await` and without a `.catch` — flag it; the handler may
  return before the write completes, or an unhandled rejection can surface
  on an unrelated later invocation in the same process.
- **Blocking/sync I/O**: `fs.*Sync`, `execSync`, or manual busy-wait/sleep
  loops inside a handler block the event loop for every other concurrent
  invocation sharing that container — flag any use.
- **Hardcoded secrets/config**: string literals that look like API keys,
  hostnames, or tokens hardcoded in the handler instead of sourced from
  `iparams`/`process.env` — flag.
- **Dead/unused code**: unused variables or imports, unreachable branches,
  leftover debug `console.log`s with no operational value.
- **Magic numbers/strings**: repeated literals (status codes, field names)
  that would read more clearly as a named constant — minor, note but don't
  overweight it.

## Output format

One heading per dimension (1–7), each with bullet findings as
`` `file:line` — issue, and why it matters ``. If a dimension has nothing
worth flagging, say so briefly rather than omitting the heading. Close with
a one-line "priority fix" pointer if there's a clear highest-value change.
