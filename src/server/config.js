const path = require('path');

// Load .env configuration
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

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
