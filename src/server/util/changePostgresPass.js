/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { Client } = require('pg');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
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
	return crypto.randomBytes(32).toString('base64');
}

// Escape single quotes in password for SQL
function escapePassword(password) {
	return password.replace(/'/g, "''");
}

// Prompt the user for an explicit yes/no confirmation
function promptConfirmation(promptText) {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	return new Promise((resolve) => {
		rl.question(`${promptText} `, (answer) => {
			rl.close();
			resolve(answer.trim().toLowerCase() === 'yes');
		});
	});
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

	// Writing new passwords to .env or creating it if it doesn't exist yet, only allowing the current user to read and write
	fs.writeFileSync(ENV_PATH, env, { mode: 0o600 });
	console.log('.env updated with new PostgreSQL and OED passwords');
}

// Pause execution
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Detect retryable Postgres errors:
// 'tuple concurrently updated': row was modified by another transaction
// 40001 (serialization_failure): concurrent transaction conflict
// 55P03 (lock_not_available): couldn't acquire lock, may be freed soon
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

	// Determine context: 'install' (automatic, no restart needed) or 'manual' (script, restart needed)
	const isManual = process.argv[4] !== 'install';

	// Warn if manual invocation that all OED users will lose access until restart
	if (isManual) {
		console.error('');
		console.error('WARNING: This will change database passwords immediately.');
		console.error('All currently logged-in users will experience disconnections.');
		console.error('OED will not work for anyone until the server is restarted.');
		console.error('');

		const confirmed = await promptConfirmation('Do you want to continue? Type yes to proceed:');
		if (!confirmed) {
			console.error('Aborting password change. No changes were made.');
			process.exit(0);
		}
	}

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
			console.log('PostgreSQL and OED passwords applied successfully.');
			console.log(`PostgreSQL (postgres) password: ${newPostgresPassword}`);
			console.log(`OED user password: ${newOedPassword}`);
			console.log('The passwords have been stored in ".env" for reference.');
			if (isManual) {
				console.log('');
				console.log('CRITICAL: OED is now disconnected for all users.');
				console.log('You must restart OED immediately for it to function.');
				console.log('All active user sessions will be terminated.');
			} else {
				console.log('(Installation mode: restart not required)');
			}
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
				console.error('Authentication failed: default password may already be changed or password used is incorrect.');
			}

			process.exit(1);
		}
	}
}

if (require.main === module) {
	changePasswords();
}

module.exports = { changePasswords };