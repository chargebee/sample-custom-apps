'use strict';

const { createChargebeeClient } = require('./chargebeeClient');

/**
 * @param {import('../types/types.d.ts').HandlerPayload} payload
 */
async function scheduleAdvanceInvoice(payload) {
	const eventContent = payload.event.content;
	const apiConfig = payload.iparams.chargebee_api_configuration;
	const invoiceConfig = payload.iparams.advance_invoice_configuration;
	const chargebee = createChargebeeClient(apiConfig.api_host_suffix);
	const selectedScheduleType = invoiceConfig.schedule_type;

	if (selectedScheduleType === 'specific' && !invoiceConfig.specific_invoice_date) {
		throw new Error('specific_invoice_date is required when schedule_type is specific');
	}

	let params;
	if (selectedScheduleType === 'fixed') {
		params = {
			schedule_type: 'fixed_intervals',
			terms_to_charge: invoiceConfig.terms_to_charge,
			fixed_interval_schedule: {
				days_before_renewal: invoiceConfig.days_before_renewal,
				end_schedule_on: 'subscription_end',
			},
		};
	} else if (selectedScheduleType === 'specific') {
		params = {
			schedule_type: 'specific_dates',
			specific_dates_schedule: [
				{
					date: toUnixUtc(invoiceConfig.specific_invoice_date),
					terms_to_charge: invoiceConfig.terms_to_charge,
				},
			],
		};
	}

	let result;
	try {
		result = await chargebee.subscription.chargeFutureRenewals(eventContent.subscription.id, params);
	} catch (err) {
		const status = err.http_status_code;
		if (typeof status === 'number' && status >= 400 && status < 500) {
			console.error('Chargebee API 4xx (advance invoice not scheduled):', {
				http_status_code: status,
				api_error_code: err.api_error_code,
				message: err.message,
				subscription_id: eventContent.subscription.id,
			});
			return;
		}
		throw err;
	}
	console.log('Advance invoice scheduled:', JSON.stringify(result, null, 2));
}

function toUnixUtc(ymd) {
	const [y, m, d] = ymd.split('-').map((x) => Number.parseInt(x, 10));
	if (!y || !m || !d) throw new Error('Invalid date');
	return Math.floor(Date.UTC(y, m - 1, d) / 1000);
}

module.exports = { scheduleAdvanceInvoice };
