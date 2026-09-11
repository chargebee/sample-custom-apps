/**
 * oauth-crm-sync — sample app demonstrating OAuth 2.0 token usage.
 *
 * How OAuth tokens reach this handler:
 *   1. Add your OAuth credentials to oauth_configs.json.
 *   2. Open the tester UI (cb-apps run), click the OAuth tab, and click Connect.
 *   3. After authorizing, tokens are encrypted and saved locally.
 *   4. On every invocation, the CLI decrypts the token and injects it as
 *      payload.oauth_token["hubspot"].access_token (Bearer token ready to use).
 *
 * Available in payload.oauth_token only when:
 *   - oauth_configs.json exists in the app directory, AND
 *   - the connector has been authorized via the tester UI
 */

'use strict';

const HUBSPOT_API = 'https://api.hubapi.com';

module.exports = {
  /**
   * Creates or updates a HubSpot contact when a Chargebee customer is created.
   * @param {import('../types/types.d.ts').HandlerPayload} payload
   */
  onCustomerCreated: async function (payload) {
    const token = getToken(payload, 'hubspot');
    const customer = payload.event.content.customer;

    const [firstName, ...rest] = (customer.first_name || '').split(' ');
    const lastName = customer.last_name || rest.join(' ') || '';

    const contact = {
      properties: {
        email: customer.email,
        firstname: firstName,
        lastname: lastName,
        phone: customer.phone || '',
        company: customer.company || '',
        chargebee_customer_id: customer.id,
      },
    };

    const existing = await hubspotGet(token, `/crm/v3/objects/contacts/${customer.email}?idProperty=email`);

    if (existing.id) {
      await hubspotPatch(token, `/crm/v3/objects/contacts/${existing.id}`, contact);
      console.log(`[CRM Sync] Updated HubSpot contact ${existing.id} for customer ${customer.id}`);
    } else {
      const created = await hubspotPost(token, '/crm/v3/objects/contacts', contact);
      console.log(`[CRM Sync] Created HubSpot contact ${created.id} for customer ${customer.id}`);
    }
  },

  /**
   * Logs a HubSpot note when a Chargebee subscription is created.
   * @param {import('../types/types.d.ts').HandlerPayload} payload
   */
  onSubscriptionCreated: async function (payload) {
    const token = getToken(payload, 'hubspot');
    const subscription = payload.event.content.subscription;
    const customer = payload.event.content.customer;

    const note = {
      properties: {
        hs_note_body: [
          `Chargebee subscription created`,
          `Subscription ID: ${subscription.id}`,
          `Plan: ${subscription.subscription_items?.[0]?.item_price_id ?? 'N/A'}`,
          `Status: ${subscription.status}`,
          `Customer: ${customer?.email ?? subscription.customer_id}`,
        ].join('\n'),
        hs_timestamp: new Date().toISOString(),
      },
    };

    const created = await hubspotPost(token, '/crm/v3/objects/notes', note);
    console.log(`[CRM Sync] Created HubSpot note ${created.id} for subscription ${subscription.id}`);
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the Bearer token for a connector.
 * Throws a descriptive error when the connector hasn't been authorized yet,
 * so the developer sees a clear message in the tester UI logs.
 */
function getToken(payload, connectorName) {
  const token = payload.oauth_token?.[connectorName]?.access_token;
  if (!token) {
    throw new Error(
      `OAuth token for '${connectorName}' is not available. ` +
      `Open the tester UI, go to the OAuth tab, and click Connect to authorize.`
    );
  }
  return token;
}

async function hubspotGet(token, path) {
  const res = await fetch(`${HUBSPOT_API}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`HubSpot GET ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.status === 404 ? {} : res.json();
}

async function hubspotPost(token, path, body) {
  const res = await fetch(`${HUBSPOT_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`HubSpot POST ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function hubspotPatch(token, path, body) {
  const res = await fetch(`${HUBSPOT_API}${path}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`HubSpot PATCH ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}
