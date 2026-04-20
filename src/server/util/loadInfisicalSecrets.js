/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const childProcess = require('child_process');
const path = require('path');

function loadInfisicalSecretsSync() {
    // Keep vault support opt-in so default setups continue to use local .env values.
    const vaultEnabled = /^(true|yes|1)$/i.test(process.env.PASSWORD_VAULT || 'no');
    if (!vaultEnabled) {
        return;
    }

    // Ensure @infisical/sdk is installed (it is an optional dependency not bundled by default)
    try {
        require.resolve('@infisical/sdk');
    } catch (e) {
        console.error('PASSWORD_VAULT is enabled but @infisical/sdk is not installed. Run: npm install @infisical/sdk');
        process.exit(1);
    }

    const scriptPath = path.resolve(__dirname, 'loadInfisicalSecretsChild.js');
    try {
        // Fetch secrets in a child process so this call remains synchronous for startup.
        const output = childProcess.execFileSync(
            process.execPath,
            [scriptPath],
            {
                env: process.env,
                encoding: 'utf8',
                timeout: 15000,
                stdio: ['ignore', 'pipe', 'pipe']
            }
        );

        let secretValues;
        try {
            secretValues = JSON.parse(output);
        } catch (parseErr) {
            throw new Error(`Failed to parse Infisical response: ${parseErr.message}`);
        }

        // Only overwrite password variables when a secret is returned from Infisical.
        if (secretValues.POSTGRES_PASSWORD) {
            process.env.POSTGRES_PASSWORD = secretValues.POSTGRES_PASSWORD;
        }
        if (secretValues.OED_DB_PASSWORD) {
            process.env.OED_DB_PASSWORD = secretValues.OED_DB_PASSWORD;
        }
    } catch (err) {
        console.error(`Infisical secret loading failed: ${err.message}`);
        process.exit(1);
    }
}

module.exports = loadInfisicalSecretsSync;
