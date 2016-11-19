const pgp = require('pg-promise')();
const path = require('path');
require('dotenv').config({path: path.join(__dirname, '..', '.env')});

// Database configuration
const config = {
    user: process.env.DB_USER,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT
};

const db = pgp(config);

module.exports = db;