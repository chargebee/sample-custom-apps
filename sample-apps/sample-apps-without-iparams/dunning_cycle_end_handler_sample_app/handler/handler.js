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
	 */
	invoiceUpdatedHandler: async function (payload) {
		try {
			const site = String(process.env['CB_APPS_SITE_DOMAIN'] || '').trim();
			const apiKey = process.env['CB_APPS_READ_WRITE_API'];
			await handleInvoiceUpdated(payload, site, apiKey);
			console.log('Dunning exhaustion handled successfully');
		} catch (error) {
			throw new Error(error.message);
		}
	},
};
