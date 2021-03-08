/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


/**
 * This file contains a series of functions used to generate (at some point automated - hopefully) test data.
 */


const promisify = require('es6-promisify');
const csv = require('csv');
const parseCsv = promisify(csv.parse);
const { generateSine, generateCosine } = require('./generateTestingData');



/**
 * Generates sinusoidal testing data over a two year period (2020 to 2021, inclusive) and then
 * saves the data in an appropriately-named file under '../test/db/data/automatedTests/'.
 * @param {number} [frequency=15] - desired frequency of the sinusoidal test data in minutes.
 */
async function generateSineTestingData(frequency = 15, amplitude) {
	adjustedAmp = 3 * (frequency / 60);
	const startDate = '2020-01-01 00:00:00';
	const endDate = '2021-12-31 23:59:59';
	const options = {
		timeStep: { minute: frequency },
		periodLength: { day: 1 }, // Wave period set to 1 day (See explanation below).
		maxAmplitude: adjustedAmp, // Since the data points are spaced every 'frequency' minutes ('frequency'/60 hours), the maxAmplitude is set to 
		// adjustedAmp so that the maximum *graphed* energy value will be adjustedAmp / (frequency / 60) = 3 * (frequency / 60) / (frequency / 60) = 3 kWh.
		filename: `${__dirname}/../test/db/data/automatedTests/${amplitude}Amp_${frequency}MinFreq_TestData.csv`
	};
	await generateSine(startDate, endDate, options);
}


/**
 * Generates cosinusoidal testing data over a two year period (2020 to 2021, inclusive) and
 * then saves the data in an appropriately-named file under '../test/db/data/automatedTests/'.
 * @param {number} [frequency=15] - desired frequency of the cosinusoidal test data, in minutes.
 */
async function generateCosineTestingData(frequency = 15, amplitude) {
	adjustedAmp = 3 * (frequency / 60);
	const startDate = '2020-01-01 00:00:00';
	const endDate = '2021-12-31 23:59:59';
	const options = {
		timeStep: { minute: frequency },
		periodLength: { day: 1 }, // Wave period set to 1 day (See explanation below).
		maxAmplitude: adjustedAmp, // Since the data points are spaced every 'frequency' minutes ('frequency'/60 hours), the maxAmplitude is set to 
		// adjustedAmp so that the maximum *graphed* energy value will be adjustedAmp / (frequency / 60) = 3 * (frequency / 60) / (frequency / 60) = 3 kWh.
		filename: `${__dirname}/../test/db/data/automatedTests/${amplitude}Amp_${frequency}MinFreq_TestData.csv`
	};
	await generateCosine(startDate, endDate, options);
}



/**
 * The next five functions -- generateFourDayTestingData(), generateFourHourTestingData(), generateTwentyThreeMinuteTestingData(),
 * generateFifteenMinuteTestingData(), and generateOneMinuteTestingData() -- have the following specifications:
 *  - periodLength (the period of the cycles) is set to 1 day so that over 12 months (360 days), the data consists of 360 sinusoidal cycles.
 *  - maxAmplitude (the amplitude of the cycles) is set differently for each function so that the maximum amplitude of the *graphed* data is always 3 kWh.
 *
 * Please see the documentation for 'generateSine()' under 'generateTestingData.js' for more details.
 */



/**
 * Generates one year of sinusoidal testing data (for the whole year of 2020) at 4 day intervals. The data is then stored in
 * 'fourDayFreqTestData.csv' under '../test/db/data/automatedTests/'.
 */
async function generateFourDayTestingData() {
	const startDate = '2020-01-01 00:00:00';
	const endDate = '2020-12-31 23:59:59';
	const options = {
		timeStep: { day: 4 }, // Data point intervals set to 4 days.
		periodLength: { day: 1 },
		maxAmplitude: 288, // Since the data points are spaced every 96 hours (4 days), the maxAmplitude is set to 288 so that the maximum 
		// *graphed* energy value will be 288/96 = 3 kWh.
		filename: `${__dirname}/../test/db/data/automatedTests/fourDayFreqTestData.csv` // Data saved in 'fourDayFreqTestData.csv' file.
	};
	await generateSine(startDate, endDate, options);
}



/**
 * Generates one year of sinusoidal testing data (for the whole year of 2020) at 4 hour intervals. The data is then stored in
 * 'fourHourFreqTestData.csv' under '../test/db/data/automatedTests/'.
 */
async function generateFourHourTestingData() {
	const startDate = '2020-01-01 00:00:00';
	const endDate = '2020-12-31 23:59:59';
	const options = {
		timeStep: { hour: 4 }, // Data point intervals set to 4 hours.
		periodLength: { day: 1 },
		maxAmplitude: 12, // Since the data points are spaced every 4 hours, the maxAmplitude is set to 12 so that the maximum *graphed* 
		// energy value will be 12/4 = 3 kWh.
		filename: `${__dirname}/../test/db/data/automatedTests/fourHourFreqTestData.csv` // Data saved in 'fourHourFreqTestData.csv' file.
	};
	await generateSine(startDate, endDate, options);
}



