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
	 */
	customerCreatedHandler: async function (payload) {
		try {
			await postLeadToCrm(payload);
			console.log('Lead posted to CRM successfully');
		} catch (err) {
			throw new Error(err.message);
		}
	},
};
