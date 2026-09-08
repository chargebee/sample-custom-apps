# oauth-crm-sync

Sample Chargebee custom app demonstrating OAuth 2.0 integration.

Listens to `customer_created` and `subscription_created` events, then syncs the data to HubSpot CRM using an OAuth-authorized access token.

## Setup

### 1. Create a HubSpot OAuth app

1. Go to [HubSpot Developer Portal](https://developers.hubspot.com/) → Apps → Create app
2. Under **Auth** → **OAuth**, note your **Client ID** and **Client Secret**
3. Add redirect URI: `http://localhost:10101/oauth/callback` (or the port you run the CLI on)
4. Add scopes: `crm.objects.contacts.read crm.objects.contacts.write`

### 2. Configure credentials

Edit `oauth_config.json` and replace the placeholder values:

```json
{
  "connectors": {
    "hubspot": {
      "client_id": "<YOUR_HUBSPOT_CLIENT_ID>",
      "client_secret": "<YOUR_HUBSPOT_CLIENT_SECRET>",
      ...
    }
  }
}
```

### 3. Run the tester UI

```bash
cb-apps run --dir .
```

Open `http://localhost:10101` in your browser.

### 4. Authorize via OAuth

1. Click the **OAuth** tab in the tester UI
2. Click **Connect** next to `hubspot`
3. Complete the HubSpot authorization flow in the popup
4. The tab shows **Authorized** once the token is saved

### 5. Test an event

1. Select `customer_created` from the event dropdown
2. Click **Invoke** — the handler creates or updates a HubSpot contact
3. Select `subscription_created` and click **Invoke** — a note is added in HubSpot

## How OAuth tokens work

- Tokens are encrypted with AES-256-GCM and stored in `oauth.local.json` (gitignored)
- The encryption key lives in `.oauth.key` (also gitignored, `0600` permissions)
- On every invocation, the CLI decrypts the token and injects it as:
  ```js
  payload.oauth_token.hubspot.access_token  // Bearer token
  payload.oauth_token.hubspot.token_type    // "Bearer"
  ```
- Only `access_token` and `token_type` are exposed to handler code; `refresh_token` stays encrypted on disk

## Files

| File | Purpose |
|------|---------|
| `manifest.json` | App metadata and event-to-handler mapping |
| `oauth_config.json` | OAuth connector credentials (fill in your client_id/secret) |
| `handler/handler.js` | Event handler code |
| `test_data/` | Sample payloads for local testing |
| `types/types.d.ts` | TypeScript type hints for the handler payload |
| `.gitignore` | Excludes secrets and generated files |
