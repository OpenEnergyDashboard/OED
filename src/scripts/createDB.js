/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { createSchema, pgp } = require('../server/models/database');

(async function createSchemaWrapper() {
	try {
		await createSchema();
		console.log('Schema created');
	} catch (err) {
		console.error(`Error creating schema: ${err}`);
	} finally {
		pgp.end();
	}
}());
