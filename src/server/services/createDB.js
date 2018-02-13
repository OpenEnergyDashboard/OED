/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { createSchema, pgp } = require('../models/database');
const { log } = require('../log');

(async function createSchemaWrapper() {
	try {
		await createSchema();
		log.info('Schema created');
	} catch (err) {
		log.error(`Error creating schema: ${err}`, err);
	} finally {
		pgp.end();
	}
}());
