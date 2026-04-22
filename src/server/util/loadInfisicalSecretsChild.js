/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { InfisicalSDK } = require('@infisical/sdk');

const env = process.env;
// Required Infisical configuration values for vault access
// Need to be set in .env for Infisical support to work
const clientId = env.INFISICAL_CLIENT_ID;
const clientSecret = env.INFISICAL_CLIENT_SECRET;
const siteUrl = env.INFISICAL_SITE_URL || 'https://app.infisical.com';
const projectId = env.INFISICAL_PROJECT_ID;
const environment = env.INFISICAL_ENVIRONMENT || 'dev';
const secretPath = env.INFISICAL_PATH || '/';

if (!clientId || !clientSecret) {
	console.error('PASSWORD_VAULT is enabled but INFISICAL_CLIENT_ID or INFISICAL_CLIENT_SECRET is not set in the .env file.');
	process.exit(1);
}

if (!projectId) {
	console.error('PASSWORD_VAULT is enabled but INFISICAL_PROJECT_ID is not set in the .env file.');
	process.exit(1);
}

(async () => {
	try {
		const client = new InfisicalSDK({ siteUrl });

		// Authenticate using machine identity credentials to get secrets from vault
		await client.auth().universalAuth.login({ clientId, clientSecret });

		async function loadSecret(name) {
			try {
				const result = await client.secrets().getSecret({
					environment,
					projectId,
					secretName: name,
					secretPath,
					type: 'shared'
				});
				return result?.secretValue;
			} catch (err) {
				// Missing secrets are treated as optional overrides
				return undefined;
			}
		}

		const [postgresPassword, oedDbPassword] = await Promise.all([
			loadSecret('POSTGRES_PASSWORD'),
			loadSecret('OED_DB_PASSWORD')
		]);

		const payload = {
			POSTGRES_PASSWORD: postgresPassword,
			OED_DB_PASSWORD: oedDbPassword
		};
		process.stdout.write(JSON.stringify(payload));
		process.exit(0);
	} catch (err) {
		console.error('Infisical vault loading error:', err.message);
		process.exit(1);
	}
})();
