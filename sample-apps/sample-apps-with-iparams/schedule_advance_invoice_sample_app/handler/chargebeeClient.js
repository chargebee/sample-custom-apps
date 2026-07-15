'use strict';

/**
 * Chargebee Node SDK client for this app.
 * Host suffix comes from iparams (`chargebee_api_configuration.api_host_suffix`).
 */
const Chargebee = require('chargebee');

/**
 * @param {string} site
 * @param {string} apiKey
 * @param {string} hostSuffix
 */
function createChargebeeClient(site, apiKey, hostSuffix) {
	if (!site || !apiKey) throw new Error('Missing CB_APPS_SITE_DOMAIN or CB_APPS_READ_WRITE_API');
	return new Chargebee({ site, apiKey, hostSuffix });
}

module.exports = { createChargebeeClient };
