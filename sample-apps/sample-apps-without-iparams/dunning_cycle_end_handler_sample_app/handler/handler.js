'use strict';

const { handleInvoiceUpdated } = require('./dunningInvoiceUpdated');

/**
 * Serverless function handlers
 * Each handler receives a single payload argument with payload.event
 */
module.exports = {
	/**
	 * Must match `manifest.json` → `events.invoice_updated.handler`.
	 * @param {import('../types/types').HandlerPayload} payload
	 * @returns {Promise<import('../types/types').HandlerResult | void>}
	 */
	invoiceUpdatedHandler: async function (payload) {
		const subscriptionId = payload.event.content?.invoice?.subscription_id;
		// One-time invoices are not linked to a subscription — nothing to pause or cancel.
		// Return 4xx to signal a non-retryable skip — the platform will NOT retry.
		if (!subscriptionId) {
			return {
				statusCode: 400,
				body: JSON.stringify({ message: 'Invoice is not linked to a subscription; skipping dunning action' }),
			};
		}
		try {
			const site = String(process.env['CB_APPS_SITE_DOMAIN'] || '').trim();
			const apiKey = process.env['CB_APPS_READ_WRITE_API'];
			await handleInvoiceUpdated(payload, site, apiKey);
			console.log('Dunning exhaustion handled successfully');
		} catch (error) {
			// Throw to signal a transient failure — the platform WILL retry (treated as 5xx).
			throw new Error(error.message);
		}
	},
};