/**
 * Generates one year of sinusoidal testing data (for the whole year of 2020) at 23 minute intervals. The data is then stored in
 * 'twentyThreeMinuteFreqTestData.csv' under '../test/db/data/automatedTests/'.
 */
async function generateTwentyThreeMinuteTestingData() {
	const startDate = '2020-01-01 00:00:00';
	const endDate = '2020-12-31 23:59:59';
	const options = {
		timeStep: { minute: 23 }, // Data point intervals set to 23 minutes.
		periodLength: { day: 1 },
		maxAmplitude: 1.15, // Since the data points are spaced every 23 minutes (0.383 hours), the maxAmplitude is set to 1.15 so that the maximum 
		// *graphed* energy value will be 1.15/0.383 = 3 kWh.
		filename: `${__dirname}/../test/db/data/automatedTests/twentyThreeMinuteFreqTestData.csv` // Data saved in 'twentyThreeMinuteFreqTestData.csv' file.
	};
	await generateSine(startDate, endDate, options);
}



/**
 * Generates one year of sinusoidal testing data (for the whole year of 2020) at 15 minute intervals. The data is then stored in
 * 'fifteenMinuteFreqTestData.csv' under '../test/db/data/automatedTests/'.
 */
async function generateFifteenMinuteTestingData() {
	const startDate = '2020-01-01 00:00:00';
	const endDate = '2020-12-31 23:59:59';
	const options = {
		timeStep: { minute: 15 }, // Data point intervals set to 15 minutes.
		periodLength: { day: 1 },
		maxAmplitude: 0.75, // Since the data points are spaced every 15 minutes (0.25 hours), the maxAmplitude is set to 0.75 so that the maximum 
		// *graphed* energy value will be 0.75/0.25 = 3 kWh.
		filename: `${__dirname}/../test/db/data/automatedTests/fifteenMinuteFreqTestData.csv` // Data saved in 'fifteenMinuteFreqTestData.csv' file.
	};
	await generateSine(startDate, endDate, options);
}



/**
 * Generates one year of sinusoidal testing data (for the whole year of 2020) at 1 minute intervals. The data is then stored in
 * 'oneMinuteFreqTestData.csv' under '../test/db/data/automatedTests/'.
 */
async function generateOneMinuteTestingData() {
	const startDate = '2020-01-01 00:00:00';
	const endDate = '2020-12-31 23:59:59';
	const options = {
		timeStep: { minute: 1 }, // Data point intervals set to 1 minute.
		periodLength: { day: 1 },
		maxAmplitude: 0.05, // Since the data points are spaced every minute (0.0167 hours), the maxAmplitude is set to 0.05 so that the maximum 
		// *graphed* energy value will be 0.05/0.0167 = 3 kWh.
		filename: `${__dirname}/../test/db/data/automatedTests/oneMinuteFreqTestData.csv` // Data saved in 'oneMinuteFreqTestData.csv' file.
	};
	await generateSine(startDate, endDate, options);
}


 
/**
 * Calls the above functions with appropriate parameters to generate all the necessary testing data.
 * Each of the function calls will generate a csv file under '../test/db/data/automatedTests' that is needed for automated testing.
 */
function generateTestingData() {

// Generates 1 year of sinusoidal data with data points at 4-day intervals
generateFourDayTestingData();

// Generates 1 year of sinusoidal data with data points at 4-hour intervals
generateFourHourTestingData();

// Generates 1 year of sinusoidal data with data points at 4-day intervals
generateTwentyThreeMinuteTestingData();

// Generates 1 year of sinusoidal data with data points at 4-day intervals
generateFifteenMinuteTestingData();

// Generates 1 year of sinusoidal data with data points at 4-day intervals
generateOneMinuteTestingData();


// Generates 7 files, all containing 2 years of sinusoidal data, and each with a unique amplitude between 1 and 7. More specifically,
// the first file contains sine waves with an amplitude of 1, the second contains waves with an amplitude of 2, and so on until
// the seventh which contains waves an amplitude of 7.
for (var i = 1; i <= 7; i++) {
	generateSineTestingData(15, i);
}


// Generates 2 years of sinusoidal data with an amplitude of 2 and with data points at 15-minute intervals.
generateSineTestingData(15, 2);

// Generates 2 years of cosinusoidal data with an amplitude of 3 and with data points at 2-minute intervals.
generateCosineTestingData(23, 3);
}



module.exports = {
	generateFourDayTestingData,
	generateFourHourTestingData,
	generateTwentyThreeMinuteTestingData,
	generateFifteenMinuteTestingData,
	generateOneMinuteTestingData,
	generateVariableSineTestingData,
	generateVariableCosineTestingData
};
