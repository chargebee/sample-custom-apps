'use strict';

/**
 * Chargebee Node SDK client for this app.
 * Host suffix comes from iparams (`api_host_suffix`) so tenants can target the correct Chargebee API host.
 */
const Chargebee = require('chargebee');

/** @param {string} hostSuffix */
function createChargebeeClient(hostSuffix) {
	const site = process.env['MKPLC_SITE_DOMAIN'];
	const apiKey = process.env['MKPLC_CB_READ_WRITE_API'];
	if (!site || !apiKey) throw new Error('Missing MKPLC_SITE_DOMAIN or MKPLC_CB_READ_WRITE_API');
	return new Chargebee({ site, apiKey, hostSuffix });
}

module.exports = { createChargebeeClient };
