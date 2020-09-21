/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { createSchema } = require('../models/database');
const { log } = require('../log');
const { getConnection, dropConnection } = require('../db');
(async function createSchemaWrapper() {
	console.log("DEBUG: about to do getConnection");
	const conn = getConnection();
	console.log("DEBUG: about to check conn....")
	await conn.connect()
    .then(obj => {
		// dumps the entire object if want to see what is inside.
		// console.log("DEBUG: begin obj.client");
		// console.log(obj.client);
		// This only works if you make pg-promise 10.1.0 or later. I have tested with 10.2.0 and works with OED.
		console.log(`DEBUG: serverVersion: ` + obj.client.serverVersion);
		console.log(`DEBUG: readyForQuery: ` + obj.client.readyForQuery);
       obj.done(); // success, release the connection;
    })
    .catch(error => {
        console.log('DEBUG ERROR in connect:', error.message || error);
});
// begin DEBUG
	// for (i = 0; i < 10; i++) {
		// console.log("DEBUG: about to check conn....")
		// await conn.func('version')
		// .then(data => {
		// 	// SUCCESS
		// 	console.log("postgres version is: " + data.version);
		// 	// console.log("DEBUG: check server version: ", conn.func('version'));
		// 	process.exit(99);
		// })
		// .catch(error => {
		// 	// connection-related error
		// 	console.log("DEBUG: conn.func generated error: ", error);
		// });
		// const c = await conn.connect(); // try to connect
		// console.log("DEBUG: 10");
		// c.done(); // success, release connection
		// console.log("DEBUG: 20");
		// return c.client.serverVersion; // return server version
		// console.log("DEBUG: 30");
	// };
// end DEBUG
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
		console.log("DEBUG: about to check conn in finally of createDB....")
		await conn.connect()
		.then(obj => {
			// dumps the entire object if want to see what is inside.
			// console.log("DEBUG: begin obj.client");
			// console.log(obj.client);
			console.log(`DEBUG: serverVersion: ` + obj.client.serverVersion);
			console.log(`DEBUG: readyForQuery: ` + obj.client.readyForQuery);
		   obj.done(); // success, release the connection;
		})
		.catch(error => {
			console.log('DEBUG ERROR in connect:', error.message || error);
	});
		dropConnection();
		console.log("DEBUG: about to check conn after drop....")
		await conn.connect()
		.then(obj => {
			// dumps the entire object if want to see what is inside.
			// console.log("DEBUG: begin obj.client");
			// console.log(obj.client);
			console.log(`DEBUG: serverVersion: ` + obj.client.serverVersion);
			console.log(`DEBUG: readyForQuery: ` + obj.client.readyForQuery);
		   obj.done(); // success, release the connection;
		})
		.catch(error => {
			console.log('DEBUG ERROR in connect:', error.message || error);
	});
	}
}());

