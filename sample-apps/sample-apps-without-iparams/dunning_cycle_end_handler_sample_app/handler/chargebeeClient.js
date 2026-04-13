'use strict';

/**
 * Chargebee Node SDK client for this app.
 */
const Chargebee = require('chargebee');

/**
 * Hardcoded as this app is created using `serverless-node-starter-app`. For configurable API host, use `serverless-node-starter-app-with-iparams` and read the value from iparams.
 */
const API_HOST_SUFFIX = '.devcb.in';

function createChargebeeClient() {
	// These are injected automatically in production; for local development use `.env`.
	const site = String(process.env['MKPLC_SITE_DOMAIN'] || '').trim();
	const apiKey = process.env['MKPLC_CB_READ_WRITE_API'];
	if (!site || !apiKey) {
		throw new Error('Missing MKPLC_SITE_DOMAIN or MKPLC_CB_READ_WRITE_API');
	}
	return new Chargebee({
		site,
		apiKey,
		hostSuffix: API_HOST_SUFFIX,
	});
}

module.exports = { createChargebeeClient };
