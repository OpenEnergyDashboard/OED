/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { Client } = require('pg');

function escapePassword(password) {
	return password.replace(/'/g, "''");
}

// Create a connection to the Postgres database and send the query to change the user's password
async function changePassword() {
	const newPassword = process.argv[2];
	console.log('Attempting to change postgres user password...');
	// Connect using the default password and the postgres user
	const client = new Client({
		host: process.env.OED_DB_HOST,
		port: parseInt(process.env.OED_DB_PORT),
		user: 'postgres',
		password: 'pleaseChange',
		database: 'postgres',
		connectionTimeoutMillis: 10000
	});

	// Send the query to change the user's password to the secure one from the default
	try {
		await client.connect();
		
		const sql = `ALTER USER postgres WITH PASSWORD '${escapePassword(newPassword)}'`;
		await client.query(sql);
		
		console.log('Password changed successfully');
		await client.end();
		
	} catch (error) {
		console.error('Error during Postgres password change:', error.message);
		
		if (error.message.includes('ECONNREFUSED')) {
			console.error('Database is not accepting connections yet.');
		} else if (error.message.includes('password authentication')) {
			console.error('Authentication failed. Current password may be incorrect.');
		}
		
		throw error;
	}
}

// Wait for database to be ready
setTimeout(async () => {
	try {
		await changePassword();
		console.log('Password change completed');
		process.exit(0);
	} catch (error) {
		console.error('Failed to change password');
		process.exit(1);
	}
}, 10000);