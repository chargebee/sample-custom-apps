'use strict';

/**
 * @param {import('../types/types.js').HandlerPayload} payload
 */
async function postLeadToCrm(payload) {
	const crmIntegration = payload.iparams.crm_integration;
	if (typeof crmIntegration.crm_webhook_url !== 'string' || !crmIntegration.crm_webhook_url.trim()) {
		throw new Error('crm_webhook_url iparam is required');
	}
	if (typeof crmIntegration.crm_auth_token !== 'string' || !crmIntegration.crm_auth_token.trim()) {
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
		'Authorization': `Bearer ${crmIntegration.crm_auth_token.trim()}`,
		'Content-Type': 'application/json'
	};
	const res = await fetch(crmIntegration.crm_webhook_url.trim(), { method: 'POST', headers, body: JSON.stringify(body) });
	const text = await res.text();
	if (!res.ok) {
		const err = new Error(`HubSpot contact create failed ${res.status}: ${text.slice(0, 500)}`);
		err.statusCode = res.status;
		throw err;
	}
	console.log('[crm-lead-sample] HubSpot contact create success; status=', res.status);
}

module.exports = { postLeadToCrm };
