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
 * @param {number} [frequency=15] - desired frequency of the sinusoidal test data (in minutes).
 * @param {number} [amplitude] - desired amplitude of the sinusoidal test data.
 */
async function generateSineTestingData(frequency = 15, amplitude) {
	const startDate = '2020-01-01 00:00:00';
	const endDate = '2021-12-31 23:59:59';
	const options = {
		timeStep: { minute: frequency },
		periodLength: { day: 45 }, // Wave period set to 45 days.
		maxAmplitude: amplitude,
		filename: `${__dirname}/../test/db/data/automatedTests/${frequency}FreqSineTestData.csv`,
		normalizeByHour: true
	};
	await generateSine(startDate, endDate, options);
}


/**
 * Generates squared sinusoidal testing data over a two year period (2020 to 2021, inclusive) and then
 * saves the data in an appropriately named file under '../test/db/data/automatedTests/'.
 * @param {number} [frequency=15] - desired frequency of the squared sinusoidal test data (in minutes).
 * @param {number} [amplitude] - desired amplitude of the squared sinusoidal test data.
 */
async function generateSineSquaredTestingData(frequency = 15, amplitude) {
	const startDate = '2020-01-01 00:00:00';
	const endDate = '2021-12-31 23:59:59';
	const options = {
		timeStep: { minute: frequency },
		periodLength: { day: 45 }, // Wave period set to 45 days.
		maxAmplitude: amplitude,
		filename: `${__dirname}/../test/db/data/automatedTests/${frequency}FreqSineSquaredTestData.csv`,
		normalizeByHour: true,
		squared: true // Option set to true because want sine *squared* data.
	};
	await generateSine(startDate, endDate, options); 
}


/**
 * Generates cosinusoidal testing data over a two year period (2020 to 2021, inclusive) and
 * then saves the data in an appropriately-named file under '../test/db/data/automatedTests/'.
 * @param {number} [frequency=15] - desired frequency of the cosinusoidal test data (in minutes).
 * @param {number} [amplitude] - desired amplitude of the cosinusoidal test data.
 */
async function generateCosineTestingData(frequency = 15, amplitude) {
	const startDate = '2020-01-01 00:00:00';
	const endDate = '2021-12-31 23:59:59';
	const options = {
		timeStep: { minute: frequency },
		periodLength: { day: 45 }, // Wave period set to 45 days.
		maxAmplitude: amplitude,
		filename: `${__dirname}/../test/db/data/automatedTests/${frequency}FreqCosineTestData.csv`,
		normalizeByHour: true
	};
	await generateCosine(startDate, endDate, options);
}


/**
 * Generates squared cosinusoidal testing data over a two year period (2020 to 2021, inclusive) and then
 * saves the data in an appropriately named file under '../test/db/data/automatedTests/'.
 * @param {number} [frequency=15] - desired frequency of the squared cosinusoidal test data (in minutes).
 * @param {number} [amplitude] - desired amplitude of the squared cosinusoidal test data.
 */
async function generateCosineSquaredTestingData(frequency = 15, amplitude) {
	const startDate = '2020-01-01 00:00:00';
	const endDate = '2021-12-31 23:59:59';
	const options = {
		timeStep: { minute: frequency },
		periodLength: { day: 45 }, // Wave period set to 45 days.
		maxAmplitude: amplitude,
		filename: `${__dirname}/../test/db/data/automatedTests/${frequency}FreqCosineSquaredTestData.csv`,
		normalizeByHour: true,
		squared: true // Option set to true because want cosine *squared* data.
	};
	await generateCosine(startDate, endDate, options);
}



/**
 * The next five functions -- generateFourDayTestingData(), generateFourHourTestingData(), generateTwentyThreeMinuteTestingData(),
 * generateFifteenMinuteTestingData(), and generateOneMinuteTestingData() -- have no parameters as they generate one year of data at
 * pre-specified intervals. All have wave periods of 45 minutes for easy visual display.
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
		timeStep: { minute: 5760 }, // Data point intervals set to 5760 minutes = 96 hours = 4 days.
		periodLength: { day: 45 },
		maxAmplitude: 3,
		filename: `${__dirname}/../test/db/data/automatedTests/fourDayFreqTestData.csv`, // Data saved in 'fourDayFreqTestData.csv' file.
		normalizeByHour: true
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
		timeStep: { minute: 240 }, // Data point intervals set to 240 minutes = 4 hours.
		periodLength: { day: 45 },
		maxAmplitude: 3,
		filename: `${__dirname}/../test/db/data/automatedTests/fourHourFreqTestData.csv`, // Data saved in 'fourHourFreqTestData.csv' file
		normalizeByHour: true
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
		periodLength: { day: 45 },
		maxAmplitude: 3,
		filename: `${__dirname}/../test/db/data/automatedTests/twentyThreeMinuteFreqTestData.csv`, /* Data saved in
		'twentyThreeMinuteFreqTestData.csv' file. */
		normalizeByHour: true
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
		periodLength: { day: 45 },
		maxAmplitude: 3,
		filename: `${__dirname}/../test/db/data/automatedTests/fifteenMinuteFreqTestData.csv`, // Data saved in 'fifteenMinuteFreqTestData.csv' file.
		normalizeByHour: true
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
		periodLength: { day: 45 },
		maxAmplitude: 3,
		filename: `${__dirname}/../test/db/data/automatedTests/oneMinuteFreqTestData.csv`, // Data saved in 'oneMinuteFreqTestData.csv' file.
		normalizeByHour: true
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

	// Generates 1 year of sinusoidal data with data points at 23-minute intervals
	generateTwentyThreeMinuteTestingData();

	// Generates 1 year of sinusoidal data with data points at 15-minute intervals
	generateFifteenMinuteTestingData();

	// Generates 1 year of sinusoidal data with data points at 1-minute intervals
	generateOneMinuteTestingData();

	// Generates 2 years of sinusoidal data with an amplitude of 2 and with data points at 15-minute intervals.
	generateSineTestingData(15, 2);

	// Generates 2 years of cosinusoidal data with an amplitude of 3 and with data points at 23-minute intervals.
	generateCosineTestingData(23, 3);

	// Generates 2 years of *squared* sinusoidal data with an amplitude of 2 and with data points at 15-minute intervals.
	generateSineSquaredTestingData(15, 2);

	// Generates 2 years of *squared* cosinusoidal data with an amplitude of 3 and with data points at 23-minute intervals.
	generateCosineSquaredTestingData(23, 3);
}


/**
 * Generates 7 files, all containing 2 years of sinusoidal data, and each with a unique amplitude between 1 and 7. More specifically,
 * the first file contains sine waves with an amplitude of 1, the second contains waves with an amplitude of 2, and so on until
 * the seventh which contains waves an amplitude of 7.
 */
function generateVariableAmplitudeTestingData() {
	for (var i = 1; i <= 7; i++) {
		generateSineTestingData(15, i);
	}
}



module.exports = {
	generateFourDayTestingData,
	generateFourHourTestingData,
	generateTwentyThreeMinuteTestingData,
	generateFifteenMinuteTestingData,
	generateOneMinuteTestingData,
	generateSineTestingData,
	generateCosineTestingData,
	generateSineSquaredTestingData,
	generateCosineSquaredTestingData
};
