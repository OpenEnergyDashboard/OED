/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 //
 const promisify = require('es6-promisify');
 const csv = require('csv');
 const parseCsv = promisify(csv.parse);
 const { generateSine } = require('../data/generateTestingData');


 // Generates automated testing data over a one year period (for the whole year of 2020) at 4 day intervals.
async function generateFourDayTestingData() {
    const startDate = '2020-01-01 00:00:00';
    const endDate = '2020-12-31 23:59:59';
    const options = {
        timeStep: { day: 4}, // Data point intervals set to 4 days.
        periodLength: { month: 1.5 },
        maxAmplitude: 3,
        filename: `${__dirname}/../test/db/data/automatedTests/fourDayFreqTestData.csv` // Data saved in 'fourDayFreqTestData.csv' file.
    }
    await generateSine(startDate, endDate, options);
}


// Generates automated testing data over a one year period (for the whole year of 2020) at 4 hour intervals.
 async function generateFourHourTestingData() {
    const startDate = '2020-01-01 00:00:00';
    const endDate = '2020-12-31 23:59:59';
    const options = {
        timeStep: { hour: 4}, // Data point intervals set to 4 hours.
        periodLength: { month: 1.5 },
        maxAmplitude: 3,
        filename: `${__dirname}/../test/db/data/automatedTests/fourHourFreqTestData.csv` // Data saved in 'fourHourFreqTestData.csv' file.
    }
    await generateSine(startDate, endDate, options);
}


// Generates automated testing data over a one year period (for the whole year of 2020) at 23 minute intervals
async function generateTwentyThreeMinuteTestingData() {
    const startDate = '2020-01-01 00:00:00';
    const endDate = '2020-12-31 23:59:59';
    const options = {
        timeStep: { minute: 23}, // Data point intervals set to 23 minutes
        periodLength: { month: 1.5 },
        maxAmplitude: 3,
        filename: `${__dirname}/../test/db/data/automatedTests/twentyThreeMinuteFreqTestData.csv` // Data saved in 'twentyThreeMinuteFreqTestData.csv' file.
    }
    await generateSine(startDate, endDate, options);
}


// Generates automated testing data over a one year period (for the whole year of 2020) at 15 minute intervals
async function generateFifteenMinuteTestingData() {
    const startDate = '2020-01-01 00:00:00';
    const endDate = '2020-12-31 23:59:59';
    const options = {
        timeStep: { minute: 15}, // Data point intervals set to 15 minutes
        periodLength: { month: 1.5 },
        maxAmplitude: 3,
        filename: `${__dirname}/../test/db/data/automatedTests/fifteenMinuteFreqTestData.csv` // Data saved in 'fifteenMinuteFreqTestData.csv' file.
    }
    await generateSine(startDate, endDate, options);
}


// Generates automated testing data over a one year period (for the whole year of 2020) at 1 minute intervals
async function generateOneMinuteTestingData() {
    const startDate = '2020-01-01 00:00:00';
    const endDate = '2020-12-31 23:59:59';
    const options = {
        timeStep: { minute: 1}, // Data point intervals set to 1 minute
        periodLength: { month: 1.5 },
        maxAmplitude: 3,
        filename: `${__dirname}/../test/db/data/automatedTests/twentyThreeMinuteFreqTestData.csv` // Data saved in 'oneMinuteFreqTestData.csv' file.
    }
    await generateSine(startDate, endDate, options);
}

module.exports = {
    generateFourDayTestingData,
    generateFourHourTestingData,
    generateTwentyThreeMinuteTestingData,
    generateFifteenMinuteTestingData,
    generateOneMinuteTestingData
};