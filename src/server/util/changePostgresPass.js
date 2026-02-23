/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { Client } = require('pg');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const config = require('../config');

const ENV_PATH = path.resolve('.env');

// Generate a secure random password
function generatePassword() {
	return crypto.randomBytes(18).toString('base64');
}

// Escape single quotes in password for SQL
function escapePassword(password) {
	return password.replace(/'/g, "''");
}

// Update .env with PostgreSQL and OED user passwords
function updateEnvFile(postgresPassword, oedPassword) {
	let env = '';

	// Reading current .env contents if it exists
	if (fs.existsSync(ENV_PATH)) {
		env = fs.readFileSync(ENV_PATH, 'utf8');
	}

	// Updating the postgres password if it exists, else appending it instead
	if (/^POSTGRES_PASSWORD=/m.test(env)) {
		env = env.replace(/^POSTGRES_PASSWORD=.*/m, `POSTGRES_PASSWORD=${postgresPassword}`);
	} else {
		env = env.trimEnd() + `\nPOSTGRES_PASSWORD=${postgresPassword}\n`;
	}

	// Updating the oed user password if it exists, else appending it instead
	if (/^OED_DB_PASSWORD=/m.test(env)) {
		env = env.replace(/^OED_DB_PASSWORD=.*/m, `OED_DB_PASSWORD=${oedPassword}`);
	} else {
		env = env.trimEnd() + `\nOED_DB_PASSWORD=${oedPassword}\n`;
	}

	// Writing new passwords to .env or creating it if it doesn't exist yet
	fs.writeFileSync(ENV_PATH, env, { mode: 0o600 });
	config.database.password = oedPassword;
	console.log('.env updated with new PostgreSQL and OED passwords');
}

async function changePasswords() {
	const postgresPassword = process.argv[2] || generatePassword();
	const oedPassword = process.argv[3] || generatePassword();

	// Connect as superuser
	const client = new Client({
		host: process.env.OED_DB_HOST || 'database',
		port: parseInt(process.env.OED_DB_PORT || '5432', 10),
		user: 'postgres',
		password: process.env.POSTGRES_PASSWORD || 'pleaseChange',
		database: 'postgres',
		connectionTimeoutMillis: 10000
	});

	try {
		await client.connect();

		// Update postgres password
		const sqlPostgres = `ALTER USER postgres WITH PASSWORD '${escapePassword(postgresPassword)}'`;
		await client.query(sqlPostgres);

		// Update oed password to match
		const sqlOED = `ALTER USER oed WITH PASSWORD '${escapePassword(oedPassword)}'`;
		await client.query(sqlOED);

		await client.end();

		// Update .env file
		updateEnvFile(postgresPassword, oedPassword);

		console.log('********************************************************************************');
		console.log('Generated a secure PostgreSQL and OED password and applied them successfully.');
		console.log('The passwords have been stored in ".env" for reference.');
		console.log('In order for OED to connect to the database a restart is required after installation is complete.')
		console.log('********************************************************************************\n');

		process.exit(0);

	} catch (error) {
		console.error('Error changing PostgreSQL or OED password:', error.message);

		if (error.message.includes('ECONNREFUSED')) {
			console.error('Database is not accepting connections yet.');
		} else if (error.message.includes('password authentication')) {
			console.error('Authentication failed — default password may already be changed.');
		}

		process.exit(1);
	}
}

// Wait for Postgres to be ready
setTimeout(changePasswords, 10000);
module.exports = { changePasswords };