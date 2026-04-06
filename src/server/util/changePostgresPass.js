/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { Client } = require('pg');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const ROOT_ENV_PATH = path.resolve(__dirname, '..', '..', '..', '.env');
const CWD_ENV_PATH = path.resolve(process.cwd(), '.env');
const ENV_PATH = fs.existsSync(ROOT_ENV_PATH) ? ROOT_ENV_PATH : CWD_ENV_PATH;

// Load whichever .env file is available and override existing process vars
// so repeated invocations in one session can pick up the newest credentials.
if (fs.existsSync(ENV_PATH)) {
	dotenv.config({ path: ENV_PATH, override: true });
}

// Parse the shared .env file directly so we can prefer the most recent values
// when npm or Docker still has a stale environment variable.
function parseEnvFile(envPath) {
	if (!fs.existsSync(envPath)) {
		return {};
	}

	return dotenv.parse(fs.readFileSync(envPath, 'utf8'));
}

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
	console.log('.env updated with new PostgreSQL and OED passwords');
}

// Pause execution
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Detect retryable Postgres errors
function shouldRetryError(error) {
	return (
		error.message.includes('tuple concurrently updated') ||
		(error.code && (error.code === '40001' || error.code === '55P03'))
	);
}

// Change the database passwords for both the default postgres user and the OED user
// if this is done after the initial setup, OED must be restarted to get a connection with the server
async function changePasswords() {
	const fileEnv = parseEnvFile(ENV_PATH);

	// Prefer the most recent passwords from the .env file over process.env which may be outdated
	if (fileEnv.POSTGRES_PASSWORD) {
		process.env.POSTGRES_PASSWORD = fileEnv.POSTGRES_PASSWORD;
	}
	if (fileEnv.OED_DB_PASSWORD) {
		process.env.OED_DB_PASSWORD = fileEnv.OED_DB_PASSWORD;
	}

	// If arguments are included, treat them as the new passwords
	const currentPostgresPassword = fileEnv.POSTGRES_PASSWORD || process.env.POSTGRES_PASSWORD || 'pleaseChange';
	const newPostgresPassword = process.argv[2] || generatePassword();
	const newOedPassword = process.argv[3] || generatePassword();

	const clientConfig = {
		host: process.env.OED_DB_HOST || 'database',
		port: parseInt(process.env.OED_DB_PORT || '5432', 10),
		user: 'postgres',
		password: currentPostgresPassword,
		database: 'postgres',
		connectionTimeoutMillis: 10000
	};

	// Try the password update multiple times to handle transient lock error
	for (let attempt = 1; attempt <= 3; attempt += 1) {
		const client = new Client(clientConfig);

		try {
			await client.connect();

			const sqlPostgres = `ALTER USER postgres WITH PASSWORD '${escapePassword(newPostgresPassword)}'`;
			await client.query(sqlPostgres);

			const sqlOED = `ALTER USER oed WITH PASSWORD '${escapePassword(newOedPassword)}'`;
			await client.query(sqlOED);

			await client.end();

			updateEnvFile(newPostgresPassword, newOedPassword);

			console.log('********************************************************************************');
			console.log('Generated a secure PostgreSQL and OED password and applied them successfully.');
			console.log('The passwords have been stored in ".env" for reference.');
			console.log('If this was run manually, you will need to restart OED for the changes to take effect.');
			console.log('********************************************************************************\n');

			process.exit(0);
		} catch (error) {
			await client.end().catch(() => {});

			if (shouldRetryError(error) && attempt < 3) {
				console.error(`Transient Postgres error on attempt ${attempt}: ${error.message}`);
				console.error('Retrying password update...');
				await sleep(1000 * attempt);
				continue;
			}

			console.error('Error changing PostgreSQL or OED password:', error.message);

			if (error.message.includes('password authentication')) {
				console.error('Authentication failed: default password may already be changed.');
			}

			process.exit(1);
		}
	}
}

if (require.main === module) {
	changePasswords();
}

module.exports = { changePasswords };