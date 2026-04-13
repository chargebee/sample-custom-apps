'use strict';

// Chargebee is declared in manifest.json and installed for the handler runtime.
const Chargebee = require('chargebee');

function createChargebeeClient(hostSuffix) {
	const site = process.env['MKPLC_SITE_DOMAIN'];
	const apiKey = process.env['MKPLC_CB_READ_WRITE_API'];
	if (!site || !apiKey) throw new Error('Missing MKPLC_SITE_DOMAIN or MKPLC_CB_READ_WRITE_API');
	return new Chargebee({ site, apiKey, hostSuffix });
}

/**
 * @param {import('../types/types.d.ts').HandlerPayload} payload
 */
async function scheduleAdvanceInvoice(payload) {
	const eventContent = payload.event.content;
	const iparams = payload.iparams;
	const chargebee = createChargebeeClient(iparams.api_host_suffix);
	const selectedScheduleType = iparams.schedule_type;

	let params;
	if (selectedScheduleType === 'fixed') {
		params = {
			schedule_type: 'fixed_intervals',
			terms_to_charge: iparams.terms_to_charge,
			fixed_interval_schedule: {
				days_before_renewal: iparams.days_before_renewal,
				end_schedule_on: 'subscription_end',
			},
		};
	} else if (selectedScheduleType === 'specific') {
		if (!iparams.specific_invoice_date) {
			throw new Error('specific_invoice_date is required when schedule_type is specific');
		}
		params = {
			schedule_type: 'specific_dates',
			specific_dates_schedule: [
				{
					date: toUnixUtc(iparams.specific_invoice_date),
					terms_to_charge: iparams.terms_to_charge,
				},
			],
		};
	}

	const result = await chargebee.subscription.chargeFutureRenewals(eventContent.subscription.id, params);
	console.log('Advance invoice scheduled:', JSON.stringify(result, null, 2));
}

function toUnixUtc(ymd) {
	const [y, m, d] = ymd.split('-').map((x) => Number.parseInt(x, 10));
	if (!y || !m || !d) throw new Error('Invalid date');
	return Math.floor(Date.UTC(y, m - 1, d) / 1000);
}

module.exports = { scheduleAdvanceInvoice };
