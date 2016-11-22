const pgp = require('pg-promise')();

// Database configuration
const config = {
	user: 'capstone',
	database: 'capstone',
	password: 'guest', // server running in docker
	host: 'localhost',
	port: 5432,
};

const db = pgp(config);

module.exports = db;
