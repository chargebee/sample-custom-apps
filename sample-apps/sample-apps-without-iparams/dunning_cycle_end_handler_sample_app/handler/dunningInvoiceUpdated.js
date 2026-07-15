'use strict';

/**
 * Reacts to fully exhausted invoice dunning by pausing or cancelling the subscription (Chargebee API).
 */

const { createChargebeeClient } = require('./chargebeeClient');

/**
 * Hardcoded as this app is created using `serverless-node-starter-app`. For merchant specific configuration, use `serverless-node-starter-app-with-iparams` and read from iparams.
 */
const DUNNING_EXHAUSTED_ACTION = 'cancel';

/**
 * @param {import('../types/types').HandlerPayload} payload
 * @param {string} site
 * @param {string} apiKey
 */
async function handleInvoiceUpdated(payload, site, apiKey) {
	const eventContent = payload.event.content;

	// Most `invoice_updated` events are irrelevant; only act when dunning has given up on this invoice.
	const status = eventContent?.invoice?.dunning_status || eventContent?.transaction?.dunning_status;
	if (status !== 'exhausted') {
		console.log(`skip (dunning_status=${status ?? 'n/a'})`);
		return;
	}

	const subId = eventContent?.invoice?.subscription_id || eventContent?.subscription?.id;
	if (!subId) {
		throw new Error('no subscription_id in event');
	}

	const chargebee = createChargebeeClient(site, apiKey);

	if (DUNNING_EXHAUSTED_ACTION === 'pause') {
		await pauseSubscription(chargebee, subId);
		console.log('Subscription paused successfully');
	} else if (DUNNING_EXHAUSTED_ACTION === 'cancel') {
		await cancelSubscriptionForItems(chargebee, subId);
		console.log('Subscription cancelled successfully');
	} else {
		return;
	}
}

async function pauseSubscription(chargebee, subId) {
	// Several `pause_option` values exist in the API (e.g. `immediately`, `end_of_term`, …). Update `pause_option` below to match your requirement.
	await chargebee.subscription.pause(subId, { pause_option: 'immediately' });
}

async function cancelSubscriptionForItems(chargebee, subId) {
	// Several `cancel_option` values exist on `cancel_for_items` (e.g. `immediately`, `end_of_term`, …). Update `cancel_option` below to match your requirement.
	await chargebee.subscription.cancelForItems(subId, { cancel_option: 'immediately' });
}

module.exports = { handleInvoiceUpdated };
