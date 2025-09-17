/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { defineConfig } from 'cypress';
import { exec } from 'child_process';

export default defineConfig({
	e2e: {
		baseUrl: 'http://localhost:3000', //ANGEL43V3R DEBUG LINE ADDED
		setupNodeEvents(on, config) {
			// implement node event listeners here
			on('task', {
				resetDatabase() {
					return new Promise((resolve, reject) => {
						let output = '';
						
						const child = exec('docker exec oed-web-1 node src/server/util/resetDatabase.js', { env: process.env});

						child.stdout?.on('data', (data) => {
							output += data;
						});

						child.stderr?.on('data', (data) => {
							output += data;
						});

						child.on('close', (code) => {
							if (code === 0) {
								resolve(output);
							}else {
								reject(new Error(`Process exited with code ${code}: ${output}`));
							}
						});

						child.on('error', (err) => {
							reject(err);
						});

					});
				},
			});

			//return config to modify it
			return config;
		},
		specPattern: 'src/cypress/e2e/*.cy.ts',
		supportFile: 'src/cypress/support/e2e.ts',
		screenshotsFolder: 'src/cypress/screenshots/e2e'
	},
});
