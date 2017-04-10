/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
// Try to load the .env file

const envPath = path.join(__dirname, '..', '..', '.env');
try {
	fs.accessSync(envPath);
	dotenv.config({ path: envPath });
} catch (err) {
	console.log("Couldn't load a .env file");
}


const config = {};

// Database configuration is taken from environment variables (which are loaded by dotenv from the .env file)
config.database = {
	user: process.env.DB_USER,
	database: process.env.DB_DATABASE,
	password: process.env.DB_PASSWORD,
	host: process.env.DB_HOST,
	port: process.env.DB_PORT
};

config.secretToken = process.env.TOKEN_SECRET;
config.serverPort = process.env.SERVER_PORT;

module.exports = config;
