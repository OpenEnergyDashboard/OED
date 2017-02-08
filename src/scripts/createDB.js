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
