/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { createSchema } = require('../models/database');
const { log } = require('../log');
const { getConnection, dropConnection } = require('../db');
(async function createSchemaWrapper() {
	console.log("DEBUG: about to do getConnection");
	const conn = getConnection();
	try {
		console.log("DEBUG: begin createSchema in createDB.js");
		await createSchema(conn);
		console.log("DEBUG: finish createSchema in createDB.js");
		log.info('Schema created', skipMail = true);
		process.exitCode = 0;
	} catch (err) {
		// Should we really catch all errors and then allow the code to continue?? TODO
		console.log(`DEBUG: in err clause createSchema in createDB.js with err/stack: ${err.stack}: end err/stack`);
		log.error(`Error creating schema: ${err}`, err, skipMail = true);
		process.exitCode = 1;
	} finally {
		console.log("DEBUG: in finally clause createSchema in createDB.js");
		dropConnection();
	}
}());

