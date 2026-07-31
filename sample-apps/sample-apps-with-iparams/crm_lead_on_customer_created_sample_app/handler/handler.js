'use strict';

/**
 * Serverless function handlers
 * Each handler receives a single payload argument with payload.event and payload.iparams.<section>.<param>
 */

const { postLeadToCrm } = require('./crmLead');

module.exports = {
	/**
	 * Handles customer_created events
	 * @param {import('../types/types').HandlerPayload} payload - Event and iparams
	 * @returns {Promise<import('../types/types').HandlerResult | void>}
	 */
	customerCreatedHandler: async function (payload) {
		try {
			await postLeadToCrm(payload);
			console.log('Lead posted to CRM successfully');
		} catch (err) {
			// 409: contact already exists in HubSpot — no value in retrying.
			if (err.statusCode === 409) {
				return {
					statusCode: 409,
					body: JSON.stringify({ message: 'Contact already exists in HubSpot; skipping duplicate lead creation' }),
				};
			}
			// Throw to signal a transient failure — the platform WILL retry (treated as 5xx).
			throw err;
		}
	},
};
