const { createSchema, pgp } = require('../server/models/database');

createSchema()
	.then(() => {
		console.log('Schema created');
	})
	.catch(err => {
		console.error('Error creating schema');
		console.error(err);
	})
	.then(() => pgp.end());
