//Author: ANGEL43V3R - added a script to reset the database and then repopulate it.
/**
 * Author: ANGEL43V3R
 * 
 * This script resets the test database (oed_testing) by dropping and recreating the test database.
 * It then uses generateTestingData to populate the table using generateSine function.
 */

console.log('PGPASSWORD:', typeof process.env.PGPASSWORD, process.env.PGPASSWORD);


const { Client } = require('pg');
const { generateSine } = require('../data/generateTestingData');

//Admin configuration to connect to the Postgres database
//NOTE: if want to run the test locally change host: 'database' to 'localhost'
const adminConfig = {
    user: process.env.OED_DB_USER,
    host: process.env.OED_DB_HOST,
    database: 'postgres',
    password: process.env.OED_DB_PASSWORD,
    port: process.env.OED_DB_PORT,
};

//Test configuration to connect to the test database (oed_testing) 
//NOTE: if want to run the test locally change host: 'database' to 'localhost'
const testDbConfig = {
    user: process.env.OED_DB_USER,
    host: process.env.OED_DB_HOST,
    database: process.env.OED_DB_TEST_DATABASE,
    password: process.env.OED_DB_PASSWORD,
    port:  process.env.OED_DB_PORT,
};

/**
 * Drops and recreates the oed_testing database
 */
async function resetTestDatabase() {
    const client = new Client(adminConfig);
    await client.connect();

    try {
        console.log('Dropping test database (if exists)...')
        await client.query('DROP DATABASE IF EXISTS oed_testing;');

        console.log('Recreating the test database...')
        await client.query('CREATE DATABASE oed_testing WITH OWNER oed;');
        console.log('Test database reset successfully!');
    } catch (err) {
        console.error('Error found during database reset: ', err);
        throw err;
    } finally {
        await client.end();
    }
}

/**
 * Create table and insert generated test data 
 */
async function insertTestData() {
    const client = new Client(testDbConfig);
    await client.connect();

    try {
        //Create database tables
        await client.query(
            `
            CREATE TABLE IF NOT EXISTS sine_data (
            id SERIAL PRIMARY KEY,
            value DOUBLE PRECISION NOT NULL,
            start_timestamp TIMESTAMP NOT NULL,
            end_timestamp TIMESTAMP NOT NULL
            );
            `
        );

        // Generate sine data sample
        console.log ('Generating the sine test data...')
        const sineData = generateSine(
            '2025-01-01 00:00:00', 
            '2025-01-02 00:00:00', 
            { 
                timeStep: {hour: 1 }, 
                maxAmplitude: 10
            }
        );

        //Check if sine data is an array or if array is empty
        if (!Array.isArray(sineData) || sineData.length === 0) {
            throw new Error ('Invalid sine data, no sine data generated!')
        }


        //Insert generated data in rows
        console.log (`Inserting ${sineData.length} rows of test data...`)
        for (const row of sineData) {
            await client.query(
                'INSERT INTO sine_data (value, start_timestamp, end_timestamp) VALUES ($1, $2, $3)',
                [row.value, row.startTimeStamp, row.endTimeStamp]
            );
        }

        //Verifying by running a sample query
        const res = await client.query('SELECT COUNT(*) FROM sine_data;');
        console.log('Inserted rows of sine data successfully! Total rows of sine data:', res.rows[0].count);
    } finally {
        await client.end();
    }
}

/**
 * Main function - resets and repopulate the database
 */
async function main() {
    try {
        console.log('Starting database reset...')
        await resetTestDatabase();
        console.log('Inserting test data...')
        await insertTestData();
        console.log('Finished generating the test data!');
    } catch (err) {
        console.error('Error during test setup:', err);
    }
    process.exit(0);
}

main();