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
	 */
	subscriptionCreatedHandler: async function (payload) {
		console.log('Processing subscription_created event');
		try {
			const site = process.env['CB_APPS_SITE_DOMAIN'];
			const apiKey = process.env['CB_APPS_READ_WRITE_API'];
			await scheduleAdvanceInvoice(payload, site, apiKey);
		} catch (error) {
			throw new Error(error.message);
		}
	},
};
