/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


/**
 * This file contains a series of functions used to generate (at some point automated - hopefully) test data.
 */


const parseCsv = promisify(csv.parse);
const promisify = require('es6-promisify');
const csv = require('csv');
const { generateSine, generateCosine } = require('./testingDataFunctions');



/**
 * Generates sinusoidal automated testing data with a variable-length amplitude over a two year period (2020 to 2021, inclusive) and
 * then saves the data in an appropriately-named file under '../test/db/data/automatedTests/'.
 * @param {number} [frequency=15] - desired frequency of the sinusoidal test data in minutes.
 * @param {number} amplitude - desired amplitude of the sinusoidal test data.
 */
async function generateVariableSineTestingData(frequency = 15, amplitude) {
	const startDate = '2020-01-01 00:00:00';
	const endDate = '2021-12-31 23:59:59';
	const options = {
		timeStep: { minute: frequency },
		periodLength: { month: 1.5 }, // Wave period set to 1.5 months (See explanation below).
		maxAmplitude: amplitude,
		filename: `${__dirname}/../test/db/data/automatedTests/${amplitude}Amp_${frequency}MinFreq_TestData.csv`
	}
	await generateSine(startDate, endDate, options);
}


/**
 * Generates automated testing data as a series of cosine waves, as specified by frequency and amplitude parameters, over a two year period
 * (2020 to 2021, inclusive) and then saves the data in an appropriately-named file under '../test/db/data/automatedTests/'.
 * @param {number} [frequency=15] - desired frequency of the cosinusoidal test data, in minutes.
 * @param {number} amplitude - desired frequency of the cosinusoidal test data.
 */
async function generateVariableCosineTestingData(frequency = 15, amplitude) {
	const startDate = '2020-01-01 00:00:00';
	const endDate = '2021-12-31 23:59:59';
	const options = {
		timeStep: { minute: frequency },
		periodLength: { month: 1.5 }, // Wave period set to 1.5 months (See explanation below).
		maxAmplitude: amplitude,
		filename: `${__dirname}/../test/db/data/automatedTests/${amplitude}Amp_${frequency}MinFreq_TestData.csv`
	}
	await generateCosine(startDate, endDate, options);
}



/**
 * The following five functions each generate one year of sinusoidal testing data at pre-specified intervals. The data is then saved in an 
 * appropriately-named csv file under '../test/db/data/automatedTests/'.
 * 
 * The functions have the following specifications:
 *  - periodLength (the period of the cycles) is set to 1.5 months so that over 12 months, the data consists of 12 / 1.5 = 8 sinusoidal cycles.
 *  - maxAmplitude (the amplitude of the cycles) is set to 3 so that the vertical oscillation of the data is easily visible when graphed.
 * 
 * Please see the documentation for 'generateSine' under 'testingDataFunctions.js' for more details.
 */


// Generates automated testing data over a one year period (for the whole year of 2020) at 4 day intervals.
async function generateFourDayTestingData() {
	const startDate = '2020-01-01 00:00:00';
	const endDate = '2020-12-31 23:59:59';
	const options = {
		timeStep: { day: 4 }, // Data point intervals set to 4 days.
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
		timeStep: { hour: 4 }, // Data point intervals set to 4 hours.
		periodLength: { month: 1.5 },
		maxAmplitude: 3,
		filename: `${__dirname}/../test/db/data/automatedTests/fourHourFreqTestData.csv` // Data saved in 'fourHourFreqTestData.csv' file.
	}
	await generateSine(startDate, endDate, options);
}


// Generates automated testing data over a one year period (for the whole year of 2020) at 23 minute intervals.
async function generateTwentyThreeMinuteTestingData() {
	const startDate = '2020-01-01 00:00:00';
	const endDate = '2020-12-31 23:59:59';
	const options = {
		timeStep: { minute: 23 }, // Data point intervals set to 23 minutes.
		periodLength: { month: 1.5 },
		maxAmplitude: 3,
		filename: `${__dirname}/../test/db/data/automatedTests/twentyThreeMinuteFreqTestData.csv` // Data saved in 'twentyThreeMinuteFreqTestData.csv' file.
	}
	await generateSine(startDate, endDate, options);
}


// Generates automated testing data over a one year period (for the whole year of 2020) at 15 minute intervals.
async function generateFifteenMinuteTestingData() {
	const startDate = '2020-01-01 00:00:00';
	const endDate = '2020-12-31 23:59:59';
	const options = {
		timeStep: { minute: 15 }, // Data point intervals set to 15 minutes.
		periodLength: { month: 1.5 },
		maxAmplitude: 3,
		filename: `${__dirname}/../test/db/data/automatedTests/fifteenMinuteFreqTestData.csv` // Data saved in 'fifteenMinuteFreqTestData.csv' file.
	}
	await generateSine(startDate, endDate, options);
}


// Generates automated testing data over a one year period (for the whole year of 2020) at 1 minute intervals.
async function generateOneMinuteTestingData() {
	const startDate = '2020-01-01 00:00:00';
	const endDate = '2020-12-31 23:59:59';
	const options = {
		timeStep: { minute: 1 }, // Data point intervals set to 1 minute.
		periodLength: { month: 1.5 },
		maxAmplitude: 3,
		filename: `${__dirname}/../test/db/data/automatedTests/oneMinuteFreqTestData.csv` // Data saved in 'oneMinuteFreqTestData.csv' file.
	}
	await generateSine(startDate, endDate, options);
}



module.exports = {
	generateVariableSineTestingData,
	generateVariableCosineTestingData,
	generateFourDayTestingData,
	generateFourHourTestingData,
	generateTwentyThreeMinuteTestingData,
	generateFifteenMinuteTestingData,
	generateOneMinuteTestingData
};
