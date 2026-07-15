'use strict';

/**
 * Chargebee Node SDK client for this app.
 */
const Chargebee = require('chargebee');

/**
 * Hardcoded as this app is created using `serverless-node-starter-app`. For configurable API host, use `serverless-node-starter-app-with-iparams` and read the value from iparams.
 */
const API_HOST_SUFFIX = '.devcb.in';

/**
 * @param {string} site
 * @param {string} apiKey
 */
function createChargebeeClient(site, apiKey) {
	if (!site || !apiKey) {
		throw new Error('Missing CB_APPS_SITE_DOMAIN or CB_APPS_READ_WRITE_API');
	}
	return new Chargebee({
		site,
		apiKey,
		hostSuffix: API_HOST_SUFFIX,
	});
}

module.exports = { createChargebeeClient };
