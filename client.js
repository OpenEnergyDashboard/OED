/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { Client } = require('pg');

const pgclient = new Client({
	host: process.env.POSTGRES_HOST,
	port: process.env.POSTGRES_PORT,
	user: 'postgres',
	password: process.env.POSTGRES_PASSWORD,
	database: process.env.OED_DB_TEST_DATABASE
});

/* New Code for setting up the Test Database! */
async function setupDatabase() {
	await pgclient.connect();

	await pgclient.query(`CREATE USER ${process.env.OED_DB_USER} WITH PASSWORD '${process.env.OED_DB_PASSWORD}'`);
	await pgclient.query(`ALTER USER ${process.env.OED_DB_USER} WITH SUPERUSER`);

	await pgclient.query(
		`CREATE USER ${process.env.OED_DB_TEST_USER} WITH NOSUPERUSER NOCREATEDB NOCREATEROLE ` +
		`PASSWORD '${process.env.OED_DB_TEST_PASSWORD}'`
	);

	await pgclient.query(`ALTER DATABASE ${process.env.OED_DB_TEST_DATABASE} OWNER TO ${process.env.OED_DB_TEST_USER}`);

	await pgclient.query('CREATE EXTENSION IF NOT EXISTS btree_gist');

	await pgclient.end();
}

setupDatabase().catch(err => {
	console.error(err);
	process.exit(1);
});
