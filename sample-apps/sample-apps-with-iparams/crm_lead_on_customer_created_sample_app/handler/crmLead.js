'use strict';

/**
 * @param {import('../types/types.js').HandlerPayload} payload
 */
async function postLeadToCrm(payload) {
	const iparams = payload.iparams;
	const url = iparams.crm_webhook_url;
	if (typeof url !== 'string' || !url.trim()) {
		throw new Error('crm_webhook_url iparam is required');
	}
	const token = iparams.crm_auth_token;
	if (typeof token !== 'string' || !token.trim()) {
		throw new Error('crm_auth_token iparam is required for HubSpot API');
	}
	const customerData = payload.event.content?.customer;
	const customer = customerData && typeof customerData === 'object' ? customerData : {};
	const body = {
		properties: {
			email: customer.email,
			firstname: customer.first_name,
			lastname: customer.last_name,
			company: customer.company,
			phone: customer.phone,
			lifecyclestage: 'lead',
		},
	};

	const headers = {
		'Authorization': `Bearer ${token.trim()}`,
		'Content-Type': 'application/json'
	};
	const res = await fetch(url.trim(), { method: 'POST', headers, body: JSON.stringify(body) });
	const text = await res.text();
	if (!res.ok) throw new Error(`HubSpot contact create failed ${res.status}: ${text.slice(0, 500)}`);
	console.log('[crm-lead-sample] HubSpot contact create success; status=', res.status);
}

module.exports = { postLeadToCrm };
