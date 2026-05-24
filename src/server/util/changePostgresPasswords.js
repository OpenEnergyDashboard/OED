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
// The minimum length password that is considered acceptable.
const MIN_PASSWORD_LENGTH = 12;
// Default postgres password - must match value in the unedited docker-compose.yml file.
const DEFAULT_POSTGRES_PASSWORD = 'pleaseChange';
// Default OED database password - must match value in the unedited docker-compose.yml file.
const DEFAULT_OED_DB__PASSWORD = 'opened';

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

/**
 * If the password would change, checks the proposedPassword and replaces if not acceptable.
 * @param currentPassword The current password before this possible change (string)
 * @param proposedPassword The password that was sent to be used (string)
 * @param defaultPassword The default password that cannot be used (string)
 * @param whatPassword Describes what password is being checked (string)
 * @param productionInstall If this was called from an OED version running production. (boolean)
 * @returns If the password was changed (replacedPassword) and the password that is acceptable to use (usePassword).
 * If the proposedPassword is okay then it is used and replacedPassword is false; otherwise it is replaced
 * with a secure one and replacedPassword is true. ({ replacedPassword, usePassword })
 */
function acceptablePassword(currentPassword, proposedPassword, defaultPassword, whatPassword, productionInstall) {
	console.log('currentPassword, proposedPassword, defaultPassword, whatPassword, productionInstall: ',
		currentPassword, proposedPassword, defaultPassword, whatPassword, productionInstall);
	// True if should replace the proposed password with a secure one.
	let replacePassword;
	// True if the password should be updated. Only false if same as current one so make it true here.
	let updatePassword = true;
	if (productionInstall && proposedPassword === defaultPassword) {
		// Cannot use the default password under any circumstance if in production.
		console.log('');
		console.log('The new Postgres password for ' + whatPassword + ' is the default one.');
		console.log('As a result, it will be replace with a secure password.');
		console.log('');
		replacePassword = true;
	} else if (productionInstall && proposedPassword.length < MIN_PASSWORD_LENGTH) {
		// TODO OED is planning to implement password quality checks. When that is available, the above
		// if should be switched to that since length isn't the best security.
		// The password is not secure enough if in production mode.
		console.log('');
		console.log('The new Postgres password for ' + whatPassword +
			' that would be used is not secure because it is shorter than the minimum length of ' + MIN_PASSWORD_LENGTH + '.');
		console.log('As a result, it will be replaced with a secure password.');
		console.log('');
		replacePassword = true;
	} else if (currentPassword === proposedPassword) {
		console.log('same');
		// Password is the same so will not change.
		replacePassword = false;
		updatePassword = false;
	} else {
		// It seems acceptable so do not need to update.
		replacePassword = false;
	}

	// The password that should be used.
	let usePassword;
	if (replacePassword) {
		// Use a secure one since current needs to be replaced.
		usePassword = generatePassword();
	} else {
		// Proposed one is okay. Note it will not be used if not being replaced.
		usePassword = proposedPassword;
	}

	return { updatePassword, usePassword };
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
	console.log('\n.env updated with new/current PostgreSQL and OED passwords');
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
async function changePostgresPasswords() {
	console.log('process.argv: ', process.argv);
	console.log('process.argv[1]: ', process.argv[1]);
	console.log('process.argv[2]: ', process.argv[2]);
	console.log('process.argv[3]: ', process.argv[3]);
	// The proposed, new postgres password or empty so will get replaced.
	const proposedPostgresPassword = process.argv[1] || 'empty';
	// The proposed, new OED database password or empty so will get replaced.
	const proposedOedDbPassword = process.argv[2] || 'empty';
	// Determine context: 'install' (automatic, no restart needed) or 'manual' (script, restart needed).
	// Note if empty then will be manual which is needed since this argument is not normally present in that case.
	const isManual = process.argv[3] !== 'install';

	const fileEnv = parseEnvFile(ENV_PATH);
	// Is this a production install. First get from the environment variable.
	let productionInstall = process.env.OED_PRODUCTION !== 'yes';
	if (!isManual && process.argv[4] === 'production') {
		// This is from an OED install so the extra variable exists. It might be that the install had
		// the production switch set so need to use that instead of the environment variable value.
		productionInstall = true;
	}

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

	// TODO why is this needed given it has the currentPostgresPassword setting below with ||?????
	// Prefer the most recent passwords from the .env file over process.env which may be outdated
	if (fileEnv.POSTGRES_PASSWORD) {
		process.env.POSTGRES_PASSWORD = fileEnv.POSTGRES_PASSWORD;
	}
	// TODO is this used???
	if (fileEnv.OED_DB_PASSWORD) {
		process.env.OED_DB_PASSWORD = fileEnv.OED_DB_PASSWORD;
	}

	// For Postgres password.
	// If no value for .env nor process env then set to default password so it is updated.
	const currentPostgresPassword = fileEnv.POSTGRES_PASSWORD || process.env.POSTGRES_PASSWORD || DEFAULT_POSTGRES_PASSWORD;
	console.log('currentPostgresPassword: ', currentPostgresPassword);
	// Check and replace password as needed for Postgres which is in argv[2] when this is called.
	// It can be empty as it will be replaced in that case.
	const { updatePassword: updatePostgresPassword, usePassword: newPostgresPassword } =
		acceptablePassword(currentPostgresPassword, proposedPostgresPassword, DEFAULT_POSTGRES_PASSWORD, 'Postgres', productionInstall);
	console.log('newPostgresPassword: ', newPostgresPassword, 'updatePostgresPassword: ', updatePostgresPassword);

	// For OED DB password.
	// If no value for .env nor process env then set to default password so it is updated.
	const currentOedDbPassword = fileEnv.OED_DB_PASSWORD || process.env.OED_DB_PASSWORD || DEFAULT_OED_DB__PASSWORD;
	console.log('currentOedDbPassword: ', currentOedDbPassword);
	// Check and replace password as needed for OED DB user which is in argv[3] when this is called.
	// It can be empty as it will be replaced in that case.
	const { updatePassword: updateOedDbPassword, usePassword: newOedDbPassword } =
		acceptablePassword(currentOedDbPassword, proposedOedDbPassword, DEFAULT_OED_DB__PASSWORD, 'OED DB', productionInstall);
	console.log('newOedDbPassword: ', newOedDbPassword, 'updateOedDbPassword: ', updateOedDbPassword);

	// Only try to update if one of the passwords changed.
	if (updatePostgresPassword || updateOedDbPassword) {
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

				// TODO Maybe needs to be a transaction because if you change the postgres password but retry
				// for OED then it cannot log in again. Note sure if will happen or not.
				// Note if this is a retry then this might have been set a previous time.
				// It is easier to just set again.
				if (updatePostgresPassword) {
					// Postgres password needs replacing.
					const sqlPostgres = `ALTER USER postgres WITH PASSWORD '${escapePassword(newPostgresPassword)}'`;
					await client.query(sqlPostgres);
				}
				if (updateOedDbPassword) {
					// OED DB password needs replacing.
					const sqlOED = `ALTER USER oed WITH PASSWORD '${escapePassword(newOedDbPassword)}'`;
					await client.query(sqlOED);
				}

				await client.end();

				// This writes both passwords even if it one was not changed to make sure both are
				// stored in the .env to be consistent. Not a big deal to write even if not changed.
				updateEnvFile(newPostgresPassword, newOedDbPassword);

				console.log('********************************************************************************');
				if (updatePostgresPassword) {
					console.log('PostgreSQL password changed and applied successfully.');
				}
				if (updateOedDbPassword) {
					console.log('OED database password changed and applied successfully.');
				}
				console.log('The passwords have been stored in ".env" for reference including unchanged ones.');
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
				await client.end().catch(() => { });

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
}

module.exports = { changePostgresPasswords };
