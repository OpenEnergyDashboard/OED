/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { defineConfig } from 'cypress';

export default defineConfig({
	e2e: {
		setupNodeEvents(on, config) {
			// implement node event listeners here
			on("task", {
				log(args) {
					console.log(...args);
					return null;
				}
			});
		},
		specPattern: 'src/cypress/e2e/*.cy.ts',
		supportFile: 'src/cypress/support/e2e.ts',
		screenshotsFolder: 'src/cypress/screenshots/e2e'
	}
});
