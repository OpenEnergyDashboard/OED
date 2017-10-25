/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { createSchema, pgp } = require('../server/models/database');
const log = require('../server/log');

(async function createSchemaWrapper() {
	try {
		await createSchema();
		log('Schema created');
	} catch (err) {
		log(`Error creating schema: ${err}`, 'error');
	} finally {
		pgp.end();
	}
}());
