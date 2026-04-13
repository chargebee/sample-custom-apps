'use strict';

const { scheduleAdvanceInvoice } = require('./advanceInvoiceSchedule');

module.exports = {
	/**
	 * On `subscription_created`, configures an advance invoice schedule from iparams.
	 * @param {import('../types/types.d.ts').HandlerPayload} payload
	 */
	subscriptionCreatedHandler: async function (payload) {
		console.log('Processing subscription_created event');
		try {
			await scheduleAdvanceInvoice(payload);
		} catch (error) {
			throw new Error(error.message);
		}
	},
};
