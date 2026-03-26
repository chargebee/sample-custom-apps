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
			await handleInvoiceUpdated(payload);
			console.log('Dunning exhaustion handled successfully');
		} catch (error) {
			throw new Error(error.message);
		}
	},
};
