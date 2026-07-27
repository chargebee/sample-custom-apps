'use strict';

/**
 * Serverless function handlers
 * Each handler receives a single payload argument with payload.event and payload.iparams.<section>.<param>
 */

const { scheduleAdvanceInvoice } = require('./advanceInvoiceSchedule');

module.exports = {
	/**
	 * On `subscription_created`, configures an advance invoice schedule from iparams.
	 * @param {import('../types/types.d.ts').HandlerPayload} payload - Event and iparams
	 * @returns {Promise<import('../types/types.d.ts').HandlerResult | void>}
	 */
	subscriptionCreatedHandler: async function (payload) {
		console.log('Processing subscription_created event');
		const scheduleType = payload.iparams?.advance_invoice_configuration?.schedule_type;
		// Return 4xx to signal a non-retryable error — the platform will NOT retry.
		if (scheduleType !== 'fixed' && scheduleType !== 'specific') {
			return {
				statusCode: 400,
				body: JSON.stringify({ message: `Unsupported schedule_type: "${scheduleType}". Expected "fixed" or "specific".` }),
			};
		}
		try {
			const site = process.env['CB_APPS_SITE_DOMAIN'];
			const apiKey = process.env['CB_APPS_READ_WRITE_API'];
			await scheduleAdvanceInvoice(payload, site, apiKey);
		} catch (error) {
			// Throw to signal a transient failure — the platform WILL retry (treated as 5xx).
			throw new Error(error.message);
		}
	},
};
